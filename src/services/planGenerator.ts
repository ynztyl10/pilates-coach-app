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

const STORAGE_KEY = 'pilates_plans';

function generateId(): string {
  return 'plan-' + crypto.randomUUID();
}

function getAllPlans(): TrainingPlan[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePlans(plans: TrainingPlan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function autoSelectKnowledge(member: Member): string[] {
  const selected = new Set<string>();

  // 按 focusAreas（部位）匹配分类
  if (member.focusAreas?.length) {
    knowledgeBase.forEach(k => {
      if (member.focusAreas.includes(k.category)) {
        selected.add(k.id);
      }
    });
  }

  // 按 painPoints（不适点名称）匹配条目名
  if (member.painPoints?.length) {
    knowledgeBase.forEach(k => {
      if (member.painPoints.includes(k.name)) {
        selected.add(k.id);
      }
    });
  }

  // 按 goals（训练目标）匹配标签
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
      if (match) selected.add(k.id);
    });
  });

  return Array.from(selected);
}

function buildPlanItem(knowledgeId: string): PlanItem | null {
  const knowledge = knowledgeBase.find(k => k.id === knowledgeId);
  if (!knowledge) return null;

  return {
    knowledgeId: knowledge.id,
    name: knowledge.name,
    category: knowledge.category,
    priority: 2, // 默认优先级，后续可根据规则调整
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

export function generatePlan(input: PlanGenerateInput): TrainingPlan {
  const member = getMember(input.memberId);
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

  // 按优先级排序（知识库中的训练优先级可通过解析 anatomy 第三段推断）
  // 简化：按条目在知识库中的顺序保持，后续可扩展智能排序

  const plan: TrainingPlan = {
    id: generateId(),
    memberId: member.id,
    title: generateTitle(member, input.planTitle),
    items,
    createdAt: new Date().toISOString(),
  };

  const plans = getAllPlans();
  plans.unshift(plan);
  savePlans(plans);

  return plan;
}

export function getPlan(planId: string): PlanWithMember | null {
  const plan = getAllPlans().find(p => p.id === planId) ?? null;
  if (!plan) return null;
  const member = getMember(plan.memberId);
  return { ...plan, member: member ?? undefined };
}

export function listPlans(memberId: string): PlanListResult {
  const data = getAllPlans()
    .filter(p => p.memberId === memberId)
    .map(p => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
      itemCount: p.items.length,
    }));
  return { data };
}

export function updatePlan(planId: string, input: PlanUpdateInput): TrainingPlan {
  const plans = getAllPlans();
  const idx = plans.findIndex(p => p.id === planId);
  if (idx === -1) {
    throw new Error('NOT_FOUND');
  }
  const existing = plans[idx];
  const updated: TrainingPlan = {
    ...existing,
    ...(input.items !== undefined && { items: input.items }),
    ...(input.notes !== undefined && { notes: input.notes || undefined }),
  };
  plans[idx] = updated;
  savePlans(plans);
  return updated;
}

export function deletePlan(planId: string): void {
  const plans = getAllPlans().filter(p => p.id !== planId);
  savePlans(plans);
}
