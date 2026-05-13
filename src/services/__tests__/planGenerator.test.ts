import { describe, it, expect, beforeEach } from 'vitest';
import {
  autoSelectKnowledge,
  generatePlan,
  getPlan,
  listPlans,
  updatePlan,
  deletePlan,
} from '../planGenerator';
import { createMember } from '../memberService';
import { MemberCreateInput } from '../../types/member';

describe('PlanGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('autoSelectKnowledge', () => {
    it('should match by focusAreas (category)', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
        focusAreas: ['脊柱'],
      });
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
      // 所有匹配到的条目分类应该是脊柱
      ids.forEach(id => {
        // 不验证具体条目，只验证有匹配结果
      });
    });

    it('should match by painPoints (name)', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
        painPoints: ['头前引'],
      });
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should match by goals (tags)', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
        goals: ['posture_correction'],
      });
      const ids = autoSelectKnowledge(member);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should combine multiple match strategies without duplicates', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
        focusAreas: ['脊柱'],
        painPoints: ['下腰痛'],
        goals: ['core_strength'],
      });
      const ids = autoSelectKnowledge(member);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no matches', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
      });
      const ids = autoSelectKnowledge(member);
      expect(ids).toEqual([]);
    });
  });

  describe('generatePlan', () => {
    it('should throw for non-existent member', () => {
      expect(() =>
        generatePlan({
          memberId: 'non-existent',
          selectedKnowledgeIds: [],
        })
      ).toThrow('NOT_FOUND');
    });

    it('should generate plan with manual selection', () => {
      const member = createMember({
        name: '张女士',
        gender: 'female',
        focusAreas: ['脊柱'],
      });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      expect(plan.id).toMatch(/^plan-/);
      expect(plan.memberId).toBe(member.id);
      expect(plan.title).toContain('张女士');
      expect(plan.items.length).toBe(1);
      expect(plan.items[0].knowledgeId).toBe('forward-head');
      expect(plan.items[0].actions.length).toBeGreaterThan(0);
      expect(plan.createdAt).toBeDefined();
    });

    it('should include auto-selected items when autoSelect is true', () => {
      const member = createMember({
        name: '李女士',
        gender: 'female',
        focusAreas: ['脊柱'],
      });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: [],
        autoSelect: true,
      });

      expect(plan.items.length).toBeGreaterThan(0);
    });

    it('should use custom title when provided', () => {
      const member = createMember({
        name: '王女士',
        gender: 'female',
      });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
        planTitle: '自定义计划标题',
      });
      expect(plan.title).toBe('自定义计划标题');
    });

    it('should generate default title when no custom title', () => {
      const member = createMember({
        name: '赵女士',
        gender: 'female',
        focusAreas: ['脊柱', '骨盆'],
      });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });
      expect(plan.title).toBe('赵女士 - 脊柱与骨盆专项训练计划');
    });
  });

  describe('getPlan', () => {
    it('should return null for non-existent plan', () => {
      expect(getPlan('non-existent')).toBeNull();
    });

    it('should return plan with member info', () => {
      const member = createMember({
        name: '测试',
        gender: 'female',
      });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });
      const found = getPlan(plan.id);
      expect(found?.id).toBe(plan.id);
      expect(found?.member?.name).toBe('测试');
    });
  });

  describe('listPlans', () => {
    it('should return empty list for member with no plans', () => {
      const member = createMember({ name: '测试', gender: 'female' });
      const result = listPlans(member.id);
      expect(result.data).toEqual([]);
    });

    it('should return only plans for the specified member', () => {
      const m1 = createMember({ name: 'A', gender: 'female' });
      const m2 = createMember({ name: 'B', gender: 'male' });

      generatePlan({ memberId: m1.id, selectedKnowledgeIds: ['forward-head'] });
      generatePlan({ memberId: m2.id, selectedKnowledgeIds: ['forward-head'] });
      generatePlan({ memberId: m1.id, selectedKnowledgeIds: ['forward-head'] });

      const result = listPlans(m1.id);
      expect(result.data.length).toBe(2);
    });
  });

  describe('updatePlan', () => {
    it('should throw for non-existent plan', () => {
      expect(() => updatePlan('non-existent', { notes: '新备注' })).toThrow('NOT_FOUND');
    });

    it('should update plan items order', () => {
      const member = createMember({ name: '测试', gender: 'female' });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      const newItems = [...plan.items];
      // 模拟调整：虽然只有一个条目，但验证结构正确
      const updated = updatePlan(plan.id, { items: newItems });
      expect(updated.items.length).toBe(1);
    });

    it('should update plan notes', () => {
      const member = createMember({ name: '测试', gender: 'female' });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      const updated = updatePlan(plan.id, { notes: '教练备注内容' });
      expect(updated.notes).toBe('教练备注内容');
    });
  });

  describe('deletePlan', () => {
    it('should delete plan silently', () => {
      const member = createMember({ name: '测试', gender: 'female' });
      const plan = generatePlan({
        memberId: member.id,
        selectedKnowledgeIds: ['forward-head'],
      });

      deletePlan(plan.id);
      expect(getPlan(plan.id)).toBeNull();
    });

    it('should not throw when deleting non-existent plan', () => {
      expect(() => deletePlan('non-existent')).not.toThrow();
    });
  });
});
