import { Contraindication, MedicalHistoryRule } from '../types/personalizedPlan';

/**
 * 病史规则库
 * 定义常见病史对应的禁忌症和注意事项
 */

export const medicalHistoryRules: MedicalHistoryRule[] = [
  {
    keywords: ['ACL', '前叉', '前交叉韧带', 'anterior cruciate ligament'],
    contraindications: [
      {
        level: 'forbidden',
        action: '单腿桥式',
        reason: '单腿支撑时ACL承受剪切力是双腿的3-4倍，重建术后动态稳定性不足',
      },
      {
        level: 'forbidden',
        action: '单腿深蹲',
        reason: '单腿支撑+深蹲位ACL张力峰值，剪切力极大',
      },
      {
        level: 'forbidden',
        action: '单腿硬拉',
        reason: '单腿支撑+前屈位，ACL前向剪切力与旋转剪切力叠加',
      },
      {
        level: 'forbidden',
        action: '跳跃（任何离地动作）',
        reason: '落地瞬间ACL承受冲击力可达体重的5-8倍',
      },
      {
        level: 'forbidden',
        action: '侧向滑步/快速变向',
        reason: '急停变向时ACL前向剪切力和旋转剪切力叠加，是ACL再次损伤最高危动作',
      },
      {
        level: 'forbidden',
        action: '不稳定平面训练（BOSU球/平衡垫/泡沫轴）',
        reason: '不稳定平面迫使膝关节快速微调，ACL术后本体感觉缺陷无法安全应对',
      },
      {
        level: 'forbidden',
        action: '跪姿转身/远端固定的股骨内旋',
        reason: '脚固定于地面、股骨发生内旋时，对ACL产生扭转剪切力。重建后移植物扭转耐受力仅为正常ACL的30-50%',
      },
      {
        level: 'forbidden',
        action: '盘腿坐',
        reason: '远端固定的股骨外旋+内旋复合，对ACL产生扭转应力',
      },
      {
        level: 'forbidden',
        action: '弓步（前后分腿蹲）',
        reason: '前腿膝关节屈曲>60度时ACL张力峰值，产生前向剪切力',
      },
      {
        level: 'forbidden',
        action: '负重深蹲',
        reason: '深度屈曲增加ACL峰值张力，叠加负重后剪切力极大',
      },
      {
        level: 'caution',
        action: '靠墙微蹲',
        reason: '双膝ACL重建叠加下需确认膝关节稳定性，建议角度控制在15-30度',
      },
      {
        level: 'caution',
        action: '双腿对称桥式',
        reason: '顶端时双侧臀大肌需均匀收缩，若单侧主导说明膝关节不稳定',
      },
      {
        level: 'caution',
        action: '侧卧蚌式',
        reason: '侧卧位可能牵拉膝关节外侧结构，打开角度建议控制在20-30度',
      },
      {
        level: 'caution',
        action: 'Reformer双腿推蹬',
        reason: '弹簧阻力下膝关节承受动态负荷，需确认移植物对渐进负荷的耐受性',
      },
    ],
    specialNotes: [
      'ACL重建术后移植物通常需18-24个月完全成熟，术后1年时力学强度约为正常ACL的50-70%',
      '术后6-12个月是ACL再次损伤的第二个高峰期，即使会员感觉良好仍需保持谨慎',
      '开始任何下肢负重训练前，必须获得手术医生的书面确认',
      '建议定期（每3个月）复查膝关节稳定性（Lachman试验+KT-1000关节动度仪）',
      '功能性测试通过标准：单腿跳跃距离达健侧90%以上，Y平衡测试三个方向均达正常值',
    ],
  },
  {
    keywords: ['糖尿病', 'diabetes', 'diabetic'],
    contraindications: [
      {
        level: 'caution',
        action: '任何关节活动度训练',
        reason: '糖尿病患者关节囊炎症反应更重，活动度恢复更慢，需更保守',
      },
      {
        level: 'caution',
        action: '大负荷抗阻训练',
        reason: '血糖控制不佳（HbA1c>8%）时，组织修复能力下降',
      },
    ],
    specialNotes: [
      '糖尿病患者肩周炎发病率是普通人的3-5倍，且自然病程更长（可达3-5年）',
      '所有训练强度降低30-50%，进度放慢至普通会员的1/2',
      '血糖控制不佳（HbA1c>8%）时，建议先改善血糖控制再系统训练',
      '注意足部皮肤保护，糖尿病患者足部感觉减退，泡沫轴/筋膜球松解时需控制力度',
    ],
  },
  {
    keywords: ['骨质疏松', 'osteoporosis', '骨密度下降'],
    contraindications: [
      {
        level: 'forbidden',
        action: '任何脊柱前屈负重动作',
        reason: '骨质疏松患者椎体压缩性骨折风险高，脊柱前屈负重可诱发骨折',
      },
      {
        level: 'forbidden',
        action: '大幅度脊柱旋转',
        reason: '旋转应力增加椎体压缩性骨折风险',
      },
      {
        level: 'caution',
        action: '脊柱伸展（后弯）',
        reason: '严重骨质疏松（T值<-2.5）时需谨慎，建议骨密度评估后制定方案',
      },
    ],
    specialNotes: [
      '严重骨质疏松（T值<-2.5）时所有负重动作需医生评估后调整',
      '避免快速或突然的动作转换，所有动作应缓慢控制',
    ],
  },
  {
    keywords: ['孕产', '怀孕', '产后', 'prenatal', 'postnatal', '盆底'],
    contraindications: [
      {
        level: 'forbidden',
        action: '仰卧位动作（孕中晚期）',
        reason: '仰卧位可能压迫下腔静脉，影响胎盘血流',
      },
      {
        level: 'forbidden',
        action: '腹部卷曲类动作（产后早期）',
        reason: '腹直肌分离未恢复前，腹部卷曲会加重分离',
      },
      {
        level: 'caution',
        action: '任何增加腹压的动作',
        reason: '孕期增加腹压可能影响胎儿；产后早期影响盆底恢复',
      },
    ],
    specialNotes: [
      '孕中晚期训练目标仅为维持功能和缓解疼痛，不追求力量进步',
      '产后6-8周松弛素水平基本恢复后再进行系统康复',
      '所有动作在无痛范围内进行，夜间可使用骨盆带辅助稳定',
    ],
  },
  {
    keywords: ['肩袖撕裂', 'rotator cuff tear'],
    contraindications: [
      {
        level: 'forbidden',
        action: '任何手臂过头动作',
        reason: '手臂上举时肩峰下间隙减小，肩袖撕裂者肌腱可能进一步受损',
      },
      {
        level: 'forbidden',
        action: '暴力被动牵伸肩关节',
        reason: '被动暴力牵伸可能加重肩袖撕裂',
      },
    ],
    specialNotes: [
      '肩袖全层撕裂时强行进行活动度训练可能加重撕裂',
      '需骨科/影像学确认撕裂程度后制定方案',
    ],
  },
  {
    keywords: ['腰椎间盘突出', '腰突', 'herniated disc'],
    contraindications: [
      {
        level: 'forbidden',
        action: '脊柱前屈负重动作（如直腿触地）',
        reason: '前屈位增加椎间盘后方压力，可能加重突出',
      },
      {
        level: 'forbidden',
        action: '脊柱旋转+前屈复合动作',
        reason: '旋转+前屈是椎间盘损伤最高危的动作组合',
      },
      {
        level: 'caution',
        action: '任何增加腰椎压力的动作',
        reason: '需确认椎间盘突出程度，急性期以核心稳定为主',
      },
    ],
    specialNotes: [
      '急性期以腹横肌激活和骨盆中立位训练为主',
      '避免任何引起下肢放射痛的动作，出现放射痛立即停止',
    ],
  },
  {
    keywords: ['髋关节置换', 'hip replacement', 'THA'],
    contraindications: [
      {
        level: 'forbidden',
        action: '髋关节屈曲>90度',
        reason: '术后早期人工关节脱位风险高',
      },
      {
        level: 'forbidden',
        action: '髋关节内收过中线',
        reason: '术后早期人工关节脱位风险高',
      },
      {
        level: 'forbidden',
        action: '髋关节内旋',
        reason: '后外侧入路术后，内旋是脱位高危动作',
      },
    ],
    specialNotes: [
      '术后6周内严格遵守手术医生给出的活动限制',
      '不同手术入路（前侧/后侧/外侧）的禁忌动作不同，需确认具体入路',
    ],
  },
];

