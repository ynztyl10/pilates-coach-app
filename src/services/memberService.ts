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
import { api } from './api';

export async function listMembers(): Promise<MemberListResult> {
  return api.get<MemberListResult>('/members');
}

export async function createMember(input: MemberCreateInput): Promise<Member> {
  return api.post<Member>('/members', input);
}

export async function getMember(id: string): Promise<Member | null> {
  try {
    return await api.get<Member>(`/members/${id}`);
  } catch (err: any) {
    if (err.code === 'NOT_FOUND') return null;
    throw err;
  }
}

export async function updateMember(
  id: string,
  input: MemberUpdateInput
): Promise<Member> {
  return api.put<Member>(`/members/${id}`, input);
}

export async function deleteMember(id: string): Promise<void> {
  await api.del<void>(`/members/${id}`);
}
