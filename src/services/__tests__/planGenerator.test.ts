import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  autoSelectKnowledge,
  generatePlan,
  getPlan,
  listPlans,
  updatePlan,
  deletePlan,
} from '../planGenerator';
import { mockFetch, jsonResponse } from './setup';

describe('PlanGenerator', () => {
  let restoreFetch: () => void;
  let mockMembers: Map<string, any> = new Map();
  let mockPlans: Map<string, any> = new Map();

  beforeEach(() => {
    mockMembers = new Map();
    mockPlans = new Map();

    restoreFetch = mockFetch({});

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = new URL(url).pathname;
      const search = new URL(url).search;
      const method = init?.method || 'GET';

      // Members API
      if (path === '/members' && method === 'POST') {
        const body = JSON.parse(init?.body as string);
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockMembers.set(member.id, member);
        return jsonResponse(member, 201);
      }

      if (path.startsWith('/members/') && method === 'GET') {
        const id = path.split('/members/')[1];
        const member = mockMembers.get(id);
        if (!member) {
          return jsonResponse({ code: 'NOT_FOUND', message: '会员不存在' }, 404);
        }
        return jsonResponse(member);
      }

      // Plans API
      if (path === '/plans' && method === 'POST') {
        const body = JSON.parse(init?.body as string);
        const plan = {
          id: 'plan-' + crypto.randomUUID(),
          memberId: body.memberId,
          title: body.title,
          items: body.items || [],
          notes: body.notes,
          createdAt: new Date().toISOString(),
        };
        mockPlans.set(plan.id, plan);
        return jsonResponse(plan, 201);
      }

      if (path === '/plans' && method === 'GET') {
        const memberId = new URLSearchParams(search).get('memberId');
        const data = Array.from(mockPlans.values())
          .filter((p: any) => !memberId || p.memberId === memberId)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            createdAt: p.createdAt,
            itemCount: p.items?.length || 0,
          }));
        return jsonResponse({ data });
      }

      if (path.startsWith('/plans/') && method === 'GET') {
        const id = path.split('/plans/')[1];
        const plan = mockPlans.get(id);
        if (!plan) {
          return jsonResponse({ code: 'NOT_FOUND', message: '计划不存在' }, 404);
        }
        const member = mockMembers.get(plan.memberId);
        return jsonResponse({ ...plan, member: member || undefined });
      }

      if (path.startsWith('/plans/') && method === 'PUT') {
        const id = path.split('/plans/')[1];
        const existing = mockPlans.get(id);
        if (!existing) {
          return jsonResponse({ code: 'NOT_FOUND', message: '计划不存在' }, 404);
        }
        const body = JSON.parse(init?.body as string);
        const updated = {
          ...existing,
          ...(body.items !== undefined && { items: body.items }),
          ...(body.notes !== undefined && { notes: body.notes || undefined }),
        };
        mockPlans.set(id, updated);
        return jsonResponse(updated);
      }

      if (path.startsWith('/plans/') && method === 'DELETE') {
        const id = path.split('/plans/')[1];
        mockPlans.delete(id);
        return new Response(null, { status: 204 });
      }

      return jsonResponse({ code: 'NOT_FOUND', message: '接口不存在' }, 404);
    }) as any;
  });

  afterEach(() => {
    restoreFetch();
  });

  async function createMember(input: any) {
    const res = await globalThis.fetch('https://pilates-api-bxuxaedksi.cn-hangzhou.fcapp.run/members', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.json();
  }

  describe('autoSelectKnowledge', () => {
    it('should match by focusAreas (category)', () => {
      const member = {
        id: 'test-1',
        name: '测试',
        gender: 'female',
        focusAreas: ['脊柱'],
        painPoints: [],
        goals: [],
      } as any;
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should match by painPoints (name)', () => {
      const member = {
        id: 'test-2',
        name: '测试',
        gender: 'female',
        focusAreas: [],
        painPoints: ['头前引'],
        goals: [],
      } as any;
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should match by goals (tags)', () => {
      const member = {
        id: 'test-3',
        name: '测试',
        gender: 'female',
        focusAreas: [],
        painPoints: [],
        goals: ['posture_correction'],
      } as any;
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should combine multiple match strategies without duplicates', () => {
      const member = {
        id: 'test-4',
        name: '测试',
        gender: 'female',
        focusAreas: ['脊柱'],
        painPoints: ['头前引'],
        goals: ['core_strength'],
      } as any;
      const ids = autoSelectKnowledge(member);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no matches', () => {
      const member = {
        id: 'test-5',
        name: '测试',
        gender: 'female',
        focusAreas: [],
        painPoints: [],
        goals: [],
      } as any;
      const ids = autoSelectKnowledge(member);
      expect(ids).toEqual([]);
    });
  });

  describe('generatePlan', () => {
    it('should throw for non-existent member', async () => {
      await expect(
        generatePlan({
          memberId: 'non-existent',
          selectedKnowledgeIds: [],
        })
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should generate plan with manual selection', async () => {
      const member = await createMember({
        name: '张女士',
        gender: 'female',
        focusAreas: ['脊柱'],
      });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      expect(plan.id).toMatch(/^plan-/);
      expect(plan.memberId).toBe(member.id);
      expect(plan.title).toContain('张女士');
      expect(plan.items.length).toBe(1);
      expect(plan.items[0].knowledgeId).toBe('forward-head');
      expect(plan.items[0].actions.length).toBeGreaterThan(0);
      expect(plan.createdAt).toBeDefined();
    });

    it('should include auto-selected items when autoSelect is true', async () => {
      const member = await createMember({
        name: '李女士',
        gender: 'female',
        focusAreas: ['脊柱'],
      });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: [],
        autoSelect: true,
      });

      expect(plan.items.length).toBeGreaterThan(0);
    });

    it('should use custom title when provided', async () => {
      const member = await createMember({
        name: '王女士',
        gender: 'female',
      });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
        planTitle: '自定义计划标题',
      });
      expect(plan.title).toBe('自定义计划标题');
    });

    it('should generate default title when no custom title', async () => {
      const member = await createMember({
        name: '赵女士',
        gender: 'female',
        focusAreas: ['脊柱', '骨盆'],
      });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });
      expect(plan.title).toBe('赵女士 - 脊柱与骨盆专项训练计划');
    });
  });

  describe('getPlan', () => {
    it('should return null for non-existent plan', async () => {
      expect(await getPlan('non-existent')).toBeNull();
    });

    it('should return plan with member info', async () => {
      const member = await createMember({
        name: '测试',
        gender: 'female',
      });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });
      const found = await getPlan(plan.id);
      expect(found?.id).toBe(plan.id);
      expect(found?.member?.name).toBe('测试');
    });
  });

  describe('listPlans', () => {
    it('should return empty list for member with no plans', async () => {
      const member = await createMember({ name: '测试', gender: 'female' });
      const result = await listPlans(member.id);
      expect(result.data).toEqual([]);
    });

    it('should return only plans for the specified member', async () => {
      const m1 = await createMember({ name: 'A', gender: 'female' });
      const m2 = await createMember({ name: 'B', gender: 'male' });

      await generatePlan({ memberId: m1.id, selectedKnowledgeIds: ['forward-head'] });
      await generatePlan({ memberId: m2.id, selectedKnowledgeIds: ['forward-head'] });
      await generatePlan({ memberId: m1.id, selectedKnowledgeIds: ['forward-head'] });

      const result = await listPlans(m1.id);
      expect(result.data.length).toBe(2);
    });
  });

  describe('updatePlan', () => {
    it('should throw for non-existent plan', async () => {
      await expect(updatePlan('non-existent', { notes: '新备注' })).rejects.toThrow();
    });

    it('should update plan items order', async () => {
      const member = await createMember({ name: '测试', gender: 'female' });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      const newItems = [...plan.items];
      const updated = await updatePlan(plan.id, { items: newItems });
      expect(updated.items.length).toBe(1);
    });

    it('should update plan notes', async () => {
      const member = await createMember({ name: '测试', gender: 'female' });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      const updated = await updatePlan(plan.id, { notes: '教练备注内容' });
      expect(updated.notes).toBe('教练备注内容');
    });
  });

  describe('deletePlan', () => {
    it('should delete plan silently', async () => {
      const member = await createMember({ name: '测试', gender: 'female' });
      const plan = await generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      await deletePlan(plan.id);
      expect(await getPlan(plan.id)).toBeNull();
    });

    it('should not throw when deleting non-existent plan', async () => {
      await expect(deletePlan('non-existent')).resolves.not.toThrow();
    });
  });
});
