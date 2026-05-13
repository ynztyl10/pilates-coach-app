import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
} from '../memberService';
import { MemberCreateInput } from '../../types/member';
import { mockFetch, jsonResponse } from './setup';

describe('MemberService', () => {
  let restoreFetch: () => void;
  let mockMembers: Map<string, any> = new Map();

  beforeEach(() => {
    mockMembers = new Map();
    restoreFetch = mockFetch({
      '/members': async () => {
        const data = Array.from(mockMembers.values());
        return jsonResponse({ data, total: data.length });
      },
      '/members/': async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        const id = url.split('/members/')[1]?.split('?')[0];
        const member = mockMembers.get(id);
        if (!member) {
          return jsonResponse({ code: 'NOT_FOUND', message: '会员不存在' }, 404);
        }
        return jsonResponse(member);
      },
    });

    // Override fetch to handle POST/PUT/DELETE with dynamic paths
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const path = new URL(url).pathname;
      const method = init?.method || 'GET';

      if (path === '/members' && method === 'POST') {
        const body = JSON.parse(init?.body as string);
        const member = {
          id: 'mem-' + crypto.randomUUID(),
          name: body.name.trim(),
          gender: body.gender,
          age: body.age,
          parous: body.parous ?? false,
          goals: body.goals || [],
          focusAreas: body.focusAreas || [],
          painPoints: body.painPoints || [],
          medicalNotes: body.medicalNotes?.trim() || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockMembers.set(member.id, member);
        return jsonResponse(member, 201);
      }

      if (path.startsWith('/members/') && method === 'PUT') {
        const id = path.split('/members/')[1];
        const existing = mockMembers.get(id);
        if (!existing) {
          return jsonResponse({ code: 'NOT_FOUND', message: '会员不存在' }, 404);
        }
        const body = JSON.parse(init?.body as string);
        const updated = {
          ...existing,
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.gender !== undefined && { gender: body.gender }),
          ...(body.age !== undefined && { age: body.age }),
          ...(body.parous !== undefined && { parous: body.parous }),
          ...(body.goals !== undefined && { goals: body.goals }),
          ...(body.focusAreas !== undefined && { focusAreas: body.focusAreas }),
          ...(body.painPoints !== undefined && { painPoints: body.painPoints }),
          ...(body.medicalNotes !== undefined && {
            medicalNotes: body.medicalNotes.trim() || undefined,
          }),
          updatedAt: new Date().toISOString(),
        };
        mockMembers.set(id, updated);
        return jsonResponse(updated);
      }

      if (path.startsWith('/members/') && method === 'DELETE') {
        const id = path.split('/members/')[1];
        mockMembers.delete(id);
        return new Response(null, { status: 204 });
      }

      if (path === '/members' && method === 'GET') {
        const data = Array.from(mockMembers.values());
        return jsonResponse({ data, total: data.length });
      }

      if (path.startsWith('/members/') && method === 'GET') {
        const id = path.split('/members/')[1];
        const member = mockMembers.get(id);
        if (!member) {
          return jsonResponse({ code: 'NOT_FOUND', message: '会员不存在' }, 404);
        }
        return jsonResponse(member);
      }

      return jsonResponse({ code: 'NOT_FOUND', message: '接口不存在' }, 404);
    }) as any;
  });

  afterEach(() => {
    restoreFetch();
  });

  describe('createMember', () => {
    it('should create a member with required fields', async () => {
      const input: MemberCreateInput = {
        name: '张女士',
        gender: 'female',
      };
      const member = await createMember(input);

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

    it('should create a member with all optional fields', async () => {
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
      const member = await createMember(input);

      expect(member.age).toBe(35);
      expect(member.parous).toBe(false);
      expect(member.goals).toEqual(['core_strength', 'flexibility']);
      expect(member.focusAreas).toEqual(['脊柱', '骨盆']);
      expect(member.painPoints).toEqual(['下腰痛']);
      expect(member.medicalNotes).toBe('腰椎间盘突出L4-L5');
    });

    it('should trim name and medicalNotes', async () => {
      const member = await createMember({
        name: '  王女士  ',
        gender: 'female',
        medicalNotes: '  备注内容  ',
      });
      expect(member.name).toBe('王女士');
      expect(member.medicalNotes).toBe('备注内容');
    });

    it('should store empty medicalNotes as undefined', async () => {
      const member = await createMember({
        name: '测试',
        gender: 'other',
        medicalNotes: '   ',
      });
      expect(member.medicalNotes).toBeUndefined();
    });
  });

  describe('listMembers', () => {
    it('should return empty list when no members', async () => {
      const result = await listMembers();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all members with correct total', async () => {
      await createMember({ name: 'A', gender: 'female' });
      await createMember({ name: 'B', gender: 'male' });
      const result = await listMembers();
      expect(result.total).toBe(2);
    });
  });

  describe('getMember', () => {
    it('should return null for non-existent member', async () => {
      expect(await getMember('non-existent')).toBeNull();
    });

    it('should return the correct member', async () => {
      const member = await createMember({ name: '测试用户', gender: 'female' });
      const found = await getMember(member.id);
      expect(found?.name).toBe('测试用户');
    });
  });

  describe('updateMember', () => {
    it('should throw error for non-existent member', async () => {
      await expect(updateMember('non-existent', { name: '新名字' })).rejects.toThrow();
    });

    it('should update specified fields only', async () => {
      const member = await createMember({
        name: '原名字',
        gender: 'female',
        age: 30,
        goals: ['core_strength'],
      });

      const updated = await updateMember(member.id, { age: 31 });
      expect(updated.age).toBe(31);
      expect(updated.name).toBe('原名字');
      expect(updated.gender).toBe('female');
      expect(updated.goals).toEqual(['core_strength']);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(member.updatedAt).getTime());
    });

    it('should trim updated name and medicalNotes', async () => {
      const member = await createMember({ name: '原', gender: 'female' });
      const updated = await updateMember(member.id, {
        name: '  新名字  ',
        medicalNotes: '  新备注  ',
      });
      expect(updated.name).toBe('新名字');
      expect(updated.medicalNotes).toBe('新备注');
    });

    it('should set empty medicalNotes to undefined', async () => {
      const member = await createMember({
        name: '原',
        gender: 'female',
        medicalNotes: '有备注',
      });
      const updated = await updateMember(member.id, { medicalNotes: '   ' });
      expect(updated.medicalNotes).toBeUndefined();
    });
  });

  describe('deleteMember', () => {
    it('should delete member silently', async () => {
      const member = await createMember({ name: '要删除', gender: 'female' });
      await deleteMember(member.id);
      expect(await getMember(member.id)).toBeNull();
      expect((await listMembers()).total).toBe(0);
    });

    it('should not throw when deleting non-existent member', async () => {
      await expect(deleteMember('non-existent')).resolves.not.toThrow();
    });
  });
});
