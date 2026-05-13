import html2pdf from 'html2pdf.js';
import { PlanWithMember } from '../types/plan';

export async function exportPlanPDF(plan: PlanWithMember): Promise<void> {
  const member = plan.member;
  const container = document.createElement('div');
  container.style.cssText = 'padding: 40px; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1C221E; line-height: 1.6; max-width: 800px; margin: 0 auto;';

  const html = `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #5E7161; padding-bottom: 20px;">
      <h1 style="font-size: 24px; font-weight: bold; color: #1C221E; margin: 0 0 8px 0;">${escapeHtml(plan.title)}</h1>
      <p style="font-size: 13px; color: #8B958E; margin: 0;">
        ${member ? `会员: ${escapeHtml(member.name)} · ${member.gender === 'female' ? '女' : member.gender === 'male' ? '男' : '其他'}${member.age ? ` · ${member.age}岁` : ''}` : ''}
      </p>
      <p style="font-size: 12px; color: #8B958E; margin: 4px 0 0 0;">
        生成时间: ${new Date(plan.createdAt).toLocaleDateString('zh-CN')}
      </p>
    </div>

    ${plan.notes ? `
      <div style="background: #F0F2F0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: bold; color: #5E7161; margin: 0 0 8px 0;">计划备注</p>
        <p style="font-size: 13px; color: #1C221E; margin: 0;">${escapeHtml(plan.notes)}</p>
      </div>
    ` : ''}

    <div style="margin-bottom: 16px;">
      <p style="font-size: 14px; font-weight: bold; color: #5E7161; margin: 0;">共 ${plan.items.length} 个训练条目</p>
    </div>

    ${plan.items.map((item, idx) => `
      <div style="margin-bottom: 24px; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
        <div style="background: #F8F9F8; padding: 16px 20px; border-bottom: 1px solid #E5E7EB;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <span style="background: #5E7161; color: white; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 4px;">优先级 ${item.priority}</span>
            <span style="font-size: 12px; color: #8B958E;">${escapeHtml(item.category)}</span>
          </div>
          <h2 style="font-size: 17px; font-weight: bold; color: #1C221E; margin: 8px 0 0 0;">${idx + 1}. ${escapeHtml(item.name)}</h2>
        </div>

        <div style="padding: 16px 20px;">
          ${item.actions.map(action => `
            <div style="margin-bottom: 14px;">
              <p style="font-size: 14px; font-weight: bold; color: #1C221E; margin: 0 0 6px 0;">${escapeHtml(action.name)}</p>
              <ul style="margin: 0; padding-left: 18px;">
                ${action.points.map(point => `
                  <li style="font-size: 12px; color: #4B5563; margin-bottom: 3px;">${escapeHtml(point)}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}

          ${item.notes.length > 0 ? `
            <div style="background: #DCEEF2; border-radius: 8px; padding: 12px; margin-top: 10px;">
              <p style="font-size: 11px; font-weight: bold; color: #1C221E; margin: 0 0 6px 0;">教练备注</p>
              ${item.notes.map(note => `
                <p style="font-size: 12px; color: #374151; margin: 0 0 3px 0;">· ${escapeHtml(note)}</p>
              `).join('')}
            </div>
          ` : ''}

          ${item.contraindications.length > 0 ? `
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; margin-top: 10px;">
              <p style="font-size: 11px; font-weight: bold; color: #DC2626; margin: 0 0 6px 0;">禁忌症 / 注意事项</p>
              ${item.contraindications.map(c => `
                <p style="font-size: 12px; color: #991B1B; margin: 0 0 3px 0;">· ${escapeHtml(c)}</p>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
      <p style="font-size: 11px; color: #8B958E; margin: 0;">本计划由普拉提教练手册生成，仅供专业教练参考使用</p>
    </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  const opt: any = {
    margin: [10, 10, 10, 10],
    filename: `${plan.title || '训练计划'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
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
