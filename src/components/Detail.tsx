import React, { useEffect, useRef } from 'react';
import { PilatesKnowledge } from '../data/knowledge';

interface DetailProps {
  item: PilatesKnowledge;
  onBack: () => void;
  onAskAI: () => void;
}

// ─── 类型定义 ────────────────────────────────────────────────────────────────
type MuscleEntry = {
  name: string;
  bullets: { type: 'arrow' | 'star'; text: string }[];
};

type SubtitleType = 'shortened' | 'lengthened' | 'compensatory' | 'default';

type Section =
  | { kind: 'title'; text: string }
  | { kind: 'warning'; text: string }
  | { kind: 'subtitle'; text: string; subType: SubtitleType }
  | { kind: 'muscles'; entries: MuscleEntry[] }
  | { kind: 'priority'; level: string; lines: string[] }
  | { kind: 'arrowList'; items: string[] }
  | { kind: 'starList'; items: string[] }
  | { kind: 'paragraph'; text: string };

// ─── 子标题类型识别 ───────────────────────────────────────────────────────────
function detectSubtitleType(text: string): SubtitleType {
  if (text.includes('缩短') || text.includes('紧张')) return 'shortened';
  if (text.includes('拉长') || text.includes('无力')) return 'lengthened';
  if (text.includes('代偿')) return 'compensatory';
  return 'default';
}

// ─── 解析器 ──────────────────────────────────────────────────────────────────
function parseAnatomyText(raw: string): Section[] {
  // 只去掉每行末尾空白，保留行首结构（① / → / ★ 等）
  const lines = raw
    .split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .filter(l => l.trim().length > 0);

  const sections: Section[] = [];
  let i = 0;
  let muscleBuffer: MuscleEntry[] = [];
  let currentMuscle: MuscleEntry | null = null;

  const flushMuscles = () => {
    if (currentMuscle) {
      muscleBuffer.push(currentMuscle);
      currentMuscle = null;
    }
    if (muscleBuffer.length > 0) {
      sections.push({ kind: 'muscles', entries: [...muscleBuffer] });
      muscleBuffer = [];
    }
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmedStart = rawLine.trimStart();

    // 一级标题 【...】
    if (trimmedStart.startsWith('【') && trimmedStart.includes('】')) {
      flushMuscles();
      sections.push({
        kind: 'title',
        text: trimmedStart.replace(/[【】]/g, ''),
      });
      i++;
      continue;
    }

    // 警示 ⚠️
    if (trimmedStart.startsWith('⚠️')) {
      flushMuscles();
      sections.push({
        kind: 'warning',
        text: trimmedStart.replace(/^⚠️\s*/, ''),
      });
      i++;
      continue;
    }

    // 子标题行（以 ── 开头的分隔标题）
    if (/^[-—─]{2,}/.test(trimmedStart)) {
      flushMuscles();
      const text = trimmedStart
        .replace(/^[-—─\s]+/, '')
        .replace(/[-—─\s]+$/, '');
      const subType = detectSubtitleType(text);
      sections.push({ kind: 'subtitle', text, subType });
      i++;
      continue;
    }

    // 优先级行 "第一优先级 │ ..."
    if (/^第[0-9一二三四五六七八九十①-⑨]/.test(trimmedStart)) {
      flushMuscles();
      const level = trimmedStart;
      const priorityLines: string[] = [];
      i++;
      while (
        i < lines.length &&
        !/^第[0-9一二三四五六七八九十①-⑨]/.test(lines[i].trimStart()) &&
        !lines[i].trimStart().startsWith('【')
      ) {
        priorityLines.push(lines[i].trim());
        i++;
      }
      sections.push({ kind: 'priority', level, lines: priorityLines });
      continue;
    }

    // 肌肉编号：① ② ③ 开头（允许前面有缩进）
    if (/^[①-⑨]/.test(trimmedStart)) {
      if (currentMuscle) muscleBuffer.push(currentMuscle);
      const name = trimmedStart.replace(/^[①-⑨]\s*/, '');
      currentMuscle = { name, bullets: [] };
      i++;
      continue;
    }

    // 箭头行：→ 开头（允许前面有缩进）
    if (trimmedStart.startsWith('→')) {
      // 如果已有当前肌肉条目，归入 muscle bullet
      if (currentMuscle) {
        currentMuscle.bullets.push({
          type: 'arrow',
          text: trimmedStart.replace(/^→\s*/, ''),
        });
        i++;
        continue;
      }
      // 没有 muscle 上下文时，收集连续箭头行为独立列表
      flushMuscles();
      const items: string[] = [trimmedStart.replace(/^→\s*/, '')];
      i++;
      while (
        i < lines.length &&
        lines[i].trimStart().startsWith('→')
      ) {
        items.push(lines[i].trimStart().replace(/^→\s*/, ''));
        i++;
      }
      sections.push({ kind: 'arrowList', items });
      continue;
    }

    // 星标行：★ 开头（允许前面有缩进）
    if (trimmedStart.startsWith('★')) {
      // 如果已有当前肌肉条目，归入 muscle bullet
      if (currentMuscle) {
        currentMuscle.bullets.push({
          type: 'star',
          text: trimmedStart.replace(/^★\s*/, ''),
        });
        i++;
        continue;
      }
      // 没有 muscle 上下文时，收集连续星标行为独立列表
      flushMuscles();
      const items: string[] = [trimmedStart.replace(/^★\s*/, '')];
      i++;
      while (
        i < lines.length &&
        lines[i].trimStart().startsWith('★')
      ) {
        items.push(lines[i].trimStart().replace(/^★\s*/, ''));
        i++;
      }
      sections.push({ kind: 'starList', items });
      continue;
    }

    // 普通段落：如果当前正在处理肌肉条目，并且这一行明显是该条目的续行
    if (currentMuscle && (rawLine.startsWith('      ') || rawLine.startsWith('    '))) {
      // 视为上一条 bullet 的续行
      const last = currentMuscle.bullets[currentMuscle.bullets.length - 1];
      if (last) {
        last.text += '\n' + rawLine.trim();
      } else {
        currentMuscle.bullets.push({ type: 'arrow', text: rawLine.trim() });
      }
      i++;
      continue;
    }

    // 普通段落（与肌肉块无关）
    flushMuscles();
    sections.push({ kind: 'paragraph', text: rawLine.trim() });
    i++;
  }

  flushMuscles();
  return sections;
}

