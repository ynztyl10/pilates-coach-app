import { useEffect, useState } from 'react';
import { Member } from '../types/member';
import { TrainingPlanSummary } from '../types/plan';
import { listPlans } from '../services/planGenerator';
import { TRAINING_GOAL_LABELS } from '../types/member';

interface MemberDetailProps {
  member: Member;
  onBack: () => void;
  onEdit: (member: Member) => void;
  onGeneratePlan: (member: Member) => void;
  onViewPlan: (planId: string) => void;
  onGeneratePersonalizedPlan?: (member: Member) => void;
}

export default function MemberDetail({ member, onBack, onEdit, onGeneratePlan, onViewPlan, onGeneratePersonalizedPlan }: MemberDetailProps) {
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, [member.id]);

  async function loadPlans() {
    setLoading(true);
    try {
      const result = await listPlans(member.id);
      setPlans(result.data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onBack} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark">会员详情</h2>
        <button onClick={() => onEdit(member)} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--pencil-simple text-lg"></span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Member Info Card */}
        <div className="mx-5 mt-4 bg-white rounded-xl p-4 shadow-sm border border-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${
              member.gender === 'female' ? 'bg-pink-400' : member.gender === 'male' ? 'bg-blue-400' : 'bg-lab-gray'
            }`}>
              <span className="iconify ph--user"></span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-lab-dark">{member.name}</h3>
              <p className="text-[12px] text-lab-gray">
                {member.gender === 'female' ? '女' : member.gender === 'male' ? '男' : '其他'}
                {member.age ? ` · ${member.age}岁` : ''}
                {member.parous ? ' · 已生育' : ''}
              </p>
            </div>
          </div>

          {member.goals.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-lab-gray mb-1">训练目标</p>
              <div className="flex flex-wrap gap-1.5">
                {member.goals.map(g => (
                  <span key={g} className="text-[10px] font-medium text-lab-green bg-lab-green/10 px-2 py-0.5 rounded">
                    {TRAINING_GOAL_LABELS[g]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.focusAreas.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-lab-gray mb-1">关注部位</p>
              <div className="flex flex-wrap gap-1.5">
                {member.focusAreas.map(a => (
                  <span key={a} className="text-[10px] text-lab-dark bg-lab-light px-2 py-0.5 rounded">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.painPoints.length > 0 && (
            <div className="mb-2">
              <p className="text-[11px] text-lab-gray mb-1">不适点</p>
              <div className="flex flex-wrap gap-1.5">
                {member.painPoints.map(p => (
                  <span key={p} className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {member.medicalNotes && (
            <div className="mt-2 pt-2 border-t border-black/5">
              <p className="text-[11px] text-lab-gray mb-1">医学备注</p>
              <p className="text-[12px] text-lab-dark">{member.medicalNotes}</p>
            </div>
          )}
        </div>

        {/* Plans Section */}
        <div className="mx-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-lab-dark">训练计划</h3>
            <span className="text-[12px] text-lab-gray">{plans.length} 份</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-lab-gray">
              <span className="iconify ph--spinner animate-spin text-xl mr-2"></span>
              加载中...
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-lab-gray border border-black/[0.03]">
              <span className="iconify ph--clipboard-text text-3xl opacity-40 mb-2"></span>
              <p className="text-[13px]">暂无训练计划</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => onViewPlan(plan.id)}
                  className="w-full bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-black/[0.03] text-left active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-[14px] font-bold text-lab-dark">{plan.title}</p>
                    <p className="text-[11px] text-lab-gray mt-0.5">
                      {new Date(plan.createdAt).toLocaleDateString('zh-CN')} · {plan.itemCount} 个条目
                    </p>
                  </div>
                  <span className="iconify ph--caret-right text-lab-gray text-lg opacity-50"></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-black/5 space-y-2">
        {onGeneratePersonalizedPlan && (
          <button
            onClick={() => onGeneratePersonalizedPlan(member)}
            className="w-full bg-lab-dark text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span className="iconify ph--sparkle text-lg"></span>
            智能综合训练计划
          </button>
        )}
        <button
          onClick={() => onGeneratePlan(member)}
          className="w-full bg-lab-green text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="iconify ph--magic-wand text-lg"></span>
          生成专项训练计划
        </button>
      </div>
    </div>
  );
}
