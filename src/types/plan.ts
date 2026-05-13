/**
 * 训练计划模块类型定义
 * 对应 OpenAPI Spec: docs/spec/openapi-member-plan.yaml
 */

import { Member } from './member';

export interface PlanAction {
  name: string;
  points: string[];
}

export interface PlanItem {
  knowledgeId: string;
  name: string;
  category: string;
  priority: number;
  actions: PlanAction[];
  notes: string[];
  contraindications: string[];
}

export interface TrainingPlan {
  id: string;
  memberId: string;
  title: string;
  items: PlanItem[];
  createdAt: string;
  notes?: string;
}

export interface TrainingPlanSummary {
  id: string;
  title: string;
  createdAt: string;
  itemCount: number;
}

export interface PlanListResult {
  data: TrainingPlanSummary[];
}

export interface PlanGenerateInput {
  memberId: string;
  selectedKnowledgeIds: string[];
  autoSelect?: boolean;
  planTitle?: string;
  notes?: string;
}

export interface PlanUpdateInput {
  items?: PlanItem[];
  notes?: string;
}

export interface PlanWithMember extends TrainingPlan {
  member?: Member;
}
