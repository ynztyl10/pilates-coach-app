/**
 * 智能综合训练计划引擎
 * 根据会员体态描述和病史自动生成个性化训练计划
 */

import { knowledgeBase } from '../data/knowledge';
import {
  conditionSynonyms,
  matchConditionsByText,
  matchConditionsByLabels,
} from '../data/conditionSynonyms';
import { matchMedicalHistoryRules, mergeMedicalRules } from '../data/medicalHistoryRules';
import {
  PersonalizedPlan,
  PersonalizedPlanInput,
  HomeworkItem,
  ClassModule,
  Contraindication,
  SpecialNote,
  ExtractedModule,
  MatchedKnowledge,
} from '../types/personalizedPlan';
import { getMember } from './memberService';
import { api } from './api';

/**
 * 第一步：关键词匹配知识库条目
 */
export function matchConditions(
  conditions: string[],
  conditionText?: string
): MatchedKnowledge[] {
  const ids = new Set<string>();

  // 标签匹配
  if (conditions.length > 0) {
    const labelIds = matchConditionsByLabels(conditions);
    labelIds.forEach(id => ids.add(id));
  }

  // 自然语言匹配
  if (conditionText) {
    const textIds = matchConditionsByText(conditionText);
    textIds.forEach(id => ids.add(id));
  }

  // 构建匹配结果
  const matched: MatchedKnowledge[] = [];
  for (const id of ids) {
    const knowledge = knowledgeBase.find(k => k.id === id);
    if (knowledge) {
      matched.push({
        id: knowledge.id,
        name: knowledge.name,
        category: knowledge.category,
        score: 10, // 基础匹配分
      });
    }
  }

  return matched;
}

/**
 * 第二步：从匹配条目的 anatomy 中提取肌肉信息
 * 解析 anatomy[1]（肌肉失衡分析）
 */
export function extractModulesFromKnowledge(knowledgeId: string): ExtractedModule[] {
  const knowledge = knowledgeBase.find(k => k.id === knowledgeId);
  if (!knowledge) return [];

  const modules: ExtractedModule[] = [];
  const anatomyText = knowledge.anatomy[1] || '';
  const priorityText = knowledge.anatomy[2] || '';

  // 提取优先级数字
  let basePriority = 2;
  if (priorityText.includes('第一优先级')) basePriority = 1;
  else if (priorityText.includes('第二优先级')) basePriority = 2;
  else if (priorityText.includes('第三优先级')) basePriority = 3;
  else if (priorityText.includes('第四优先级')) basePriority = 4;

  // 提取推荐方向：取 training.actions 的前2个动作名
  const directions = knowledge.training.actions
    .slice(0, 2)
    .map(a => a.name)
    .join('、');

  // 解析肌肉失衡文本
  // 格式：① 肌肉名 → 原因 → 原因 ★ 关键
  const musclePattern = /[①②③④⑤](.+?)(?=[①②③④⑤]|$)/gs;
  const muscles = anatomyText.match(musclePattern) || [];

  for (const muscleBlock of muscles) {
    const lines = muscleBlock.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // 第一行是肌肉名，如 "① 腓肠肌 + 比目鱼肌（小腿三头肌）"
    let muscleName = lines[0].replace(/^[①②③④⑤]\s*/, '').trim();
    // 去掉括号内的英文说明
    muscleName = muscleName.replace(/\s*[（(].*?[)）]/g, '').trim();
    // 去掉"（松解优先）"等标签
    muscleName = muscleName.replace(/（[^）]*优先[^）]*）/g, '').trim();

    // 提取原因：所有以 → 开头的行
    const reasons: string[] = [];
    for (const line of lines) {
      if (line.includes('→') && !line.includes('★')) {
        const reason = line.replace(/.*?→\s*/, '').trim();
        if (reason) reasons.push(reason);
      }
    }

    // 判断是紧张还是薄弱
    // 查找"被拉长/薄弱/无力"部分的起始位置
    const weakStart = anatomyText.search(/── 被拉长|── 薄弱|── 无力/);
    const compensatoryStart = anatomyText.search(/── 代偿/);
    const blockPos = anatomyText.indexOf(muscleBlock);

    let isTight: boolean;
    if (weakStart !== -1 && blockPos >= weakStart) {
      // 肌肉块在薄弱部分之后
      if (compensatoryStart !== -1 && blockPos >= compensatoryStart) {
        isTight = true; // 代偿性紧张
      } else {
        isTight = false; // 被拉长且无力 / 薄弱
      }
    } else {
      isTight = true; // 缩短且紧张
    }

    if (muscleName && reasons.length > 0) {
      modules.push({
        priority: isTight ? 1 : basePriority,
        targetMuscle: muscleName,
        reason: reasons.join('；'),
        direction: directions,
        sourceId: knowledge.id,
        isStretch: isTight,
      });
    }
  }

  return modules;
}

/**
 * 第三步：去重合并
 * 同一肌肉出现在多个条目中时，合并原因和来源
 */
