import { useState } from 'react';
import { Member } from '../types/member';
import { generatePersonalizedPlan } from '../services/personalizedPlan';

interface PersonalizedPlanInputProps {
  member: Member;
  onBack: () => void;
  onPlanGenerated: (planId: string) => void;
}

export default function PersonalizedPlanInput({ member, onBack, onPlanGenerated }: PersonalizedPlanInputProps) {
  const [conditionText, setConditionText] = useState('');
  const [medicalHistoryText, setMedicalHistoryText] = useState('');
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!conditionText.trim()) {
      alert('请输入会员体态描述');
      return;
    }
    setGenerating(true);
    try {
      const plan = await generatePersonalizedPlan({
        memberId: member.id,
        conditions: [],
        conditionText: conditionText.trim(),
        medicalHistory: [],
        medicalHistoryText: medicalHistoryText.trim() || undefined,
      });
      // Save the generated plan
      const { savePersonalizedPlan } = await import('../services/personalizedPlan');
      const saved = await savePersonalizedPlan(plan);
      onPlanGenerated(saved.id);
    } catch (err: any) {
      alert('生成计划失败: ' + (err.message || '未知错误'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onBack} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark">智能综合训练计划</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-32">
        {/* Member Summary */}
        <div className="bg-white rounded-xl p-3 mb-4 border border-black/[0.03]">
          <p className="text-[13px] font-bold text-lab-dark">{member.name}</p>
          <p className="text-[11px] text-lab-gray mt-0.5">
            {member.gender === 'female' ? '女' : member.gender === 'male' ? '男' : '其他'}
            {member.age ? ` · ${member.age}岁` : ''}
            {member.medicalNotes ? ' · 有医学备注' : ''}
          </p>
        </div>

        {/* Condition Input */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-lab-dark mb-1.5">
            体态描述 <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-lab-gray mb-2">
            描述会员的身体状况，如：足弓塌陷、膝盖内扣、骨盆前倾、头前引等
          </p>
          <textarea
            value={conditionText}
            onChange={e => setConditionText(e.target.value)}
            placeholder="例如：足弓塌陷，右脚习惯性崴脚，膝盖内扣，骨盆前倾且右旋，胸椎段屈曲，头前引"
            rows={4}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green resize-none"
          />
        </div>

        {/* Medical History Input */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-lab-dark mb-1.5">
            病史 / 手术史 <span className="text-lab-gray font-normal">（可选）</span>
          </label>
          <p className="text-[11px] text-lab-gray mb-2">
            如有手术史、慢性病、孕产史等，请详细说明
          </p>
          <textarea
            value={medicalHistoryText}
            onChange={e => setMedicalHistoryText(e.target.value)}
            placeholder="例如：右腿ACL重建术后约3年，左腿ACL重建术后约1年"
            rows={3}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green resize-none"
          />
        </div>

        {/* Tips */}
        <div className="bg-lab-blue/50 rounded-xl p-3 border border-lab-blue">
          <div className="flex items-start gap-2">
            <span className="iconify ph--info text-lab-green text-lg flex-shrink-0 mt-0.5"></span>
            <div>
              <p className="text-[12px] font-bold text-lab-dark">输入提示</p>
              <p className="text-[11px] text-lab-gray mt-1 leading-relaxed">
                系统会自动识别关键词并匹配知识库。支持自然语言描述，多个问题用逗号、顿号或换行分隔。
                病史信息用于生成禁忌症和特殊注意事项。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-black/5">
        <button
          onClick={handleGenerate}
          disabled={generating || !conditionText.trim()}
          className="w-full bg-lab-dark text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="iconify ph--spinner animate-spin text-lg"></span>
              生成中...
            </>
          ) : (
            <>
              <span className="iconify ph--sparkle text-lg"></span>
              生成综合训练计划
            </>
          )}
        </button>
      </div>
    </div>
  );
}
