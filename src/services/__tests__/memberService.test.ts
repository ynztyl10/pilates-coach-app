import { describe, it, expect, beforeEach } from 'vitest';
import {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
} from '../memberService';
import { MemberCreateInput } from '../../types/member';

describe('MemberService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createMember', () => {
    it('should create a member with required fields', () => {
      const input: MemberCreateInput = {
        name: '张女士',
        gender: 'female',
      };
      const member = createMember(input);

      expect(member.id).toMatch(/^mem-/);
      expect(member.name).toBe('张女士');
      expect(member.gender).toBe('female');
      expect(member.parous).toBe(false);
      expect(member.goals).toEqual([]);
      expect(member.focusAreas).toEqual([]);
      expect(member.painPoints).toEqual([]);
      expect(member.createdAt).toBeDefined();
      expect(member.updatedAt).toBeDefined();
    });

    it('should create a member with all optional fields', () => {
      const input: MemberCreateInput = {
        name: '李先生',
        gender: 'male',
        age: 35,
        parous: false,
        goals: ['core_strength', 'flexibility'],
        focusAreas: ['脊柱', '骨盆'],
        painPoints: ['下腰痛'],
        medicalNotes: '腰椎间盘突出L4-L5',
      };
      const member = createMember(input);

      expect(member.age).toBe(35);
      expect(member.parous).toBe(false);
      expect(member.goals).toEqual(['core_strength', 'flexibility']);
      expect(member.focusAreas).toEqual(['脊柱', '骨盆']);
      expect(member.painPoints).toEqual(['下腰痛']);
      expect(member.medicalNotes).toBe('腰椎间盘突出L4-L5');
    });

    it('should trim name and medicalNotes', () => {
      const member = createMember({
        name: '  王女士  ',
        gender: 'female',
        medicalNotes: '  备注内容  ',
      });
      expect(member.name).toBe('王女士');
      expect(member.medicalNotes).toBe('备注内容');
    });

    it('should store empty medicalNotes as undefined', () => {
      const member = createMember({
        name: '测试',
        gender: 'other',
        medicalNotes: '   ',
      });
      expect(member.medicalNotes).toBeUndefined();
    });
  });

  describe('listMembers', () => {
    it('should return empty list when no members', () => {
      const result = listMembers();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all members with correct total', () => {
      createMember({ name: 'A', gender: 'female' });
      createMember({ name: 'B', gender: 'male' });
      const result = listMembers();
      expect(result.total).toBe(2);
      expect(result.data[0].name).toBe('B'); // 新创建的在前面
      expect(result.data[1].name).toBe('A');
    });
  });

  describe('getMember', () => {
    it('should return null for non-existent member', () => {
      expect(getMember('non-existent')).toBeNull();
    });

    it('should return the correct member', () => {
      const member = createMember({ name: '测试用户', gender: 'female' });
      const found = getMember(member.id);
      expect(found?.name).toBe('测试用户');
    });
  });

  describe('updateMember', () => {
    it('should throw error for non-existent member', () => {
      expect(() => updateMember('non-existent', { name: '新名字' })).toThrow('NOT_FOUND');
    });

    it('should update specified fields only', () => {
      const member = createMember({
        name: '原名字',
        gender: 'female',
        age: 30,
        goals: ['core_strength'],
      });

      const updated = updateMember(member.id, { age: 31 });
      expect(updated.age).toBe(31);
      expect(updated.name).toBe('原名字');
      expect(updated.gender).toBe('female');
      expect(updated.goals).toEqual(['core_strength']);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(member.updatedAt).getTime());
    });

    it('should trim updated name and medicalNotes', () => {
      const member = createMember({ name: '原', gender: 'female' });
      const updated = updateMember(member.id, {
        name: '  新名字  ',
        medicalNotes: '  新备注  ',
      });
      expect(updated.name).toBe('新名字');
      expect(updated.medicalNotes).toBe('新备注');
    });

    it('should set empty medicalNotes to undefined', () => {
      const member = createMember({
        name: '原',
        gender: 'female',
        medicalNotes: '有备注',
      });
      const updated = updateMember(member.id, { medicalNotes: '   ' });
      expect(updated.medicalNotes).toBeUndefined();
    });
  });

  describe('deleteMember', () => {
    it('should delete member silently', () => {
      const member = createMember({ name: '要删除', gender: 'female' });
      deleteMember(member.id);
      expect(getMember(member.id)).toBeNull();
      expect(listMembers().total).toBe(0);
    });

    it('should not throw when deleting non-existent member', () => {
      expect(() => deleteMember('non-existent')).not.toThrow();
    });
  });
});