/**
 * 根据病史文本匹配规则
 */
export function matchMedicalHistoryRules(historyText: string): MedicalHistoryRule[] {
  const matched: MedicalHistoryRule[] = [];
  const lowerText = historyText.toLowerCase();

  for (const rule of medicalHistoryRules) {
    for (const keyword of rule.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(rule);
        break;
      }
    }
  }

  return matched;
}

/**
 * 合并多个规则的禁忌症和注意事项
 */
export function mergeMedicalRules(rules: MedicalHistoryRule[]): {
  contraindications: Contraindication[];
  specialNotes: string[];
} {
  const contraindications: Contraindication[] = [];
  const specialNotes: string[] = [];

  for (const rule of rules) {
    for (const c of rule.contraindications) {
      // 去重：相同动作只保留最严格的级别
      const existing = contraindications.find(x => x.action === c.action);
      if (!existing) {
        contraindications.push({ ...c });
      } else if (c.level === 'forbidden' && existing.level !== 'forbidden') {
        existing.level = 'forbidden';
        existing.reason = c.reason;
      } else if (c.level === 'caution' && existing.level === 'safe') {
        existing.level = 'caution';
        existing.reason = c.reason;
      }
    }

    for (const note of rule.specialNotes) {
      if (!specialNotes.includes(note)) {
        specialNotes.push(note);
      }
    }
  }

  // 排序：forbidden > caution > safe
  const levelOrder = { forbidden: 0, caution: 1, safe: 2 };
  contraindications.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return { contraindications, specialNotes };
}
