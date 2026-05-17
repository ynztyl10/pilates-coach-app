const OSS = require('ali-oss');
const crypto = require('crypto');

const REGION = process.env.OSS_REGION || 'oss-cn-hangzhou';
const BUCKET = process.env.OSS_BUCKET || 'pilates-coach-handbook';

const ossClient = new OSS({
  region: REGION,
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  bucket: BUCKET,
  secure: true,
  timeout: 30000,
});

const MEMBERS_PREFIX = 'data/members/';
const PLANS_PREFIX = 'data/plans/';
const PERSONALIZED_PLANS_PREFIX = 'data/personalized-plans/';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function ok(body) { return response(200, body); }
function created(body) { return response(201, body); }
function noContent() { return response(204, null); }
function notFound(msg) { return response(404, { code: 'NOT_FOUND', message: msg }); }
function badRequest(msg, field) { return response(400, { code: 'VALIDATION_ERROR', message: msg, field }); }
function serverError(msg) { return response(500, { code: 'SERVER_ERROR', message: msg }); }

async function getJson(key) {
  try {
    const result = await ossClient.get(key);
    return JSON.parse(result.content.toString());
  } catch (e) {
    if (e.code === 'NoSuchKey') return null;
    throw e;
  }
}

async function putJson(key, data) {
  await ossClient.put(key, Buffer.from(JSON.stringify(data, null, 2)), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function deleteObject(key) {
  try {
    await ossClient.delete(key);
  } catch (e) {
    if (e.code !== 'NoSuchKey') throw e;
  }
}

async function listIds(prefix) {
  const ids = [];
  let marker = null;
  do {
    const result = await ossClient.list({ prefix, marker, 'max-keys': 100 });
    result.objects?.forEach(obj => {
      const name = obj.name.replace(prefix, '');
      if (name && !name.startsWith('_') && name.endsWith('.json')) {
        ids.push(name.replace('.json', ''));
      }
    });
    marker = result.nextMarker;
  } while (marker);
  return ids;
}

// ===== Members =====

async function listMembers() {
  const ids = await listIds(MEMBERS_PREFIX);
  const members = [];
  for (const id of ids) {
    const m = await getJson(`${MEMBERS_PREFIX}${id}.json`);
    if (m) members.push(m);
  }
  members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: members, total: members.length });
}

async function createMember(body) {
  if (!body.name?.trim()) return badRequest('会员姓名不能为空', 'name');
  if (!body.gender) return badRequest('性别不能为空', 'gender');

  const now = new Date().toISOString();
  const member = {
    id: 'mem-' + crypto.randomUUID(),
    name: body.name.trim(),
    gender: body.gender,
    age: body.age,
    parous: body.parous ?? false,
    goals: body.goals || [],
    focusAreas: body.focusAreas || [],
    painPoints: body.painPoints || [],
    medicalNotes: body.medicalNotes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await putJson(`${MEMBERS_PREFIX}${member.id}.json`, member);
  return created(member);
}

async function getMember(id) {
  const member = await getJson(`${MEMBERS_PREFIX}${id}.json`);
  if (!member) return notFound('会员不存在');
  return ok(member);
}

async function updateMember(id, body) {
  const member = await getJson(`${MEMBERS_PREFIX}${id}.json`);
  if (!member) return notFound('会员不存在');

  const updated = {
    ...member,
    ...(body.name !== undefined && { name: body.name.trim() }),
    ...(body.gender !== undefined && { gender: body.gender }),
    ...(body.age !== undefined && { age: body.age }),
    ...(body.parous !== undefined && { parous: body.parous }),
    ...(body.goals !== undefined && { goals: body.goals }),
    ...(body.focusAreas !== undefined && { focusAreas: body.focusAreas }),
    ...(body.painPoints !== undefined && { painPoints: body.painPoints }),
    ...(body.medicalNotes !== undefined && {
      medicalNotes: body.medicalNotes.trim() || undefined,
    }),
    updatedAt: new Date().toISOString(),
  };

  await putJson(`${MEMBERS_PREFIX}${id}.json`, updated);
  return ok(updated);
}

async function deleteMember(id) {
  await deleteObject(`${MEMBERS_PREFIX}${id}.json`);
  const planIds = await listIds(PLANS_PREFIX);
  for (const planId of planIds) {
    const plan = await getJson(`${PLANS_PREFIX}${planId}.json`);
    if (plan && plan.memberId === id) {
      await deleteObject(`${PLANS_PREFIX}${planId}.json`);
    }
  }
  return noContent();
}

// ===== Plans =====

async function listPlans(query) {
  const memberId = query.memberId;
  const planIds = await listIds(PLANS_PREFIX);
  const plans = [];
  for (const id of planIds) {
    const plan = await getJson(`${PLANS_PREFIX}${id}.json`);
    if (plan && (!memberId || plan.memberId === memberId)) {
      plans.push({
        id: plan.id,
        title: plan.title,
        createdAt: plan.createdAt,
        itemCount: plan.items?.length || 0,
      });
    }
  }
  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: plans });
}

