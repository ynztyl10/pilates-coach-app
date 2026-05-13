import { useEffect, useState } from 'react';
import { PlanWithMember, PlanItem, PlanAction } from '../types/plan';
import { getPlan, updatePlan } from '../services/planGenerator';

interface PlanPreviewProps {
  planId: string;
  onBack: () => void;
  onExportPDF: (plan: PlanWithMember) => void;
}

export default function PlanPreview({ planId, onBack, onExportPDF }: PlanPreviewProps) {
  const [plan, setPlan] = useState<PlanWithMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function loadPlan() {
    setLoading(true);
    try {
      const p = await getPlan(planId);
      if (p) {
        setPlan(p);
        setItems(p.items);
        setNotes(p.notes || '');
      }
    } catch (err) {
      console.error('Failed to load plan:', err);
    } finally {
      setLoading(false);
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  async function handleExport() {
    if (!plan) return;
    setExporting(true);
    try {
      await onExportPDF(plan);
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePlan(planId, { items, notes: notes || undefined });
      alert('保存成功');
    } catch (err) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-lab-gray">
        <span className="iconify ph--spinner animate-spin text-2xl mr-2"></span>
        加载中...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-lab-gray">
        <span className="iconify ph--ghost text-4xl opacity-40 mb-3"></span>
        <p>计划不存在</p>
        <button onClick={onBack} className="mt-4 text-lab-green text-[14px]">返回</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onBack} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark truncate max-w-[200px]">{plan.title}</h2>
        <button onClick={() => handleExport()} className="text-lab-green" disabled={exporting}>
          <span className={`iconify ph--file-pdf text-xl ${exporting ? 'animate-pulse' : ''}`}></span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-32">
        {/* Member Info */}
        {plan.member && (
          <div className="bg-white rounded-xl p-3 mb-4 border border-black/[0.03]">
            <p className="text-[13px] font-bold text-lab-dark">{plan.member.name}</p>
            <p className="text-[11px] text-lab-gray">
              {plan.member.gender === 'female' ? '女' : plan.member.gender === 'male' ? '男' : '其他'}
              {plan.member.age ? ` · ${plan.member.age}岁` : ''}
            </p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.knowledgeId} className="bg-white rounded-xl p-4 border border-black/[0.03]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-lab-green bg-lab-green/10 px-1.5 py-0.5 rounded">
                      P{item.priority}
                    </span>
                    <span className="text-[10px] text-lab-gray bg-lab-light px-1.5 py-0.5 rounded">{item.category}</span>
                    <h3 className="text-[14px] font-bold text-lab-dark">{item.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center text-lab-gray hover:text-lab-dark disabled:opacity-30"
                  >
                    <span className="iconify ph--arrow-up text-sm"></span>
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-lab-gray hover:text-lab-dark disabled:opacity-30"
                  >
                    <span className="iconify ph--arrow-down text-sm"></span>
                  </button>
                  <button
                    onClick={() => removeItem(index)}
                    className="w-7 h-7 flex items-center justify-center text-lab-gray hover:text-red-500"
                  >
                    <span className="iconify ph--x text-sm"></span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 space-y-1.5">
                {item.actions.map((action: PlanAction, idx: number) => (
                  <div key={idx} className="bg-lab-bg rounded-lg p-2">
                    <p className="text-[12px] font-bold text-lab-dark">{action.name}</p>
                    <ul className="mt-1 space-y-0.5">
                      {action.points.map((point: string, pidx: number) => (
                        <li key={pidx} className="text-[11px] text-lab-gray flex items-start gap-1">
                          <span className="text-lab-green mt-0.5">·</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {item.notes.length > 0 && (
                <div className="mt-2 text-[11px] text-lab-gray bg-lab-blue/30 rounded-lg p-2">
                  <p className="font-bold text-lab-dark mb-1">教练备注</p>
                  {item.notes.map((note: string, idx: number) => (
                    <p key={idx}>· {note}</p>
                  ))}
                </div>
              )}

              {item.contraindications.length > 0 && (
                <div className="mt-2 text-[11px] text-red-600 bg-red-50 rounded-lg p-2 border border-red-100">
                  <p className="font-bold mb-1">禁忌症</p>
                  {item.contraindications.map((c: string, idx: number) => (
                    <p key={idx}>· {c}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-lab-gray">
            <p>计划暂无条目</p>
          </div>
        )}

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-[13px] font-bold text-lab-dark mb-1.5">计划备注</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="添加整体计划备注..."
            rows={3}
            className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green resize-none"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-black/5 flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex-1 bg-lab-green/10 text-lab-green py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className={`iconify ph--file-pdf text-lg ${exporting ? 'animate-pulse' : ''}`}></span>
          {exporting ? '导出中...' : '导出 PDF'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-lab-dark text-white py-3 rounded-xl font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>
    </div>
  );
}