// ─── 样式配置 ─────────────────────────────────────────────────────────────────
const subtitleConfig: Record<
  SubtitleType,
  {
    bg: string;
    text: string;
    dot: string;
  }
> = {
  shortened: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
  lengthened: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  compensatory: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  default: { bg: 'bg-lab-green/10', text: 'text-lab-green', dot: 'bg-lab-green' },
};

const muscleCardConfig: Record<
  SubtitleType,
  {
    border: string;
    nameBg: string;
    nameText: string;
    numText: string;
    arrowColor: string;
    starBg: string;
    starText: string;
  }
> = {
  shortened: {
    border: 'border-orange-100',
    nameBg: 'bg-orange-50',
    nameText: 'text-orange-700',
    numText: 'text-orange-400',
    arrowColor: 'text-orange-400',
    starBg: 'bg-orange-50',
    starText: 'text-orange-600',
  },
  lengthened: {
    border: 'border-blue-100',
    nameBg: 'bg-blue-50',
    nameText: 'text-blue-700',
    numText: 'text-blue-400',
    arrowColor: 'text-blue-400',
    starBg: 'bg-blue-50',
    starText: 'text-blue-600',
  },
  compensatory: {
    border: 'border-gray-200',
    nameBg: 'bg-gray-50',
    nameText: 'text-gray-500',
    numText: 'text-gray-400',
    arrowColor: 'text-gray-400',
    starBg: 'bg-gray-100',
    starText: 'text-gray-500',
  },
  default: {
    border: 'border-gray-100',
    nameBg: 'bg-lab-green/5',
    nameText: 'text-lab-green',
    numText: 'text-lab-green/50',
    arrowColor: 'text-lab-green',
    starBg: 'bg-lab-green/10',
    starText: 'text-lab-green',
  },
};