export function deduplicateModules(modules: ExtractedModule[]): {
  homeworkModules: ExtractedModule[];
  classModules: ExtractedModule[];
} {
  const homeworkMap = new Map<string, ExtractedModule>();
  const classMap = new Map<string, ExtractedModule>();

  for (const mod of modules) {
    const targetMap = mod.isStretch ? homeworkMap : classMap;

    if (targetMap.has(mod.targetMuscle)) {
      const existing = targetMap.get(mod.targetMuscle)!;
      // 合并原因
      if (!existing.reason.includes(mod.reason)) {
        existing.reason = `${existing.reason}；${mod.reason}`;
      }
      // 合并来源
      if (!existing.sourceId.includes(mod.sourceId)) {
        existing.sourceId = `${existing.sourceId},${mod.sourceId}`;
      }
      // 取最小优先级
      if (mod.priority < existing.priority) {
        existing.priority = mod.priority;
      }
    } else {
      targetMap.set(mod.targetMuscle, { ...mod });
    }
  }

  return {
    homeworkModules: Array.from(homeworkMap.values()).sort((a, b) => a.priority - b.priority),
    classModules: Array.from(classMap.values()).sort((a, b) => a.priority - b.priority),
  };
}

/**
 * 第四步：叠加病史禁忌症
 */
export function applyMedicalHistory(
  historyLabels: string[],
  historyText?: string
): { contraindications: Contraindication[]; specialNotes: SpecialNote[] } {
  const fullText = [...historyLabels, historyText || ''].join(' ');
  const rules = matchMedicalHistoryRules(fullText);
  const merged = mergeMedicalRules(rules);

  return {
    contraindications: merged.contraindications,
    specialNotes: merged.specialNotes.map(note => ({ note })),
  };
}

/**
 * 第五步：生成完整计划
 */
export async function generatePersonalizedPlan(
  input: PersonalizedPlanInput
): Promise<PersonalizedPlan> {
  const member = await getMember(input.memberId);
  if (!member) {
    throw new Error('NOT_FOUND');
  }

  // 1. 匹配知识库条目
  const matched = matchConditions(input.conditions, input.conditionText);

  // 2. 提取模块
  let allModules: ExtractedModule[] = [];
  for (const m of matched) {
    const modules = extractModulesFromKnowledge(m.id);
    allModules = allModules.concat(modules);
  }

  // 3. 去重合并
  const { homeworkModules, classModules } = deduplicateModules(allModules);

  // 4. 应用病史规则
  const { contraindications, specialNotes } = applyMedicalHistory(
    input.medicalHistory,
    input.medicalHistoryText
  );

  // 5. 构建输出结构
  const homework: HomeworkItem[] = homeworkModules.map((mod, idx) => ({
    order: idx + 1,
    action: mod.direction, // 用推荐方向作为动作参考
    targetMuscle: mod.targetMuscle,
    reason: mod.reason,
  }));

  const classModulesOut: ClassModule[] = classModules.map(mod => ({
    priority: mod.priority,
    targetMuscle: mod.targetMuscle,
    reason: mod.reason,
    direction: mod.direction,
    sourceIds: mod.sourceId.split(',').filter(Boolean),
  }));

  // 6. 构建标题
  const conditionNames = matched.map(m => m.name);
  const title = conditionNames.length > 0
    ? `${member.name} - ${conditionNames.slice(0, 2).join('、')}综合训练计划`
    : `${member.name} - 综合训练计划`;

  const plan: PersonalizedPlan = {
    id: '', // 后端生成
    memberId: input.memberId,
    title,
    createdAt: new Date().toISOString(),
    homework,
    classModules: classModulesOut,
    contraindications,
    specialNotes,
  };

  return plan;
}

/**
 * 保存计划到后端
 */
export async function savePersonalizedPlan(plan: PersonalizedPlan): Promise<PersonalizedPlan> {
  return api.post<PersonalizedPlan>('/personalized-plans', plan);
}

/**
 * 获取计划
 */
export async function getPersonalizedPlan(planId: string): Promise<PersonalizedPlan | null> {
  try {
    return await api.get<PersonalizedPlan>(`/personalized-plans/${planId}`);
  } catch (err: any) {
    if (err.code === 'NOT_FOUND') return null;
    throw err;
  }
}

/**
 * 更新计划
 */
export async function updatePersonalizedPlan(
  planId: string,
  plan: Partial<PersonalizedPlan>
): Promise<PersonalizedPlan> {
  return api.put<PersonalizedPlan>(`/personalized-plans/${planId}`, plan);
}

/**
 * 删除计划
 */
export async function deletePersonalizedPlan(planId: string): Promise<void> {
  await api.del<void>(`/personalized-plans/${planId}`);
}

/**
 * 列出会员的所有计划
 */
export async function listPersonalizedPlans(memberId: string): Promise<PersonalizedPlan[]> {
  const result = await api.get<{ data: PersonalizedPlan[] }>(
    `/personalized-plans?memberId=${encodeURIComponent(memberId)}`
  );
  return result.data || [];
}