async function createPlan(body) {
  if (!body.memberId) return badRequest('memberId 不能为空', 'memberId');
  if (!body.title?.trim()) return badRequest('计划标题不能为空', 'title');

  const plan = {
    id: 'plan-' + crypto.randomUUID(),
    memberId: body.memberId,
    title: body.title.trim(),
    items: body.items || [],
    notes: body.notes || undefined,
    createdAt: new Date().toISOString(),
  };

  await putJson(`${PLANS_PREFIX}${plan.id}.json`, plan);
  return created(plan);
}

async function getPlan(id) {
  const plan = await getJson(`${PLANS_PREFIX}${id}.json`);
  if (!plan) return notFound('计划不存在');

  const member = await getJson(`${MEMBERS_PREFIX}${plan.memberId}.json`);
  return ok({ ...plan, member: member || undefined });
}

async function updatePlan(id, body) {
  const plan = await getJson(`${PLANS_PREFIX}${id}.json`);
  if (!plan) return notFound('计划不存在');

  const updated = {
    ...plan,
    ...(body.items !== undefined && { items: body.items }),
    ...(body.notes !== undefined && { notes: body.notes || undefined }),
  };

  await putJson(`${PLANS_PREFIX}${id}.json`, updated);
  return ok(updated);
}

async function deletePlan(id) {
  await deleteObject(`${PLANS_PREFIX}${id}.json`);
  return noContent();
}

// ===== Personalized Plans =====

async function listPersonalizedPlans(query) {
  const memberId = query.memberId;
  const ids = await listIds(PERSONALIZED_PLANS_PREFIX);
  const plans = [];
  for (const id of ids) {
    const plan = await getJson(`${PERSONALIZED_PLANS_PREFIX}${id}.json`);
    if (plan && (!memberId || plan.memberId === memberId)) {
      plans.push({
        id: plan.id,
        title: plan.title,
        createdAt: plan.createdAt,
      });
    }
  }
  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ok({ data: plans });
}

async function createPersonalizedPlan(body) {
  if (!body.memberId) return badRequest('memberId 不能为空', 'memberId');
  if (!body.title?.trim()) return badRequest('计划标题不能为空', 'title');

  const plan = {
    id: 'pplan-' + crypto.randomUUID(),
    memberId: body.memberId,
    title: body.title.trim(),
    createdAt: new Date().toISOString(),
    homework: body.homework || [],
    classModules: body.classModules || [],
    contraindications: body.contraindications || [],
    specialNotes: body.specialNotes || [],
  };

  await putJson(`${PERSONALIZED_PLANS_PREFIX}${plan.id}.json`, plan);
  return created(plan);
}

async function getPersonalizedPlan(id) {
  const plan = await getJson(`${PERSONALIZED_PLANS_PREFIX}${id}.json`);
  if (!plan) return notFound('计划不存在');

  const member = await getJson(`${MEMBERS_PREFIX}${plan.memberId}.json`);
  return ok({ ...plan, member: member || undefined });
}