// ─── 渲染函数 ─────────────────────────────────────────────────────────────────
function renderAnatomyBlock(raw: string, blockIndex: number) {
  const sections = parseAnatomyText(raw);
  let activeSubType: SubtitleType = 'default';

  return (
    <div key={blockIndex} className="space-y-3">
      {sections.map((sec, idx) => {
        if (sec.kind === 'title') {
          return (
            <div key={idx} className="flex items-center gap-2 pt-1">
              <span className="w-1 h-4 bg-lab-green rounded-full flex-shrink-0" />
              <span className="text-[14px] font-bold text-lab-dark">{sec.text}</span>
            </div>
          );
        }

        if (sec.kind === 'warning') {
          return (
            <div
              key={idx}
              className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-3"
            >
              <span className="text-[13px] mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-[12px] text-red-800 leading-relaxed whitespace-pre-line">
                {sec.text}
              </p>
            </div>
          );
        }

        if (sec.kind === 'subtitle') {
          activeSubType = sec.subType;
          const cfg = subtitleConfig[sec.subType];
          return (
            <div key={idx} className="flex items-center gap-2 mt-4">
              <span
                className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {sec.text}
              </span>
              <span className="flex-1 h-px bg-gray-100" />
            </div>
          );
        }

        if (sec.kind === 'muscles') {
          const cfg = muscleCardConfig[activeSubType];
          return (
            <div key={idx} className="space-y-2">
              {sec.entries.map((entry, eIdx) => (
                <div key={eIdx} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                  {/* 名称行 */}
                  <div className={`${cfg.nameBg} px-3.5 py-2 flex items-center gap-2`}>
                    <span className={`text-[10px] font-black ${cfg.numText}`}>
                      {String(eIdx + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-[13px] font-semibold ${cfg.nameText} leading-snug`}>
                      {entry.name}
                    </span>
                  </div>

                  {/* 内容行 */}
                  {entry.bullets.length > 0 && (
                    <div className="px-3.5 py-2.5 space-y-2 bg-white">
                      {entry.bullets.map((b, bIdx) => {
                        if (b.type === 'arrow') {
                          return (
                            <div key={bIdx} className="flex items-start gap-2">
                              <span
                                className={`text-[12px] ${cfg.arrowColor} flex-shrink-0 mt-0.5`}
                              >
                                →
                              </span>
                              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-line">
                                {b.text}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={bIdx}
                            className={`flex items-start gap-2 ${cfg.starBg} rounded-lg px-2.5 py-2`}
                          >
                            <span className={`text-[11px] ${cfg.starText} flex-shrink-0 mt-0.5`}>
                              ★
                            </span>
                            <p
                              className={`text-[12px] ${cfg.starText} font-medium leading-relaxed whitespace-pre-line`}
                            >
                              {b.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        if (sec.kind === 'priority') {
          const match = sec.level.match(/^(第[^：:]+)[：:](.*)/);
          const levelLabel = match ? match[1].trim() : sec.level;
          const levelDesc = match ? match[2].trim() : '';

          return (
            <div key={idx} className="rounded-xl bg-lab-bg border border-black/[0.04] overflow-hidden">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-black/[0.04]">
                <span className="text-[10px] font-black text-white bg-lab-green px-2 py-0.5 rounded-full whitespace-nowrap">
                  {levelLabel}
                </span>
                {levelDesc && (
                  <span className="text-[13px] font-semibold text-lab-dark whitespace-pre-line">
                    {levelDesc}
                  </span>
                )}
              </div>
              {sec.lines.length > 0 && (
                <div className="px-3.5 py-2.5 space-y-1.5">
                  {sec.lines.map((l, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-2">
                      <span className="mt-[6px] w-1 h-1 rounded-full bg-lab-green/40 flex-shrink-0" />
                      <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-line">
                        {l}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (sec.kind === 'arrowList') {
          return (
            <div key={idx} className="space-y-2">
              {sec.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-start gap-2">
                  <span className="text-[12px] text-lab-green flex-shrink-0 mt-0.5">
                    →
                  </span>
                  <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-line">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          );
        }

        if (sec.kind === 'starList') {
          return (
            <div key={idx} className="space-y-2">
              {sec.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="flex items-start gap-2 bg-amber-50 rounded-lg px-2.5 py-2"
                >
                  <span className="text-[11px] text-amber-600 flex-shrink-0 mt-0.5">
                    ★
                  </span>
                  <p className="text-[12px] text-amber-600 font-medium leading-relaxed whitespace-pre-line">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          );
        }

        if (sec.kind === 'paragraph') {
          return (
            <p
              key={idx}
              className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line"
            >
              {sec.text}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function Detail({ item, onBack, onAskAI }: DetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [item]);

  return (
    <div className="absolute inset-0 z-20 bg-lab-bg flex flex-col animate-[slideIn_0.3s_ease-out]">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <header className="h-14 flex items-center px-4 flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-black/5 relative z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-lab-dark hover:text-lab-green transition-colors rounded-full"
        >
          <span className="iconify ph--arrow-left text-xl"></span>
        </button>
        <div className="flex-1 text-center font-bold text-lab-dark tracking-wide truncate px-2 text-[15px]">
          条目详情
        </div>
        <div className="w-10"></div>
      </header>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 pb-28">
        {/* 标题区 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-lab-dark text-white px-2.5 py-1 rounded text-[11px] font-bold">
              {item.category.split('-')[1] || item.category}
            </span>
            {item.tags.map(tag => (
              <span
                key={tag}
                className="bg-lab-green/10 text-lab-green px-2.5 py-1 rounded text-[11px] font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-lab-dark leading-tight">{item.name}</h1>
        </div>

        {/* 运动解剖分析 */}
        <section className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-black/[0.03]">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-lab-dark mb-4 pb-2 border-b border-gray-100">
            <span className="iconify ph--skeleton text-lab-green text-lg"></span>
            运动解剖分析
          </h2>
          <div className="space-y-6">
            {item.anatomy.map((text, idx) => renderAnatomyBlock(text, idx))}
          </div>
        </section>

        {/* 训练方案 */}
        <section className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-black/[0.03]">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-lab-dark mb-4 pb-2 border-b border-gray-100">
            <span className="iconify ph--activity text-lab-green text-lg"></span>
            训练方案
          </h2>

          {/* 训练目标 */}
          <div className="mb-5 bg-lab-bg p-3.5 rounded-xl border border-black/[0.02]">
            <p className="text-lab-dark text-[13px] leading-relaxed font-medium">
              <span className="text-lab-green font-bold mr-1">目标：</span>
              {item.training.goal}
            </p>
          </div>

          {/* 训练动作 */}
          <div className="space-y-5">
            {item.training.actions.map((action, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-lab-dark text-[14px] mb-2.5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-lab-light text-lab-dark flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {action.name}
                </h3>
                <ul className="space-y-2 pl-7">
                  {action.points.map((pt, pIdx) => (
                    <li
                      key={pIdx}
                      className="text-gray-600 text-[13px] leading-relaxed relative"
                    >
                      <span className="absolute -left-3.5 top-2 w-1 h-1 bg-lab-gray/40 rounded-full"></span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 临床笔记 */}
          {item.training.notes.length > 0 && (
            <div className="mt-6 bg-lab-blue/20 rounded-xl p-4 border border-lab-blue/30">
              <h4 className="text-[12px] font-bold text-lab-green mb-2 flex items-center gap-1.5">
                <span className="iconify ph--info text-sm"></span>
                临床笔记
              </h4>
              <ul className="space-y-1.5">
                {item.training.notes.map((note, idx) => (
                  <li
                    key={idx}
                    className="text-lab-dark text-[12px] leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="text-lab-green opacity-50 mt-0.5 flex-shrink-0">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 禁忌与注意事项 */}
        {item.contraindications.length > 0 && (
          <section className="mb-6 bg-[#FFF5F5] rounded-2xl p-5 border border-red-100">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-red-700 mb-3">
              <span className="iconify ph--warning-circle text-lg"></span>
              禁忌与注意事项
            </h2>
            <ul className="space-y-2.5">
              {item.contraindications.map((text, idx) => (
                <li
                  key={idx}
                  className="text-red-900/90 text-[13px] leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 底部悬浮按钮 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[85%]">
        <button
          onClick={onAskAI}
          className="w-full bg-lab-dark text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform"
        >
          <span className="iconify ph--robot text-xl text-lab-green"></span>
          <span className="font-bold text-[15px] tracking-widest">对此问题问 AI</span>
        </button>
      </div>
    </div>
  );
}
