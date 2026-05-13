import { useState, useEffect } from 'react';
import { Member, MemberCreateInput, MemberUpdateInput, Gender, TrainingGoal, TRAINING_GOAL_LABELS } from '../types/member';
import { createMember, updateMember } from '../services/memberService';

const FOCUS_AREA_OPTIONS = ['头颈与肩部', '脊柱', '骨盆', '髋关节', '膝关节', '足部', '特殊情况'];

const PAIN_POINT_OPTIONS = ['头前引', '圆肩', '胸椎后凸过大（驼背）', '腰椎前凸过大', '骨盆前倾', '骨盆后倾', '膝超伸'];

interface MemberFormProps {
  member?: Member | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function MemberForm({ member, onSaved, onCancel }: MemberFormProps) {
  const isEdit = !!member;
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState<string>('');
  const [parous, setParous] = useState(false);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setGender(member.gender);
      setAge(member.age?.toString() ?? '');
      setParous(member.parous ?? false);
      setGoals(member.goals);
      setFocusAreas(member.focusAreas);
      setPainPoints(member.painPoints);
      setMedicalNotes(member.medicalNotes ?? '');
    }
  }, [member]);

  function toggleGoal(goal: TrainingGoal) {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  }

  function toggleFocus(area: string) {
    setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  }

  function togglePain(pain: string) {
    setPainPoints(prev => prev.includes(pain) ? prev.filter(p => p !== pain) : [...prev, pain]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入会员姓名');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        gender,
        age: age ? parseInt(age) : undefined,
        parous,
        goals,
        focusAreas,
        painPoints,
        medicalNotes: medicalNotes.trim() || undefined,
      };
      if (isEdit && member) {
        await updateMember(member.id, payload as MemberUpdateInput);
      } else {
        await createMember(payload as MemberCreateInput);
      }
      onSaved();
    } catch (err: any) {
      alert('保存失败: ' + (err.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onCancel} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark">{isEdit ? '编辑会员' : '添加会员'}</h2>
        <div className="w-8"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-24">
        {/* Name */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-1.5">姓名 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="请输入会员姓名"
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-1.5">性别 <span className="text-red-400">*</span></label>
          <div className="flex gap-3">
            {([['female', '女'], ['male', '男'], ['other', '其他']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  gender === value
                    ? 'bg-lab-dark text-white'
                    : 'bg-white text-lab-gray border border-black/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-1.5">年龄</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="请输入年龄"
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green"
          />
        </div>

        {/* Parous */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="parous"
            checked={parous}
            onChange={e => setParous(e.target.checked)}
            className="w-4 h-4 accent-lab-green"
          />
          <label htmlFor="parous" className="text-[13px] text-lab-dark">已生育</label>
        </div>

        {/* Goals */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-2">训练目标</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TRAINING_GOAL_LABELS) as TrainingGoal[]).map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  goals.includes(goal)
                    ? 'bg-lab-green text-white'
                    : 'bg-white text-lab-gray border border-black/10'
                }`}
              >
                {TRAINING_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-2">关注部位</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREA_OPTIONS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => toggleFocus(area)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  focusAreas.includes(area)
                    ? 'bg-lab-dark text-white'
                    : 'bg-white text-lab-gray border border-black/10'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Pain Points */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-2">不适点 / 痛点</label>
          <div className="flex flex-wrap gap-2">
            {PAIN_POINT_OPTIONS.map(pain => (
              <button
                key={pain}
                type="button"
                onClick={() => togglePain(pain)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  painPoints.includes(pain)
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white text-lab-gray border border-black/10'
                }`}
              >
                {pain}
              </button>
            ))}
          </div>
        </div>

        {/* Medical Notes */}
        <div>
          <label className="block text-[13px] font-bold text-lab-dark mb-1.5">医学备注</label>
          <textarea
            value={medicalNotes}
            onChange={e => setMedicalNotes(e.target.value)}
            placeholder="如：椎间盘突出、术后恢复等..."
            rows={3}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green resize-none"
          />
        </div>
      </form>

      {/* Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-black/5">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-lab-dark text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? '保存中...' : isEdit ? '保存修改' : '添加会员'}
        </button>
      </div>
    </div>
  );
}