async function updatePersonalizedPlan(id, body) {
  const plan = await getJson(`${PERSONALIZED_PLANS_PREFIX}${id}.json`);
  if (!plan) return notFound('计划不存在');

  const updated = {
    ...plan,
    ...(body.title !== undefined && { title: body.title.trim() }),
    ...(body.homework !== undefined && { homework: body.homework }),
    ...(body.classModules !== undefined && { classModules: body.classModules }),
    ...(body.contraindications !== undefined && { contraindications: body.contraindications }),
    ...(body.specialNotes !== undefined && { specialNotes: body.specialNotes }),
    updatedAt: new Date().toISOString(),
  };

  await putJson(`${PERSONALIZED_PLANS_PREFIX}${id}.json`, updated);
  return ok(updated);
}

async function deletePersonalizedPlan(id) {
  await deleteObject(`${PERSONALIZED_PLANS_PREFIX}${id}.json`);
  return noContent();
}

// ===== Router =====

function parsePath(path) {
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  const segments = clean.split('/').filter(Boolean);
  return { segments, clean };
}

function parseQuery(queryString) {
  const result = {};
  if (!queryString) return result;
  const params = new URLSearchParams(queryString);
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

function parseEvent(event) {
  let evt = event;
  if (Buffer.isBuffer(event)) {
    evt = JSON.parse(event.toString());
  } else if (typeof event === 'string') {
    evt = JSON.parse(event);
  }
  return evt;
}

function parseBody(evt) {
  if (!evt.body) return {};
  let bodyStr = evt.body;
  if (evt.isBase64Encoded) {
    bodyStr = Buffer.from(evt.body, 'base64').toString();
  }
  try {
    return JSON.parse(bodyStr);
  } catch {
    return {};
  }
}

// 阿里云 FC 3.0 Event 函数入口（配合 HTTP Trigger）
exports.handler = (event, context, callback) => {
  try {
    const evt = parseEvent(event);
    const http = evt.requestContext?.http || {};
    const method = (http.method || 'GET').toUpperCase();
    const path = evt.rawPath || '/';
    const query = evt.queryParameters || {};
    const body = parseBody(evt);

    // Handle preflight CORS
    if (method === 'OPTIONS') {
      callback(null, {
        statusCode: 204,
        headers: corsHeaders(),
        body: '',
      });
      return;
    }

    const { segments } = parsePath(path);

    Promise.resolve().then(async () => {
      // Members
      if (segments[0] === 'members' && !segments[1]) {
        if (method === 'GET') return await listMembers();
        if (method === 'POST') return await createMember(body);
      }
      if (segments[0] === 'members' && segments[1]) {
        const id = segments[1];
        if (method === 'GET') return await getMember(id);
        if (method === 'PUT') return await updateMember(id, body);
        if (method === 'DELETE') return await deleteMember(id);
      }

      // Plans
      if (segments[0] === 'plans' && !segments[1]) {
        if (method === 'GET') return await listPlans(query);
        if (method === 'POST') return await createPlan(body);
      }
      if (segments[0] === 'plans' && segments[1]) {
        const id = segments[1];
        if (method === 'GET') return await getPlan(id);
        if (method === 'PUT') return await updatePlan(id, body);
        if (method === 'DELETE') return await deletePlan(id);
      }

      // Personalized Plans
      if (segments[0] === 'personalized-plans' && !segments[1]) {
        if (method === 'GET') return await listPersonalizedPlans(query);
        if (method === 'POST') return await createPersonalizedPlan(body);
      }
      if (segments[0] === 'personalized-plans' && segments[1]) {
        const id = segments[1];
        if (method === 'GET') return await getPersonalizedPlan(id);
        if (method === 'PUT') return await updatePersonalizedPlan(id, body);
        if (method === 'DELETE') return await deletePersonalizedPlan(id);
      }

      return response(404, { code: 'NOT_FOUND', message: '接口不存在' });
    }).then(result => {
      callback(null, result);
    }).catch(err => {
      console.error('FC Error:', err);
      callback(null, serverError(err.message));
    });
  } catch (err) {
    console.error('FC Sync Error:', err);
    callback(null, serverError(err.message));
  }
};
