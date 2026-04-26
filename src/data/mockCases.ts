export interface PilatesCase {
  id: string;
  category: string;
  title: string;
  description: string;
  anatomyAnalysis: string[];
  pilatesStrategy: string[];
  precautions: string[];
}

export const mockCases: PilatesCase[] = [
  {
    id: 'leg-x',
    category: '下肢体态问题',
    title: 'X型腿 (膝外翻)',
    description: '双足并拢时，双膝可以并拢，但双踝不能靠拢。通常伴随大腿内旋、小腿外旋及足弓塌陷。',
    anatomyAnalysis: [
      '过紧/过度活跃的肌肉：髋内收肌群、阔筋膜张肌、髂胫束、股二头肌短头、腓肠肌外侧头。',
      '无力/被拉长的肌肉：臀中肌、臀小肌、髋外旋肌群（梨状肌等）、股内侧肌。',
      '骨盆及下肢力线：常伴随骨盆前倾或骨盆宽大，股骨过度内旋导致膝关节内侧韧带（MCL）拉扯受压，外侧半月板受压严重。'
    ],
    pilatesStrategy: [
      '松解与拉伸：利用泡沫轴或手法放松阔筋膜张肌、髂胫束和内收肌群。',
      '强化臀部肌群（外展/外旋）：例如蚌壳式（Clam）、侧卧抬腿（Side Lying Leg Lift）、弹力带横向行走。',
      '强化股四头肌内侧头：在Reform上的Footwork系列，可以夹小球保持内收肌微微启动的同时，强调股内侧肌的发力，重塑膝盖轨迹。',
      '足底与踝关节训练：练习短足运动（Short Foot Exercise），激活足弓，改善足踝力线，因为足弓塌陷常与X型腿相伴发。'
    ],
    precautions: [
      '避免大重量的深蹲，尤其是膝盖内扣趋势明显的动作。',
      '在所有下肢闭链运动中（如站姿、踏板动作），必须教练口令辅助或使用弹力带套在膝盖外侧，强迫会员启动臀大肌和外展肌群来对抗。'
    ]
  },
  {
    id: 'leg-o',
    category: '下肢体态问题',
    title: 'O型腿 (膝内翻)',
    description: '双足并拢时，双踝可以靠拢，但双膝不能并拢。通常伴随股骨外旋或胫骨内旋。',
    anatomyAnalysis: [
      '过紧/过度活跃的肌肉：髋外旋肌群（深层六大外旋肌）、臀大肌下部、股二头肌长头。',
      '无力/被拉长的肌肉：髋内收肌群、阔筋膜张肌、臀中肌前束。',
      '骨盆及下肢力线：常伴随骨盆后倾，膝关节外侧韧带（LCL）被过度拉扯，内侧半月板磨损压力增大。'
    ],
    pilatesStrategy: [
      '松解与拉伸：重点放松臀部深层外旋肌群和腘绳肌外侧。',
      '强化内收肌群：在垫上或Reformer上大量使用Magic Circle（魔术圈），例如仰卧夹圈桥式（Shoulder Bridge with Magic Circle）。',
      '核心与骨盆中立位控制：O型腿常伴随骨盆后倾，需要重新建立骨盆中立位的感知，强化下腹部和屈髋肌群。',
      '下肢整体力线纠正：在Footwork中，强调大脚趾球、小脚趾球和足跟三点支撑，利用普拉提床的弹簧阻力，练习在正确的髋膝踝力线下进行屈伸。'
    ],
    precautions: [
      '避免长时间盘腿坐或过度外八字站立。',
      '训练初期避免过多单腿负重动作，防止膝关节侧向剪切力过大。'
    ]
  },
  {
    id: 'spine-kyphosis',
    category: '脊柱与胸廓问题',
    title: '上交叉综合征 (圆肩驼背)',
    description: '常见的现代人办公体态，表现为头部前引、颈椎生理曲度变直、胸椎后凸增加（驼背）、双肩内扣。',
    anatomyAnalysis: [
      '过紧肌肉（前方）：胸大肌、胸小肌、背阔肌、肩胛提肌、上斜方肌、胸锁乳突肌。',
      '无力肌肉（后方）：菱形肌、中下斜方肌、前锯肌、颈部深层屈肌。'
    ],
    pilatesStrategy: [
      '胸部打开与伸展：在Spine Corrector（脊柱矫正器）或滚筒上进行胸椎伸展（Thoracic Extension）。',
      '强化肩胛骨稳定：在Reformer上练习Pulling Straps（拉带）和 T-Press，重点激活中下斜方肌和菱形肌。',
      '颈椎灵活性与深层屈肌：练习点头动作（Nodding），激活颈长肌。'
    ],
    precautions: [
      '在做任何腹部卷起（Roll Up/Chest Lift）动作时，需注意不要让颈部代偿前伸，若头前引严重，可在头部后方垫小毛巾。'
    ]
  },
  {
    id: 'spine-pelvic-tilt',
    category: '骨盆与腰椎问题',
    title: '骨盆前倾 (下交叉综合征)',
    description: '骨盆向前旋转，导致腰椎前凸曲度过大，常伴随小腹凸出和塌腰。',
    anatomyAnalysis: [
      '过紧肌肉：髂腰肌（竖脊肌）、竖脊肌腰段、股直肌。',
      '无力肌肉：腹横肌、腹直肌下部、臀大肌、腘绳肌。'
    ],
    pilatesStrategy: [
      '拉伸屈髋肌：重点拉伸髂腰肌和股直肌。',
      '核心与后侧链激活：练习Pelvic Curl（骨盆卷动），重点在于利用腹部力量使骨盆后倾启动，并在顶端收紧臀大肌。',
      '腹部离心控制：在Reformer的Knee Stretch（膝屈伸）系列中，强调腹部收紧保持圆背（Round Back）以对抗弹簧拉力。'
    ],
    precautions: [
      '避免过度的腰椎伸展动作（如Swan），在做伸展时必须强调腹部微收以保护腰椎。'
    ]
  }
];

export const categories = Array.from(new Set(mockCases.map(c => c.category)));
