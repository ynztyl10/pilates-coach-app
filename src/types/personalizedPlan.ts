/**
 * 智能综合训练计划类型定义
 */

export interface HomeworkItem {
  order: number;
  action: string;
  targetMuscle: string;
  reason: string;
}

export interface ClassModule {
  priority: number; // 1 | 2 | 3
  targetMuscle: string;
  reason: string;
  direction: string;
  sourceIds: string[];
}

export interface Contraindication {
  level: 'forbidden' | 'caution' | 'safe';
  action: string;
  reason: string;
}

export interface SpecialNote {
  note: string;
}

export interface PersonalizedPlan {
  id: string;
  memberId: string;
  title: string;
  createdAt: string;
  homework: HomeworkItem[];
  classModules: ClassModule[];
  contraindications: Contraindication[];
  specialNotes: SpecialNote[];
}

export interface PersonalizedPlanInput {
  memberId: string;
  conditions: string[];
  conditionText?: string;
  medicalHistory: string[];
  medicalHistoryText?: string;
}

export interface PersonalizedPlanSummary {
  id: string;
  title: string;
  createdAt: string;
}

export interface PersonalizedPlanListResult {
  data: PersonalizedPlanSummary[];
}

export interface MatchedKnowledge {
  id: string;
  name: string;
  category: string;
  score: number;
}

export interface ExtractedModule {
  priority: number;
  targetMuscle: string;
  reason: string;
  direction: string;
  sourceId: string;
  isStretch: boolean; // true = 家庭作业(松解), false = 课堂训练(激活)
}

export interface MedicalHistoryRule {
  keywords: string[];
  contraindications: Contraindication[];
  specialNotes: string[];
}
