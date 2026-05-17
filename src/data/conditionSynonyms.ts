/**
 * 体态描述同义词映射
 * key: 知识库条目ID
 * value: 该条目可能的各种中文描述/同义词
 */

export const conditionSynonyms: Record<string, string[]> = {
  'forward-head': ['头前引', '头部前倾', '乌龟颈', '颈椎前倾', '探颈'],
  'rounded-shoulders': ['圆肩', '含胸', '肩膀内扣', '肩胛前伸'],
  'thoracic-kyphosis': ['胸椎后凸过大', '驼背', '胸椎屈曲', '胸椎段屈曲', '弓背'],
  'lumbar-hyperlordosis': ['腰椎前凸过大', '塌腰', '下交叉综合征'],
  'pelvic-anterior-tilt': ['骨盆前倾', '翘臀', '骨盆前旋'],
  'pelvic-posterior-tilt': ['骨盆后倾', '骨盆后旋'],
  'scoliosis': ['脊柱侧弯', '侧弯', 'S型脊柱', 'C型脊柱'],
  'genu-varum': ['O型腿', '膝内翻', '罗圈腿'],
  'genu-valgum': ['X型腿', '膝外翻', '膝盖内扣', '膝内扣'],
  'false-wide-hips': ['假胯宽', '胯宽', '大腿根粗'],
  'flatfoot': ['扁平足', '足弓塌陷', '低足弓', '平足'],
  'high-arch': ['高弓足', '高足弓', '足弓过高'],
  'uneven-shoulders': ['高低肩', '肩膀不平', '斜肩'],
  'winged-scapula': ['翼状肩胛', '蝴蝶骨', '肩胛外翻'],
  'thoracic-rigidity': ['胸椎僵硬', '胸背僵硬', '胸椎活动受限'],
  'sacral-prominence': ['骶骨突出', '骶骨翘起', '腰骶凹陷'],
  'pelvic-lateral-tilt': ['骨盆侧倾', '骨盆歪斜', '长短腿伴随'],
  'pelvic-unilateral-rotation': ['骨盆单侧旋转', '骨盆旋转', '骨盆右旋', '骨盆左旋', '前倾且右旋', '前倾且左旋', '后倾且右旋', '后倾且左旋'],
  'hip-labral-tear': ['髋臼唇撕裂', '髋关节盂唇损伤'],
  'patellar-dislocation': ['髌骨脱位', '髌骨错位'],
  'chondromalacia-patella': ['髌骨软化', '髌股关节疼痛', '膝盖前方疼痛'],
  'acl-tear': ['前叉断裂', 'ACL断裂', '前交叉韧带断裂', '前叉损伤'],
  'toe-fracture': ['趾骨骨折', '脚趾骨折'],
  'unilateral-absence-latissimus': ['单侧背阔肌缺失', '背阔肌缺失'],
  'hip-osteotomy': ['髋截骨术后', '髋臼截骨术后'],
  'sacroiliac-joint-pain': ['骶髂关节疼痛', '腰骶疼痛', '屁股上方疼痛'],
  'pubic-symphysis-pain': ['耻骨联合疼痛', '耻骨疼痛', '孕期耻骨痛'],
  'hip-snapping': ['髋关节弹响', '弹响髋', '髋弹响'],
  'limited-ankle-dorsiflexion': ['足背屈受限', '踝背屈不足', '勾脚困难'],
  'knee-hyperextension': ['膝超伸', '膝反弓', '膝盖过伸'],
  'elbow-hyperextension': ['肘超伸', '肘关节过伸', '关节松弛'],
  'chronic-ankle-instability': ['习惯性崴脚', '慢性踝关节不稳', '反复崴脚', '踝关节不稳'],
  'frozen-shoulder': ['肩周炎', '冻结肩', '五十肩', '粘连性肩关节囊炎'],
};

/**
 * 根据描述文本匹配知识库条目ID
 */
export function matchConditionsByText(text: string): string[] {
  const ids: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [id, synonyms] of Object.entries(conditionSynonyms)) {
    for (const synonym of synonyms) {
      if (lowerText.includes(synonym.toLowerCase())) {
        if (!ids.includes(id)) {
          ids.push(id);
        }
        break;
      }
    }
  }

  return ids;
}

/**
 * 根据标签列表匹配知识库条目ID
 */
export function matchConditionsByLabels(labels: string[]): string[] {
  const ids: string[] = [];

  for (const label of labels) {
    for (const [id, synonyms] of Object.entries(conditionSynonyms)) {
      if (synonyms.includes(label) || id === label) {
        if (!ids.includes(id)) {
          ids.push(id);
        }
        break;
      }
    }
  }

  return ids;
}
