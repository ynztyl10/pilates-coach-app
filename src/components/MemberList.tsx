import { useEffect, useState } from 'react';
import { Member } from '../types/member';
import { listMembers, deleteMember } from '../services/memberService';
import { TRAINING_GOAL_LABELS } from '../types/member';

interface MemberListProps {
  onSelectMember: (member: Member) => void;
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  refreshFlag?: number;
}

export default function MemberList({ onSelectMember, onAddMember, onEditMember, refreshFlag }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [refreshFlag]);

  async function loadMembers() {
    setLoading(true);
    try {
      const result = await listMembers();
      setMembers(result.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('确定要删除这位会员吗？')) return;
    setDeletingId(id);
    try {
      await deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-lab-gray">
        <span className="iconify ph--spinner animate-spin text-2xl mr-2"></span>
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-lab-bg">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-24">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-lab-gray">
            <span className="iconify ph--users text-4xl opacity-40 mb-3"></span>
            <p className="text-[13px] font-medium">暂无会员</p>
            <p className="text-[12px] mt-1">点击右下角添加会员</p>
          </div>
        ) : (
          members.map(member => (
            <div
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-black/[0.03] active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    member.gender === 'female' ? 'bg-pink-400' : member.gender === 'male' ? 'bg-blue-400' : 'bg-lab-gray'
                  }`}>
                    <span className="iconify ph--user"></span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-lab-dark">{member.name}</h3>
                    <p className="text-[11px] text-lab-gray">
                      {member.gender === 'female' ? '女' : member.gender === 'male' ? '男' : '其他'}
                      {member.age ? ` · ${member.age}岁` : ''}
                      {member.parous ? ' · 已生育' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditMember(member); }}
                    className="w-7 h-7 flex items-center justify-center text-lab-gray hover:text-lab-dark"
                  >
                    <span className="iconify ph--pencil-simple text-sm"></span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(member.id, e)}
                    disabled={deletingId === member.id}
                    className="w-7 h-7 flex items-center justify-center text-lab-gray hover:text-red-500"
                  >
                    <span className="iconify ph--trash text-sm"></span>
                  </button>
                </div>
              </div>
              {member.goals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {member.goals.map(g => (
                    <span key={g} className="text-[10px] font-medium text-lab-green bg-lab-green/10 px-2 py-0.5 rounded">
                      {TRAINING_GOAL_LABELS[g]}
                    </span>
                  ))}
                </div>
              )}
              {member.focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {member.focusAreas.map(a => (
                    <span key={a} className="text-[10px] text-lab-gray bg-lab-light px-1.5 py-0.5 rounded">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={onAddMember}
        className="absolute bottom-20 right-5 w-12 h-12 bg-lab-dark text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="iconify ph--plus text-xl"></span>
      </button>
    </div>
  );
}
