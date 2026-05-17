import html2pdf from 'html2pdf.js';
import { PlanWithMember } from '../types/plan';
import { TRAINING_GOAL_LABELS } from '../types/member';

export async function exportPlanPDF(plan: PlanWithMember): Promise<void> {
  const member = plan.member;
  const container = document.createElement('div');
  container.style.cssText =
    'padding: 0; font-family: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif; color: #2C332F; line-height: 1.7; max-width: 800px; margin: 0 auto; background: #fff;';

  const priorityMeta: Record<number, { color: string; bg: string; label: string }> = {
    1: { color: '#9B2C2C', bg: '#FDF0F0', label: '第一优先级' },
    2: { color: '#975A16', bg: '#FFFBEB', label: '第二优先级' },
    3: { color: '#276749', bg: '#F0FFF4', label: '第三优先级' },
    4: { color: '#4A5568', bg: '#F7FAFC', label: '第四优先级' },
  };

  const priorityStyle = (p: number) => {
    const meta = priorityMeta[p] || priorityMeta[4];
    return `color: ${meta.color}; background: ${meta.bg}; border: 1px solid ${meta.color}22;`;
  };

  const html = `
    <!-- Header -->
    <div style="background: #3D5A4C; padding: 36px 40px 28px; color: #fff;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top;">
            <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.75; margin-bottom: 8px;">PILATES TRAINING PLAN</div>
            <h1 style="font-size: 26px; font-weight: 600; margin: 0; line-height: 1.3;">${escapeHtml(plan.title || '训练计划')}</h1>
          </td>
          <td style="vertical-align: top; text-align: right; width: 140px;">
            <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">生成日期</div>
            <div style="font-size: 14px; font-weight: 500;">${new Date(plan.createdAt).toLocaleDateString('zh-CN')}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Member Card -->
    ${member ? `
    <div style="padding: 24px 40px; background: #F8FAF9; border-bottom: 1px solid #E8EDE9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 48px; vertical-align: top;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #3D5A4C; color: #fff; text-align: center; line-height: 40px; font-size: 16px; font-weight: 600;">
              ${escapeHtml(member.name.charAt(0))}
            </div>
          </td>
          <td style="vertical-align: top; padding-left: 14px;">
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">
              ${escapeHtml(member.name)}
              <span style="font-size: 12px; font-weight: 400; color: #6B7B70; margin-left: 8px;">
                ${member.gender === 'female' ? '女' : member.gender === 'male' ? '男' : '其他'}${member.age ? ` · ${member.age}岁` : ''}${member.parous ? ' · 已育' : ''}
              </span>
            </div>
            ${member.goals.length > 0 ? `
            <div style="margin-top: 6px;">
              ${member.goals.map(g => `<span style="display: inline-block; font-size: 11px; color: #3D5A4C; background: #E8F0EB; padding: 2px 8px; border-radius: 10px; margin-right: 6px; margin-bottom: 4px;">${TRAINING_GOAL_LABELS[g] || g}</span>`).join('')}
            </div>
            ` : ''}
          </td>
          ${member.focusAreas.length > 0 || member.painPoints.length > 0 ? `
          <td style="vertical-align: top; text-align: right; width: 200px;">
            ${member.focusAreas.length > 0 ? `<div style="font-size: 11px; color: #8B958E; margin-bottom: 2px;">重点部位</div><div style="font-size: 12px; color: #4A564E; margin-bottom: 8px;">${escapeHtml(member.focusAreas.join(' / '))}</div>` : ''}
            ${member.painPoints.length > 0 ? `<div style="font-size: 11px; color: #8B958E; margin-bottom: 2px;">疼痛点</div><div style="font-size: 12px; color: #C75B5B;">${escapeHtml(member.painPoints.join(' / '))}</div>` : ''}
          </td>
          ` : ''}
        </tr>
      </table>
      ${member.medicalNotes ? `
      <div style="margin-top: 12px; padding: 10px 14px; background: #fff; border-radius: 6px; border-left: 3px solid #D4A017; font-size: 12px; color: #5A635C;">
        <strong style="color: #8B6914;">医学备注：</strong>${escapeHtml(member.medicalNotes)}
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Plan Notes -->
    ${plan.notes ? `
    <div style="padding: 20px 40px; background: #FAFCFB;">
      <div style="padding: 14px 18px; background: #fff; border-radius: 8px; border: 1px solid #E0E8E3;">
        <div style="font-size: 11px; font-weight: 600; color: #3D5A4C; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">计划备注</div>
        <div style="font-size: 13px; color: #4A564E; white-space: pre-wrap;">${escapeHtml(plan.notes)}</div>
      </div>
    </div>
    ` : ''}

    <!-- Items -->
    <div style="padding: 24px 40px 32px;">
      <div style="margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: 600; color: #3D5A4C; letter-spacing: 1px; text-transform: uppercase;">训练条目</span>
        <span style="font-size: 12px; color: #8B958E; margin-left: 8px;">共 ${plan.items.length} 项</span>
      </div>

      ${plan.items.map((item, idx) => {
        const pMeta = priorityMeta[item.priority] || priorityMeta[4];
        return `
        <div style="margin-bottom: 28px; page-break-inside: avoid;">
          <!-- Item Header -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <tr>
              <td style="width: 36px; vertical-align: top;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #3D5A4C; color: #fff; text-align: center; line-height: 28px; font-size: 13px; font-weight: 600;">${idx + 1}</div>
              </td>
              <td style="vertical-align: top; padding-left: 10px;">
                <div style="font-size: 15px; font-weight: 600; color: #2C332F; line-height: 28px;">${escapeHtml(item.name)}</div>
              </td>
              <td style="vertical-align: top; text-align: right; width: 120px;">
                <span style="display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 4px; ${priorityStyle(item.priority)}">${pMeta.label}</span>
              </td>
            </tr>
          </table>

          <!-- Category tag -->
          <div style="margin-left: 38px; margin-bottom: 12px;">
            <span style="font-size: 11px; color: #8B958E; background: #F0F2F0; padding: 2px 8px; border-radius: 4px;">${escapeHtml(item.category)}</span>
          </div>

          <!-- Actions -->
          <div style="margin-left: 38px;">
            ${item.actions.map(action => `
              <div style="margin-bottom: 14px; padding: 12px 16px; background: #FAFCFB; border-radius: 6px; border: 1px solid #EDF1EE;">
                <div style="font-size: 13px; font-weight: 600; color: #3D5A4C; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #E0E8E3;">
                  ${escapeHtml(action.name)}
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${action.points.map((point, pi) => `
                    <tr>
                      <td style="width: 16px; vertical-align: top; padding-top: 2px;">
                        <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #7A8B7E; margin-top: 7px;"></span>
                      </td>
                      <td style="font-size: 12px; color: #4A564E; padding-bottom: ${pi === action.points.length - 1 ? '0' : '5px'};">
                        ${escapeHtml(point)}
                      </td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            `).join('')}
          </div>

          <!-- Notes & Contraindications -->
          ${item.notes.length > 0 || item.contraindications.length > 0 ? `
          <div style="margin-left: 38px; margin-top: 10px;">
            ${item.notes.length > 0 ? `
            <div style="padding: 10px 14px; background: #F0F7FF; border-radius: 6px; border-left: 3px solid #4A90D9; margin-bottom: 8px;">
              <div style="font-size: 10px; font-weight: 600; color: #4A90D9; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">教练备注</div>
              <div style="font-size: 12px; color: #2D4A66;">
                ${item.notes.map(n => `<span style="display: block; margin-bottom: 2px;">· ${escapeHtml(n)}</span>`).join('')}
              </div>
            </div>
            ` : ''}
            ${item.contraindications.length > 0 ? `
            <div style="padding: 10px 14px; background: #FDF5F5; border-radius: 6px; border-left: 3px solid #C75B5B;">
              <div style="font-size: 10px; font-weight: 600; color: #C75B5B; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">禁忌症 / 注意事项</div>
              <div style="font-size: 12px; color: #7B2D2D;">
                ${item.contraindications.map(c => `<span style="display: block; margin-bottom: 2px;">· ${escapeHtml(c)}</span>`).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}
        </div>
        `;
      }).join('')}
    </div>

    <!-- Footer -->
    <div style="padding: 20px 40px; background: #F8FAF9; border-top: 1px solid #E8EDE9; text-align: center;">
      <div style="font-size: 11px; color: #8B958E; line-height: 1.6;">
        <div style="font-weight: 500; color: #6B7B70; margin-bottom: 2px;">普拉提教练手册 · Pilates Coach Handbook</div>
        <div style="font-size: 10px; opacity: 0.8;">本计划仅供专业教练参考使用，请根据会员实际情况调整训练内容</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  const opt: any = {
    margin: [0, 0, 0, 0],
    filename: `${plan.title || '训练计划'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css'], before: '.page-break-before', after: '.page-break-after' },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
