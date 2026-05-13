import { useState, useMemo } from 'react';
import { Member } from '../types/member';
import { knowledgeBase } from '../data/knowledge';
import { autoSelectKnowledge, generatePlan } from '../services/planGenerator';
import { PlanGenerateInput } from '../types/plan';

interface PlanGeneratorProps {
  member: Member;
  onBack: () => void;
  onPlanCreated: (planId: string) => void;
}

export default function PlanGenerator({ member, onBack, onPlanCreated }: PlanGeneratorProps) {
  const [autoIds, setAutoIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [planTitle, setPlanTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  const autoSelected = useMemo(() => autoSelectKnowledge(member), [member]);

  function toggleId(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleAuto() {
    if (autoIds.length > 0) {
      setAutoIds([]);
    } else {
      setAutoIds(autoSelected);
    }
  }

  const combinedIds = useMemo(() => {
    const ids = [...selectedIds];
    autoIds.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    return ids;
  }, [selectedIds, autoIds]);

  async function handleGenerate() {
    if (combinedIds.length === 0) {
      alert('请至少选择一个知识库条目');
      return;
    }
    setGenerating(true);
    try {
      const input: PlanGenerateInput = {
        memberId: member.id,
        selectedKnowledgeIds: combinedIds,
        planTitle: planTitle || undefined,
      };
      const plan = await generatePlan(input);
      onPlanCreated(plan.id);
    } catch (err: any) {
      alert('生成计划失败: ' + (err.message || '未知错误'));
    } finally {
      setGenerating(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, typeof knowledgeBase>();
    knowledgeBase.forEach(k => {
      if (!map.has(k.category)) map.set(k.category, []);
      map.get(k.category)!.push(k);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onBack} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark">生成训练计划</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-32">
        {/* Member Summary */}
        <div className="bg-white rounded-xl p-3 mb-4 border border-black/[0.03]">
          <p className="text-[13px] font-bold text-lab-dark">{member.name}</p>
          <p className="text-[11px] text-lab-gray mt-0.5">
            {member.focusAreas.length > 0 && `关注: ${member.focusAreas.join('、')}`}
            {member.painPoints.length > 0 && ` · 不适: ${member.painPoints.join('、')}`}
          </p>
        </div>

        {/* Auto Select Toggle */}
        <button
          onClick={toggleAuto}
          className={`w-full mb-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
            autoIds.length > 0
              ? 'bg-lab-green text-white'
              : 'bg-white text-lab-dark border border-black/10'
          }`}
        >
          <span className="iconify ph--magic-wand text-lg"></span>
          {autoIds.length > 0 ? `已自动匹配 ${autoIds.length} 项` : '自动匹配推荐条目'}
        </button>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-lab-gray mb-1.5">计划标题（可选）</label>
          <input
            type="text"
            value={planTitle}
            onChange={e => setPlanTitle(e.target.value)}
            placeholder={`默认: ${member.name} - 专项训练计划`}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green"
          />
        </div>

        {/* Selected Count */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-lab-dark">已选 {combinedIds.length} 项</h3>
          {combinedIds.length > 0 && (
            <button onClick={() => { setSelectedIds([]); setAutoIds([]); }} className="text-[12px] text-red-500">
              清空
            </button>
          )}
        </div>

        {/* Knowledge List by Category */}
        <div className="space-y-3">
          {categories.map(([category, items]) => (
            <div key={category} className="bg-white rounded-xl p-3 border border-black/[0.03]">
              <h4 className="text-[12px] font-bold text-lab-green mb-2">{category}</h4>
              <div className="space-y-1.5">
                {items.map(item => {
                  const isSelected = combinedIds.includes(item.id);
                  const isAuto = autoIds.includes(item.id) && !selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleId(item.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                        isSelected ? 'bg-lab-green/10 border border-lab-green/20' : 'hover:bg-lab-bg'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-lab-green border-lab-green' : 'border-lab-gray/30'
                      }`}>
                        {isSelected && <span className="iconify ph--check text-white text-xs"></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-lab-dark truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] text-lab-gray bg-lab-light px-1 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {isAuto && (
                        <span className="text-[9px] text-lab-green bg-lab-green/10 px-1.5 py-0.5 rounded flex-shrink-0">推荐</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-black/5">
        <button
          onClick={handleGenerate}
          disabled={generating || combinedIds.length === 0}
          className="w-full bg-lab-dark text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {generating ? '生成中...' : `生成计划 (${combinedIds.length} 项)`}
        </button>
      </div>
    </div>
  );
}
