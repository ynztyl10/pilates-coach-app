/**
 * 会员管理模块类型定义
 * 对应 OpenAPI Spec: docs/spec/openapi-member-plan.yaml
 */

export type Gender = 'female' | 'male' | 'other';

export type TrainingGoal =
  | 'posture_correction'
  | 'pain_relief'
  | 'post_surgery_rehab'
  | 'core_strength'
  | 'flexibility'
  | 'weight_loss'
  | 'prenatal';

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  posture_correction: '体态矫正',
  pain_relief: '疼痛缓解',
  post_surgery_rehab: '术后康复',
  core_strength: '核心力量',
  flexibility: '柔韧性',
  weight_loss: '减脂',
  prenatal: '孕产',
};

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  age?: number;
  parous?: boolean;
  goals: TrainingGoal[];
  focusAreas: string[];
  painPoints: string[];
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberCreateInput {
  name: string;
  gender: Gender;
  age?: number;
  parous?: boolean;
  goals?: TrainingGoal[];
  focusAreas?: string[];
  painPoints?: string[];
  medicalNotes?: string;
}

export interface MemberUpdateInput {
  name?: string;
  gender?: Gender;
  age?: number;
  parous?: boolean;
  goals?: TrainingGoal[];
  focusAreas?: string[];
  painPoints?: string[];
  medicalNotes?: string;
}

export interface MemberListResult {
  data: Member[];
  total: number;
}
