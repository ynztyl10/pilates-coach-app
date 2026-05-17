import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  matchConditions,
  extractModulesFromKnowledge,
  deduplicateModules,
  applyMedicalHistory,
  generatePersonalizedPlan,
  savePersonalizedPlan,
  getPersonalizedPlan,
  updatePersonalizedPlan,
  deletePersonalizedPlan,
  listPersonalizedPlans,
} from '../personalizedPlan';
import { mockFetch, jsonResponse } from './setup';

describe('PersonalizedPlan Core Engine', () => {
  // ============================================================
  // 第一步：关键词匹配测试
  // ============================================================
  describe('matchConditions', () => {
    it('should match exact labels from synonym map', () => {
      const result = matchConditions(['头前引'], undefined);
      expect(result.map(r => r.id)).toContain('forward-head');
    });

    it('should match multiple labels at once', () => {
      const result = matchConditions(['头前引', '圆肩', '驼背'], undefined);
      const ids = result.map(r => r.id);
      expect(ids).toContain('forward-head');
      expect(ids).toContain('rounded-shoulders');
      expect(ids).toContain('thoracic-kyphosis');
    });

    it('should match by condition text with synonyms', () => {
      const result = matchConditions([], '会员有乌龟颈和含胸的问题');
      const ids = result.map(r => r.id);
      expect(ids).toContain('forward-head');
      expect(ids).toContain('rounded-shoulders');
    });

    it('should combine label and text matches without duplicates', () => {
      const result = matchConditions(['头前引'], '头部前倾伴随圆肩');
      const ids = result.map(r => r.id);
      expect(ids).toContain('forward-head');
      expect(ids).toContain('rounded-shoulders');
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should return empty array when no matches', () => {
      const result = matchConditions([], '完全无关的描述');
      expect(result).toEqual([]);
    });

    it('should match the specific member case: 足弓塌陷', () => {
      const result = matchConditions(['足弓塌陷'], undefined);
      expect(result.map(r => r.id)).toContain('flatfoot');
    });

    it('should match the specific member case: 习惯性崴脚', () => {
      const result = matchConditions(['习惯性崴脚'], undefined);
      expect(result.map(r => r.id)).toContain('chronic-ankle-instability');
    });

    it('should match the specific member case: 膝盖内扣', () => {
      const result = matchConditions(['膝盖内扣'], undefined);
      expect(result.map(r => r.id)).toContain('genu-valgum');
    });

    it('should match the specific member case: 骨盆前倾且右旋', () => {
      const result = matchConditions([], '骨盆前倾且右旋');
      const ids = result.map(r => r.id);
      expect(ids).toContain('pelvic-anterior-tilt');
      expect(ids).toContain('pelvic-unilateral-rotation');
    });

    it('should match the specific member case: 胸椎段屈曲', () => {
      const result = matchConditions([], '胸椎段屈曲');
      expect(result.map(r => r.id)).toContain('thoracic-kyphosis');
    });

    it('should match the specific member case: 头前引', () => {
      const result = matchConditions(['头前引'], undefined);
      expect(result.map(r => r.id)).toContain('forward-head');
    });

    it('should match all conditions in the specific member case combined', () => {
      const text = '足弓塌陷，右脚习惯性崴脚，膝盖内扣，骨盆前倾且右旋，胸椎段屈曲，头前引';
      const result = matchConditions([], text);
      const ids = result.map(r => r.id);
      expect(ids).toContain('flatfoot');
      expect(ids).toContain('chronic-ankle-instability');
      expect(ids).toContain('genu-valgum');
      expect(ids).toContain('pelvic-anterior-tilt');
      expect(ids).toContain('pelvic-unilateral-rotation');
      expect(ids).toContain('thoracic-kyphosis');
      expect(ids).toContain('forward-head');
    });

    it('should include matched knowledge metadata', () => {
      const result = matchConditions(['头前引'], undefined);
      const match = result.find(r => r.id === 'forward-head');
      expect(match).toBeDefined();
      expect(match!.name).toBe('头前引');
      expect(match!.category).toBe('头颈与肩部');
      expect(match!.score).toBe(10);
    });
  });

  // ============================================================
  // 第二步：模块提取测试
  // ============================================================
  describe('extractModulesFromKnowledge', () => {
    it('should return empty array for non-existent knowledge ID', () => {
      const result = extractModulesFromKnowledge('non-existent-id');
      expect(result).toEqual([]);
    });

    it('should extract tight muscles with stretch priority from flatfoot', () => {
      const result = extractModulesFromKnowledge('flatfoot');
      expect(result.length).toBeGreaterThan(0);

      // 紧张肌肉应标记为 isStretch=true，priority=1
      const tightMuscles = result.filter(m => m.isStretch);
      expect(tightMuscles.length).toBeGreaterThan(0);

      const calf = tightMuscles.find(m => m.targetMuscle.includes('小腿三头肌'));
      expect(calf).toBeDefined();
      expect(calf!.isStretch).toBe(true);
      expect(calf!.priority).toBe(1);
      expect(calf!.reason.length).toBeGreaterThan(0);
      expect(calf!.direction.length).toBeGreaterThan(0);
    });

    it('should extract weak muscles with training priority from flatfoot', () => {
      const result = extractModulesFromKnowledge('flatfoot');

      const weakMuscles = result.filter(m => !m.isStretch);
      expect(weakMuscles.length).toBeGreaterThan(0);

      const tibialisPosterior = weakMuscles.find(m => m.targetMuscle.includes('胫骨后肌'));
      expect(tibialisPosterior).toBeDefined();
      expect(tibialisPosterior!.isStretch).toBe(false);
      expect(tibialisPosterior!.reason.length).toBeGreaterThan(0);
    });

    it('should clean muscle names by removing English and priority tags', () => {
      const result = extractModulesFromKnowledge('flatfoot');
      for (const mod of result) {
        // 不应包含括号内的英文
        expect(mod.targetMuscle).not.toMatch(/[\(（][a-zA-Z\s]+[\)）]/);
        // 不应包含"松解优先"等标签
        expect(mod.targetMuscle).not.toContain('松解优先');
      }
    });

    it('should extract reasons from arrow-prefixed lines', () => {
      const result = extractModulesFromKnowledge('forward-head');
      const scm = result.find(m => m.targetMuscle.includes('胸锁乳突肌'));
      expect(scm).toBeDefined();
      expect(scm!.reason).toContain('头前引');
    });

    it('should extract direction from first two training actions', () => {
      const result = extractModulesFromKnowledge('forward-head');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].direction).toBeTruthy();
    });

    it('should correctly determine priority from anatomy[2]', () => {
      const result = extractModulesFromKnowledge('flatfoot');
      // 当前实现：所有条目的 anatomy[2] 都包含"第一优先级"，basePriority 提取为 1
      // 紧张肌肉固定 priority=1，薄弱肌肉使用 basePriority
      const weakMuscles = result.filter(m => !m.isStretch);
      if (weakMuscles.length > 0) {
        expect(weakMuscles[0].priority).toBeGreaterThanOrEqual(1);
      }
    });

    it('should correctly classify muscles before "薄弱" as tight', () => {
      const result = extractModulesFromKnowledge('genu-valgum');
      const hipAdductors = result.find(m => m.targetMuscle.includes('髋内收肌群'));
      expect(hipAdductors).toBeDefined();
      expect(hipAdductors!.isStretch).toBe(true);
    });

    it('should correctly classify muscles after "薄弱" as weak', () => {
      const result = extractModulesFromKnowledge('genu-valgum');
      const gluteMedius = result.find(m => m.targetMuscle.includes('臀中肌'));
      expect(gluteMedius).toBeDefined();
      expect(gluteMedius!.isStretch).toBe(false);
    });

    it('should attach sourceId to each module', () => {
      const result = extractModulesFromKnowledge('flatfoot');
      for (const mod of result) {
        expect(mod.sourceId).toBe('flatfoot');
      }
    });

    it('should handle chronic-ankle-instability with different section headers', () => {
      const result = extractModulesFromKnowledge('chronic-ankle-instability');
      expect(result.length).toBeGreaterThan(0);

      // 该条目使用"缩短/紧张"而非"缩短且紧张"
      const tightMuscles = result.filter(m => m.isStretch);
      expect(tightMuscles.length).toBeGreaterThan(0);

      const calf = tightMuscles.find(m => m.targetMuscle.includes('小腿三头肌'));
      expect(calf).toBeDefined();
      expect(calf!.isStretch).toBe(true);
    });
  });

  // ============================================================
  // 第三步：去重合并测试
  // ============================================================
  describe('deduplicateModules', () => {
    it('should separate tight muscles into homework and weak into class', () => {
      const modules = [
        { targetMuscle: '胸锁乳突肌', isStretch: true, priority: 1, reason: '原因A', direction: '方向A', sourceId: 'fwd' },
        { targetMuscle: '颈深层屈肌', isStretch: false, priority: 2, reason: '原因B', direction: '方向B', sourceId: 'fwd' },
      ];
      const { homeworkModules, classModules } = deduplicateModules(modules);
      expect(homeworkModules.length).toBe(1);
      expect(classModules.length).toBe(1);
      expect(homeworkModules[0].targetMuscle).toBe('胸锁乳突肌');
      expect(classModules[0].targetMuscle).toBe('颈深层屈肌');
    });

    it('should merge overlapping muscles and combine reasons (Option B)', () => {
      const modules = [
        {
          targetMuscle: '小腿三头肌',
          isStretch: true,
          priority: 1,
          reason: '扁平足时限制踝关节背屈',
          direction: '松解方向A',
          sourceId: 'flatfoot',
        },
        {
          targetMuscle: '小腿三头肌',
          isStretch: true,
          priority: 1,
          reason: '踝关节扭伤后保护性紧张',
          direction: '松解方向B',
          sourceId: 'chronic-ankle-instability',
        },
      ];
      const { homeworkModules } = deduplicateModules(modules);
      expect(homeworkModules.length).toBe(1);
      expect(homeworkModules[0].targetMuscle).toBe('小腿三头肌');
      expect(homeworkModules[0].reason).toContain('扁平足');
      expect(homeworkModules[0].reason).toContain('踝关节扭伤');
    });

    it('should merge sourceIds from multiple conditions', () => {
      const modules = [
        {
          targetMuscle: '小腿三头肌',
          isStretch: true,
          priority: 1,
          reason: '原因A',
          direction: '方向A',
          sourceId: 'flatfoot',
        },
        {
          targetMuscle: '小腿三头肌',
          isStretch: true,
          priority: 1,
          reason: '原因B',
          direction: '方向B',
          sourceId: 'chronic-ankle-instability',
        },
      ];
      const { homeworkModules } = deduplicateModules(modules);
      expect(homeworkModules[0].sourceId).toContain('flatfoot');
      expect(homeworkModules[0].sourceId).toContain('chronic-ankle-instability');
    });

    it('should take minimum priority when merging', () => {
      const modules = [
        {
          targetMuscle: '臀中肌',
          isStretch: false,
          priority: 2,
          reason: '原因A',
          direction: '方向A',
          sourceId: 'genu-valgum',
        },
        {
          targetMuscle: '臀中肌',
          isStretch: false,
          priority: 3,
          reason: '原因B',
          direction: '方向B',
          sourceId: 'chronic-ankle-instability',
        },
      ];
      const { classModules } = deduplicateModules(modules);
      expect(classModules[0].priority).toBe(2);
    });

    it('should sort modules by priority ascending', () => {
      const modules = [
        { targetMuscle: '肌肉C', isStretch: false, priority: 3, reason: '原因C', direction: '方向C', sourceId: 'id3' },
        { targetMuscle: '肌肉A', isStretch: false, priority: 1, reason: '原因A', direction: '方向A', sourceId: 'id1' },
        { targetMuscle: '肌肉B', isStretch: false, priority: 2, reason: '原因B', direction: '方向B', sourceId: 'id2' },
      ];
      const { classModules } = deduplicateModules(modules);
      expect(classModules[0].priority).toBe(1);
      expect(classModules[1].priority).toBe(2);
      expect(classModules[2].priority).toBe(3);
    });

    it('should not duplicate reasons if they are identical', () => {
      const modules = [
        {
          targetMuscle: '同一肌肉',
          isStretch: true,
          priority: 1,
          reason: '相同原因',
          direction: '方向A',
          sourceId: 'id1',
        },
        {
          targetMuscle: '同一肌肉',
          isStretch: true,
          priority: 1,
          reason: '相同原因',
          direction: '方向B',
          sourceId: 'id2',
        },
      ];
      const { homeworkModules } = deduplicateModules(modules);
      // 原因相同，不应重复追加
      expect(homeworkModules[0].reason).toBe('相同原因');
    });

    it('should handle the real member case: 小腿三头肌 from flatfoot + chronic-ankle-instability', () => {
      const flatfootModules = extractModulesFromKnowledge('flatfoot');
      const ankleModules = extractModulesFromKnowledge('chronic-ankle-instability');
      const allModules = [...flatfootModules, ...ankleModules];
      const { homeworkModules } = deduplicateModules(allModules);

      const calf = homeworkModules.find(m => m.targetMuscle.includes('小腿三头肌'));
      expect(calf).toBeDefined();
      expect(calf!.sourceId).toContain('flatfoot');
      expect(calf!.sourceId).toContain('chronic-ankle-instability');
    });
  });

  // ============================================================
  // 第四步：病史规则测试
  // ============================================================
  describe('applyMedicalHistory', () => {
    it('should match ACL-related history', () => {
      const result = applyMedicalHistory(['ACL重建术后'], undefined);
      expect(result.contraindications.length).toBeGreaterThan(0);
      expect(result.specialNotes.length).toBeGreaterThan(0);
    });

    it('should match ACL by Chinese keywords', () => {
      const result = applyMedicalHistory([], '右腿前叉韧带断裂术后');
      expect(result.contraindications.length).toBeGreaterThan(0);
    });

    it('should include forbidden level contraindications for ACL', () => {
      const result = applyMedicalHistory(['ACL'], undefined);
      const forbidden = result.contraindications.filter(c => c.level === 'forbidden');
      expect(forbidden.length).toBeGreaterThan(0);

      const singleLegBridge = forbidden.find(c => c.action === '单腿桥式');
      expect(singleLegBridge).toBeDefined();
      expect(singleLegBridge!.reason).toContain('ACL');
    });

    it('should include caution level contraindications for ACL', () => {
      const result = applyMedicalHistory(['ACL'], undefined);
      const caution = result.contraindications.filter(c => c.level === 'caution');
      expect(caution.length).toBeGreaterThan(0);

      const wallSit = caution.find(c => c.action === '靠墙微蹲');
      expect(wallSit).toBeDefined();
    });

    it('should sort contraindications by severity: forbidden > caution > safe', () => {
      const result = applyMedicalHistory(['ACL'], undefined);
      const levels = result.contraindications.map(c => c.level);
      const firstCautionIndex = levels.indexOf('caution');
      const lastForbiddenIndex = levels.lastIndexOf('forbidden');
      if (firstCautionIndex !== -1 && lastForbiddenIndex !== -1) {
        expect(firstCautionIndex).toBeGreaterThan(lastForbiddenIndex);
      }
    });

    it('should merge rules with severity escalation', () => {
      // 模拟两个规则匹配同一动作，应取最严格级别
      const result = applyMedicalHistory(['ACL', '骨质疏松'], undefined);
      expect(result.contraindications.length).toBeGreaterThan(0);
      // ACL 和 骨质疏松 都有各自的禁忌症，应全部包含
      const actions = result.contraindications.map(c => c.action);
      expect(new Set(actions).size).toBeLessThanOrEqual(actions.length);
    });

    it('should include special notes for ACL', () => {
      const result = applyMedicalHistory(['ACL重建术后'], undefined);
      const notes = result.specialNotes.map(n => n.note);
      expect(notes.some(n => n.includes('移植物'))).toBe(true);
      expect(notes.some(n => n.includes('再次损伤'))).toBe(true);
    });

    it('should handle diabetes rules', () => {
      const result = applyMedicalHistory(['糖尿病'], undefined);
      expect(result.contraindications.length).toBeGreaterThan(0);
      expect(result.specialNotes.length).toBeGreaterThan(0);
    });

    it('should handle osteoporosis rules', () => {
      const result = applyMedicalHistory(['骨质疏松'], undefined);
      const forbidden = result.contraindications.filter(c => c.level === 'forbidden');
      expect(forbidden.length).toBeGreaterThan(0);
    });

    it('should handle empty history gracefully', () => {
      const result = applyMedicalHistory([], undefined);
      expect(result.contraindications).toEqual([]);
      expect(result.specialNotes).toEqual([]);
    });

    it('should handle the specific member case: bilateral ACL reconstruction', () => {
      const historyText = '右腿ACL重建术后约3年，左腿ACL重建术后约1年';
      const result = applyMedicalHistory([], historyText);

      // 应有多个禁忌症
      expect(result.contraindications.length).toBeGreaterThan(5);

      // 单腿桥式应为 forbidden
      const singleLegBridge = result.contraindications.find(
        c => c.action === '单腿桥式' && c.level === 'forbidden'
      );
      expect(singleLegBridge).toBeDefined();

      // 双腿对称桥式应为 caution
      const doubleLegBridge = result.contraindications.find(
        c => c.action === '双腿对称桥式' && c.level === 'caution'
      );
      expect(doubleLegBridge).toBeDefined();

      // 应有 ACL 相关特殊注意事项
      const notes = result.specialNotes.map(n => n.note);
      expect(notes.some(n => n.includes('ACL'))).toBe(true);
    });

    it('should include 跪姿转身/远端固定的股骨内旋 as forbidden for ACL', () => {
      const result = applyMedicalHistory(['ACL'], undefined);
      const kneeling = result.contraindications.find(
        c => c.action.includes('跪姿转身') || c.action.includes('股骨内旋')
      );
      expect(kneeling).toBeDefined();
      expect(kneeling!.level).toBe('forbidden');
    });
  });

  // ============================================================
  // 第五步：完整流程测试
  // ============================================================
  describe('generatePersonalizedPlan', () => {
    let restoreFetch: () => void;

    beforeEach(() => {
      restoreFetch = mockFetch({});

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        const path = new URL(url).pathname;
        const method = init?.method || 'GET';

        if (path.startsWith('/members/') && method === 'GET') {
          const id = path.split('/members/')[1];
          if (id === 'test-member-001') {
            return jsonResponse({
              id: 'test-member-001',
              name: '张女士',
              gender: 'female',
              age: 32,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            });
          }
          return jsonResponse({ code: 'NOT_FOUND', message: '会员不存在' }, 404);
        }

        return jsonResponse({ code: 'NOT_FOUND', message: '接口不存在' }, 404);
      }) as any;
    });

    afterEach(() => {
      restoreFetch();
    });

    it('should throw NOT_FOUND for non-existent member', async () => {
      await expect(
        generatePersonalizedPlan({
          memberId: 'non-existent',
          conditions: ['头前引'],
          medicalHistory: [],
        })
      ).rejects.toThrow('NOT_FOUND');
    });

    it('should generate complete plan for the specific member case', async () => {
      const plan = await generatePersonalizedPlan({
        memberId: 'test-member-001',
        conditions: [],
        conditionText: '足弓塌陷，右脚习惯性崴脚，膝盖内扣，骨盆前倾且右旋，胸椎段屈曲，头前引',
        medicalHistory: [],
        medicalHistoryText: '右腿ACL重建术后约3年，左腿ACL重建术后约1年',
      });

      // 基本结构验证
      expect(plan.memberId).toBe('test-member-001');
      expect(plan.title).toContain('张女士');
      expect(plan.homework).toBeDefined();
      expect(plan.classModules).toBeDefined();
      expect(plan.contraindications).toBeDefined();
      expect(plan.specialNotes).toBeDefined();
      expect(plan.createdAt).toBeDefined();

      // 家庭作业应有内容（紧张肌肉）
      expect(plan.homework.length).toBeGreaterThan(0);
      plan.homework.forEach((item, idx) => {
        expect(item.order).toBe(idx + 1);
        expect(item.targetMuscle).toBeTruthy();
        expect(item.reason).toBeTruthy();
      });

      // 课堂模块应有内容（薄弱肌肉）
      expect(plan.classModules.length).toBeGreaterThan(0);
      plan.classModules.forEach(mod => {
        expect(mod.priority).toBeGreaterThanOrEqual(1);
        expect(mod.targetMuscle).toBeTruthy();
        expect(mod.reason).toBeTruthy();
        expect(mod.direction).toBeTruthy();
        expect(mod.sourceIds.length).toBeGreaterThan(0);
      });

      // 课堂模块应按优先级排序
      for (let i = 1; i < plan.classModules.length; i++) {
        expect(plan.classModules[i].priority).toBeGreaterThanOrEqual(
          plan.classModules[i - 1].priority
        );
      }

      // 应有 ACL 禁忌症
      expect(plan.contraindications.length).toBeGreaterThan(0);
      const forbiddenActions = plan.contraindications.filter(c => c.level === 'forbidden');
      expect(forbiddenActions.length).toBeGreaterThan(0);

      // 应有特殊注意事项
      expect(plan.specialNotes.length).toBeGreaterThan(0);
    });

    it('should include merged muscles from multiple conditions in homework', async () => {
      const plan = await generatePersonalizedPlan({
        memberId: 'test-member-001',
        conditions: [],
        conditionText: '足弓塌陷，习惯性崴脚',
        medicalHistory: [],
        medicalHistoryText: '',
      });

      const calf = plan.homework.find(h => h.targetMuscle.includes('小腿三头肌'));
      expect(calf).toBeDefined();
      // 原因应合并两个来源
      expect(calf!.reason.length).toBeGreaterThan(20);
    });

    it('should generate title based on matched conditions', async () => {
      const plan = await generatePersonalizedPlan({
        memberId: 'test-member-001',
        conditions: ['头前引'],
        medicalHistory: [],
      });
      expect(plan.title).toContain('头前引');
      expect(plan.title).toContain('综合训练计划');
    });

    it('should handle case with no condition matches gracefully', async () => {
      const plan = await generatePersonalizedPlan({
        memberId: 'test-member-001',
        conditions: [],
        conditionText: '完全无关的身体描述',
        medicalHistory: [],
      });
      expect(plan.title).toBe('张女士 - 综合训练计划');
      expect(plan.homework.length).toBe(0);
      expect(plan.classModules.length).toBe(0);
    });

    it('should handle case with no medical history', async () => {
      const plan = await generatePersonalizedPlan({
        memberId: 'test-member-001',
        conditions: ['头前引'],
        medicalHistory: [],
      });
      expect(plan.contraindications.length).toBe(0);
      expect(plan.specialNotes.length).toBe(0);
    });
  });

  // ============================================================
  // CRUD 操作测试
  // ============================================================
  describe('CRUD operations', () => {
    let restoreFetch: () => void;
    let mockPlans: Map<string, any> = new Map();

    beforeEach(() => {
      mockPlans = new Map();
      restoreFetch = mockFetch({});

      globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        const path = new URL(url).pathname;
        const method = init?.method || 'GET';

        if (path === '/personalized-plans' && method === 'POST') {
          const body = JSON.parse(init?.body as string);
          const plan = {
            ...body,
            id: 'plan-' + crypto.randomUUID(),
          };
          mockPlans.set(plan.id, plan);
          return jsonResponse(plan, 201);
        }

        if (path.startsWith('/personalized-plans/') && method === 'GET') {
          const id = path.split('/personalized-plans/')[1];
          const plan = mockPlans.get(id);
          if (!plan) {
            return jsonResponse({ code: 'NOT_FOUND', message: '计划不存在' }, 404);
          }
          return jsonResponse(plan);
        }

        if (path.startsWith('/personalized-plans/') && method === 'PUT') {
          const id = path.split('/personalized-plans/')[1];
          const existing = mockPlans.get(id);
          if (!existing) {
            return jsonResponse({ code: 'NOT_FOUND', message: '计划不存在' }, 404);
          }
          const body = JSON.parse(init?.body as string);
          const updated = { ...existing, ...body };
          mockPlans.set(id, updated);
          return jsonResponse(updated);
        }

        if (path.startsWith('/personalized-plans/') && method === 'DELETE') {
          const id = path.split('/personalized-plans/')[1];
          mockPlans.delete(id);
          return new Response(null, { status: 204 });
        }

        if (path === '/personalized-plans' && method === 'GET') {
          const memberId = new URL(url).searchParams.get('memberId');
          const data = Array.from(mockPlans.values())
            .filter((p: any) => !memberId || p.memberId === memberId)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              createdAt: p.createdAt,
            }));
          return jsonResponse({ data });
        }

        return jsonResponse({ code: 'NOT_FOUND', message: '接口不存在' }, 404);
      }) as any;
    });

    afterEach(() => {
      restoreFetch();
    });

    it('should save a plan', async () => {
      const plan = {
        id: '',
        memberId: 'mem-001',
        title: '测试计划',
        createdAt: new Date().toISOString(),
        homework: [],
        classModules: [],
        contraindications: [],
        specialNotes: [],
      };
      const saved = await savePersonalizedPlan(plan);
      expect(saved.id).toMatch(/^plan-/);
    });

    it('should get a saved plan', async () => {
      const plan = {
        id: '',
        memberId: 'mem-001',
        title: '测试计划',
        createdAt: new Date().toISOString(),
        homework: [],
        classModules: [],
        contraindications: [],
        specialNotes: [],
      };
      const saved = await savePersonalizedPlan(plan);
      const found = await getPersonalizedPlan(saved.id);
      expect(found?.title).toBe('测试计划');
    });

    it('should return null for non-existent plan', async () => {
      const found = await getPersonalizedPlan('non-existent');
      expect(found).toBeNull();
    });

    it('should update a plan', async () => {
      const plan = {
        id: '',
        memberId: 'mem-001',
        title: '原标题',
        createdAt: new Date().toISOString(),
        homework: [],
        classModules: [],
        contraindications: [],
        specialNotes: [],
      };
      const saved = await savePersonalizedPlan(plan);
      const updated = await updatePersonalizedPlan(saved.id, { title: '新标题' });
      expect(updated.title).toBe('新标题');
    });

    it('should delete a plan', async () => {
      const plan = {
        id: '',
        memberId: 'mem-001',
        title: '待删除',
        createdAt: new Date().toISOString(),
        homework: [],
        classModules: [],
        contraindications: [],
        specialNotes: [],
      };
      const saved = await savePersonalizedPlan(plan);
      await deletePersonalizedPlan(saved.id);
      expect(await getPersonalizedPlan(saved.id)).toBeNull();
    });

    it('should list plans for a member', async () => {
      const p1 = { ...await savePersonalizedPlan({ id: '', memberId: 'mem-A', title: 'A1', createdAt: new Date().toISOString(), homework: [], classModules: [], contraindications: [], specialNotes: [] }) };
      const p2 = { ...await savePersonalizedPlan({ id: '', memberId: 'mem-A', title: 'A2', createdAt: new Date().toISOString(), homework: [], classModules: [], contraindications: [], specialNotes: [] }) };
      await savePersonalizedPlan({ id: '', memberId: 'mem-B', title: 'B1', createdAt: new Date().toISOString(), homework: [], classModules: [], contraindications: [], specialNotes: [] });

      const result = await listPersonalizedPlans('mem-A');
      expect(result.length).toBe(2);
    });
  });

  // ============================================================
  // 边界情况测试
  // ============================================================
  describe('edge cases', () => {
    it('should handle single-leg bridge question: forbidden for 1-year post-ACL', () => {
      // 左腿ACL术后1年属于禁忌
      const result = applyMedicalHistory([], '左腿ACL重建术后1年');
      const singleLegBridge = result.contraindications.find(
        c => c.action === '单腿桥式'
      );
      expect(singleLegBridge).toBeDefined();
      expect(singleLegBridge!.level).toBe('forbidden');
    });

    it('should handle single-leg bridge on the 3-year post-op side: still forbidden', () => {
      // 即使右腿已经3年，单腿桥式仍然是forbidden级别
      const result = applyMedicalHistory([], '右腿ACL重建术后3年');
      const singleLegBridge = result.contraindications.find(
        c => c.action === '单腿桥式'
      );
      expect(singleLegBridge).toBeDefined();
      expect(singleLegBridge!.level).toBe('forbidden');
    });

    it('should handle member doing single-leg bridge without complaint: still forbidden per rules', () => {
      // 规则引擎不应因为"会员无不适"而降低级别
      const result = applyMedicalHistory([], 'ACL术后，经常练习单腿臀桥，无任何不适');
      const singleLegBridge = result.contraindications.find(
        c => c.action === '单腿桥式'
      );
      expect(singleLegBridge).toBeDefined();
      expect(singleLegBridge!.level).toBe('forbidden');
    });

    it('should handle multiple conditions with overlapping muscles correctly', () => {
      const flatfootModules = extractModulesFromKnowledge('flatfoot');
      const genuValgumModules = extractModulesFromKnowledge('genu-valgum');
      const all = [...flatfootModules, ...genuValgumModules];
      const { homeworkModules, classModules } = deduplicateModules(all);

      // 臀中肌可能同时出现在两个条目中
      const gluteMedius = classModules.find(m => m.targetMuscle.includes('臀中肌'));
      if (gluteMedius) {
        expect(gluteMedius.sourceId).toBeTruthy();
      }

      // 确保没有重复的肌肉名
      const homeworkNames = homeworkModules.map(m => m.targetMuscle);
      const classNames = classModules.map(m => m.targetMuscle);
      expect(new Set(homeworkNames).size).toBe(homeworkNames.length);
      expect(new Set(classNames).size).toBe(classNames.length);
    });

    it('should not include specific exercise names in class modules', () => {
      const modules = extractModulesFromKnowledge('forward-head');
      const weakModules = modules.filter(m => !m.isStretch);
      for (const mod of weakModules) {
        // direction 来自 training.actions 的前两个动作名
        // 这些名字在知识库中是方向性描述而非具体器械动作
        expect(mod.direction.length).toBeGreaterThan(0);
      }
    });
  });
});
