import { useEffect, useState } from 'react';
import { PersonalizedPlan } from '../types/personalizedPlan';
import { getPersonalizedPlan } from '../services/personalizedPlan';

interface PersonalizedPlanPreviewProps {
  planId: string;
  onBack: () => void;
}

export default function PersonalizedPlanPreview({ planId, onBack }: PersonalizedPlanPreviewProps) {
  const [plan, setPlan] = useState<PersonalizedPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function loadPlan() {
    setLoading(true);
    try {
      const p = await getPersonalizedPlan(planId);
      setPlan(p);
    } catch (err) {
      console.error('Failed to load plan:', err);
    } finally {
      setLoading(false);
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

  // Group class modules by priority
  const p1Modules = plan.classModules.filter(m => m.priority === 1);
  const p2Modules = plan.classModules.filter(m => m.priority === 2);
  const p3Modules = plan.classModules.filter(m => m.priority >= 3);

  // Group contraindications by level
  const forbidden = plan.contraindications.filter(c => c.level === 'forbidden');
  const caution = plan.contraindications.filter(c => c.level === 'caution');
  const safe = plan.contraindications.filter(c => c.level === 'safe');

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5">
        <button onClick={onBack} className="text-lab-gray hover:text-lab-dark">
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <h2 className="font-bold text-lg text-lab-dark truncate max-w-[200px]">{plan.title}</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
        {/* Generated Time */}
        <p className="text-[11px] text-lab-gray mb-4 text-center">
          生成于 {new Date(plan.createdAt).toLocaleString('zh-CN')}
        </p>

        {/* ===== HOMEWORK ===== */}
        {plan.homework.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="iconify ph--house text-lab-green text-lg"></span>
              <h3 className="text-[15px] font-bold text-lab-dark">家庭作业（松解/拉伸）</h3>
            </div>
            <div className="bg-white rounded-xl border border-black/[0.03] overflow-hidden">
              {plan.homework.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 ${idx !== plan.homework.length - 1 ? 'border-b border-black/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-lab-green/10 text-lab-green text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.order}
                    </span>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-lab-dark">{item.targetMuscle}</p>
                      <p className="text-[11px] text-lab-gray mt-0.5">{item.reason}</p>
                      {item.action && (
                        <p className="text-[11px] text-lab-green mt-1 bg-lab-green/5 px-2 py-1 rounded inline-block">
                          参考：{item.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CLASS MODULES ===== */}
        {plan.classModules.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="iconify ph--barbell text-lab-green text-lg"></span>
              <h3 className="text-[15px] font-bold text-lab-dark">课堂训练模块池</h3>
            </div>
            <p className="text-[11px] text-lab-gray mb-3">
              教练根据每节课情况，从以下优先级模块中灵活选取
            </p>

            {/* P1 */}
            {p1Modules.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded">P1</span>
                  <span className="text-[11px] text-lab-gray">最优先</span>
                </div>
                <div className="space-y-2">
                  {p1Modules.map((mod, idx) => (
                    <ClassModuleCard key={idx} module={mod} />
                  ))}
                </div>
              </div>
            )}

            {/* P2 */}
            {p2Modules.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded">P2</span>
                  <span className="text-[11px] text-lab-gray">次优先</span>
                </div>
                <div className="space-y-2">
                  {p2Modules.map((mod, idx) => (
                    <ClassModuleCard key={idx} module={mod} />
                  ))}
                </div>
              </div>
            )}

            {/* P3+ */}
            {p3Modules.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-white bg-lab-green px-2 py-0.5 rounded">P3</span>
                  <span className="text-[11px] text-lab-gray">再次</span>
                </div>
                <div className="space-y-2">
                  {p3Modules.map((mod, idx) => (
                    <ClassModuleCard key={idx} module={mod} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== CONTRAINDICATIONS ===== */}
        {plan.contraindications.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="iconify ph--shield-warning text-red-500 text-lg"></span>
              <h3 className="text-[15px] font-bold text-lab-dark">禁忌症</h3>
            </div>

            {/* Forbidden */}
            {forbidden.length > 0 && (
              <div className="mb-3 bg-red-50 rounded-xl border border-red-100 overflow-hidden">
                <div className="px-3 py-2 bg-red-100/50 flex items-center gap-2">
                  <span className="text-lg">🔴</span>
                  <span className="text-[12px] font-bold text-red-700">禁止</span>
                </div>
                <div className="p-3 space-y-2">
                  {forbidden.map((c, idx) => (
                    <div key={idx}>
                      <p className="text-[13px] font-bold text-red-700">{c.action}</p>
                      <p className="text-[11px] text-red-600/80">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caution */}
            {caution.length > 0 && (
              <div className="mb-3 bg-amber-50 rounded-xl border border-amber-100 overflow-hidden">
                <div className="px-3 py-2 bg-amber-100/50 flex items-center gap-2">
                  <span className="text-lg">🟡</span>
                  <span className="text-[12px] font-bold text-amber-700">谨慎</span>
                </div>
                <div className="p-3 space-y-2">
                  {caution.map((c, idx) => (
                    <div key={idx}>
                      <p className="text-[13px] font-bold text-amber-700">{c.action}</p>
                      <p className="text-[11px] text-amber-600/80">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safe */}
            {safe.length > 0 && (
              <div className="mb-3 bg-green-50 rounded-xl border border-green-100 overflow-hidden">
                <div className="px-3 py-2 bg-green-100/50 flex items-center gap-2">
                  <span className="text-lg">🟢</span>
                  <span className="text-[12px] font-bold text-green-700">安全</span>
                </div>
                <div className="p-3 space-y-2">
                  {safe.map((c, idx) => (
                    <div key={idx}>
                      <p className="text-[13px] font-bold text-green-700">{c.action}</p>
                      <p className="text-[11px] text-green-600/80">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== SPECIAL NOTES ===== */}
        {plan.specialNotes.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="iconify ph--heartbeat text-rose-500 text-lg"></span>
              <h3 className="text-[15px] font-bold text-lab-dark">特殊注意事项</h3>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 space-y-2">
              {plan.specialNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">•</span>
                  <p className="text-[12px] text-rose-700 leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {plan.homework.length === 0 && plan.classModules.length === 0 && (
          <div className="text-center py-8 text-lab-gray">
            <p>未匹配到已知体态问题，请检查描述是否准确</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassModuleCard({ module }: { module: { priority: number; targetMuscle: string; reason: string; direction: string; sourceIds: string[] } }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-black/[0.03]">
      <p className="text-[13px] font-bold text-lab-dark">{module.targetMuscle}</p>
      <p className="text-[11px] text-lab-gray mt-1 leading-relaxed">{module.reason}</p>
      {module.direction && (
        <p className="text-[11px] text-lab-green mt-2 bg-lab-green/5 px-2 py-1 rounded">
          训练方向：{module.direction}
        </p>
      )}
    </div>
  );
}
