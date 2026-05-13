/**
 * 训练计划生成引擎
 * 对应 OpenAPI Spec: TrainingPlan 接口
 */

import { Member } from '../types/member';
import {
  TrainingPlan,
  PlanItem,
  PlanGenerateInput,
  PlanUpdateInput,
  PlanListResult,
  PlanWithMember,
} from '../types/plan';
import { knowledgeBase } from '../data/knowledge';
import { getMember } from './memberService';
import { api } from './api';

export function autoSelectKnowledge(member: Member): string[] {
  const scores = new Map<string, number>();

  function addScore(id: string, delta: number) {
    scores.set(id, (scores.get(id) || 0) + delta);
  }

  // focusAreas（部位）匹配分类 → +3 分
  if (member.focusAreas?.length) {
    knowledgeBase.forEach(k => {
      if (member.focusAreas.includes(k.category)) {
        addScore(k.id, 3);
      }
    });
  }

  // painPoints（不适点名称）匹配条目名 → +5 分（最精准）
  if (member.painPoints?.length) {
    knowledgeBase.forEach(k => {
      if (member.painPoints.includes(k.name)) {
        addScore(k.id, 5);
      }
    });
  }

  // goals（训练目标）匹配标签 → +1 分
  const goalTagMap: Record<string, string[]> = {
    posture_correction: ['体态', '姿势', '圆肩', '驼背', '头前引'],
    pain_relief: ['疼痛', '紧张', '松解'],
    post_surgery_rehab: ['术后', '康复', '重建'],
    core_strength: ['核心', '腹横肌', '稳定'],
    flexibility: ['柔韧', '拉伸', '活动度'],
    weight_loss: ['减脂', '代谢', '有氧'],
    prenatal: ['孕产', '盆底', '腹直肌'],
  };

  member.goals?.forEach(goal => {
    const tags = goalTagMap[goal] || [];
    knowledgeBase.forEach(k => {
      const match = tags.some(tag =>
        k.tags.some(t => t.includes(tag)) || k.name.includes(tag)
      );
      if (match) addScore(k.id, 1);
    });
  });

  // 按分数降序排列，返回 ID 列表
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

function inferPriority(anatomyTexts: string[]): number {
  // 解析 anatomy 第三段（普拉提训练改善的优先顺序）
  const priorityText = anatomyTexts[2] || '';
  if (priorityText.includes('第一优先级')) return 1;
  if (priorityText.includes('第二优先级')) return 2;
  if (priorityText.includes('第三优先级')) return 3;
  if (priorityText.includes('第四优先级')) return 4;
  return 2; // 默认
}

function buildPlanItem(knowledgeId: string): PlanItem | null {
  const knowledge = knowledgeBase.find(k => k.id === knowledgeId);
  if (!knowledge) return null;

  return {
    knowledgeId: knowledge.id,
    name: knowledge.name,
    category: knowledge.category,
    priority: inferPriority(knowledge.anatomy),
    actions: knowledge.training.actions.map(a => ({
      name: a.name,
      points: a.points,
    })),
    notes: knowledge.training.notes,
    contraindications: knowledge.contraindications,
  };
}

function generateTitle(member: Member, customTitle?: string): string {
  if (customTitle?.trim()) return customTitle.trim();
  const areas = member.focusAreas?.length
    ? member.focusAreas.slice(0, 2).join('与')
    : '综合';
  return `${member.name} - ${areas}专项训练计划`;
}

export async function generatePlan(
  input: PlanGenerateInput
): Promise<TrainingPlan> {
  const member = await getMember(input.memberId);
  if (!member) {
    throw new Error('NOT_FOUND');
  }

  let ids = [...input.selectedKnowledgeIds];

  if (input.autoSelect) {
    const autoIds = autoSelectKnowledge(member);
    autoIds.forEach(id => {
      if (!ids.includes(id)) ids.push(id);
    });
  }

  const items: PlanItem[] = [];
  ids.forEach(id => {
    const item = buildPlanItem(id);
    if (item) items.push(item);
  });

  // 按优先级排序
  items.sort((a, b) => a.priority - b.priority);

  return api.post<TrainingPlan>('/plans', {
    memberId: member.id,
    title: generateTitle(member, input.planTitle),
    items,
    notes: input.notes,
  });
}

export async function getPlan(planId: string): Promise<PlanWithMember | null> {
  try {
    return await api.get<PlanWithMember>(`/plans/${planId}`);
  } catch (err: any) {
    if (err.code === 'NOT_FOUND') return null;
    throw err;
  }
}

export async function listPlans(memberId: string): Promise<PlanListResult> {
  return api.get<PlanListResult>(`/plans?memberId=${encodeURIComponent(memberId)}`);
}

export async function updatePlan(
  planId: string,
  input: PlanUpdateInput
): Promise<TrainingPlan> {
  return api.put<TrainingPlan>(`/plans/${planId}`, input);
}

export async function deletePlan(planId: string): Promise<void> {
  await api.del<void>(`/plans/${planId}`);
}
