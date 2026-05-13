/**
 * 会员管理服务
 * 对应 OpenAPI Spec: Member CRUD 接口
 */

import {
  Member,
  MemberCreateInput,
  MemberUpdateInput,
  MemberListResult,
} from '../types/member';

const STORAGE_KEY = 'pilates_members';

function generateId(): string {
  return 'mem-' + crypto.randomUUID();
}

function getAllMembers(): Member[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveMembers(members: Member[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function listMembers(): MemberListResult {
  const data = getAllMembers();
  return { data, total: data.length };
}

export function createMember(input: MemberCreateInput): Member {
  const now = new Date().toISOString();
  const member: Member = {
    id: generateId(),
    name: input.name.trim(),
    gender: input.gender,
    age: input.age,
    parous: input.parous ?? false,
    goals: input.goals ?? [],
    focusAreas: input.focusAreas ?? [],
    painPoints: input.painPoints ?? [],
    medicalNotes: input.medicalNotes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const members = getAllMembers();
  members.unshift(member);
  saveMembers(members);
  return member;
}

export function getMember(id: string): Member | null {
  return getAllMembers().find(m => m.id === id) ?? null;
}

export function updateMember(id: string, input: MemberUpdateInput): Member {
  const members = getAllMembers();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) {
    throw new Error('NOT_FOUND');
  }
  const existing = members[idx];
  const updated: Member = {
    ...existing,
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.gender !== undefined && { gender: input.gender }),
    ...(input.age !== undefined && { age: input.age }),
    ...(input.parous !== undefined && { parous: input.parous }),
    ...(input.goals !== undefined && { goals: input.goals }),
    ...(input.focusAreas !== undefined && { focusAreas: input.focusAreas }),
    ...(input.painPoints !== undefined && { painPoints: input.painPoints }),
    ...(input.medicalNotes !== undefined && {
      medicalNotes: input.medicalNotes.trim() || undefined,
    }),
    updatedAt: new Date().toISOString(),
  };
  members[idx] = updated;
  saveMembers(members);
  return updated;
}

export function deleteMember(id: string): void {
  const members = getAllMembers().filter(m => m.id !== id);
  saveMembers(members);
}
