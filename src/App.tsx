import { useState } from 'react';
import { PilatesKnowledge } from './data/knowledge';
import { Member } from './types/member';
import Home from './components/Home';
import Detail from './components/Detail';
import ChatOverlay from './components/ChatOverlay';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import MemberDetail from './components/MemberDetail';
import PlanGenerator from './components/PlanGenerator';
import PlanPreview from './components/PlanPreview';
import { exportPlanPDF } from './services/pdfExport';
import PersonalizedPlanInput from './components/PersonalizedPlanInput';
import PersonalizedPlanPreview from './components/PersonalizedPlanPreview';

type Tab = 'handbook' | 'members';
type MemberView = 'list' | 'form' | 'detail' | 'planGenerator' | 'planPreview' | 'personalizedPlanInput' | 'personalizedPlanPreview';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('handbook');

  // Handbook state
  const [selectedItem, setSelectedItem] = useState<PilatesKnowledge | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string>('');

  // Members state
  const [memberView, setMemberView] = useState<MemberView>('list');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [memberRefreshFlag, setMemberRefreshFlag] = useState(0);

  const openChat = (context?: string) => {
    setChatContext(context || '');
    setIsChatOpen(true);
  };

  // Member navigation helpers
  const goToMemberList = () => {
    setMemberView('list');
    setSelectedMember(null);
    setEditingMember(null);
    setSelectedPlanId('');
  };

  const goToMemberForm = (member?: Member) => {
    setEditingMember(member || null);
    setMemberView('form');
  };

  const goToMemberDetail = (member: Member) => {
    setSelectedMember(member);
    setMemberView('detail');
  };

  const goToPlanGenerator = (member: Member) => {
    setSelectedMember(member);
    setMemberView('planGenerator');
  };

  const goToPlanPreview = (planId: string) => {
    setSelectedPlanId(planId);
    setMemberView('planPreview');
  };

  const goToPersonalizedPlanInput = (member: Member) => {
    setSelectedMember(member);
    setMemberView('personalizedPlanInput');
  };

  const goToPersonalizedPlanPreview = (planId: string) => {
    setSelectedPlanId(planId);
    setMemberView('personalizedPlanPreview');
  };

  const handleMemberSaved = () => {
    setMemberRefreshFlag(prev => prev + 1);
    goToMemberList();
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-200 font-sans text-lab-dark">
      <div className="w-full max-w-[480px] h-[100dvh] bg-lab-bg relative shadow-2xl flex flex-col overflow-hidden">

        {/* ===== HANDBOOK TAB ===== */}
        {activeTab === 'handbook' && (
          <>
            {/* Header */}
            {!selectedItem && (
              <header className="h-14 flex items-center justify-between px-5 flex-shrink-0 bg-white border-b border-black/5 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-lab-dark rounded flex items-center justify-center text-white">
                    <span className="iconify ph--books text-lg"></span>
                  </div>
                  <h1 className="font-bold text-lg text-lab-dark tracking-wide">普拉提教练手册</h1>
                </div>
                <button
                  onClick={() => openChat()}
                  className="w-8 h-8 flex items-center justify-center text-lab-green bg-lab-green/10 rounded-full hover:bg-lab-green/20 transition-colors"
                >
                  <span className="iconify ph--robot text-xl"></span>
                </button>
              </header>
            )}

            {/* Content */}
            <main className="flex-1 overflow-hidden relative">
              {!selectedItem ? (
                <Home onSelectItem={setSelectedItem} />
              ) : (
                <Detail
                  item={selectedItem}
                  onBack={() => setSelectedItem(null)}
                  onAskAI={() => openChat(`关于"${selectedItem.name}"的疑问：`)}
                />
              )}
            </main>

            <ChatOverlay
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              initialContext={chatContext}
            />
          </>
        )}

        {/* ===== MEMBERS TAB ===== */}
        {activeTab === 'members' && (
          <main className="flex-1 overflow-hidden relative">
            {memberView === 'list' && (
              <MemberList
                onSelectMember={goToMemberDetail}
                onAddMember={() => goToMemberForm()}
                onEditMember={goToMemberForm}
                refreshFlag={memberRefreshFlag}
              />
            )}
            {memberView === 'form' && (
              <MemberForm
                member={editingMember}
                onSaved={handleMemberSaved}
                onCancel={goToMemberList}
              />
            )}
            {memberView === 'detail' && selectedMember && (
              <MemberDetail
                member={selectedMember}
                onBack={goToMemberList}
                onEdit={goToMemberForm}
                onGeneratePlan={goToPlanGenerator}
                onViewPlan={goToPlanPreview}
                onGeneratePersonalizedPlan={goToPersonalizedPlanInput}
              />
            )}
            {memberView === 'planGenerator' && selectedMember && (
              <PlanGenerator
                member={selectedMember}
                onBack={() => goToMemberDetail(selectedMember)}
                onPlanCreated={goToPlanPreview}
              />
            )}
            {memberView === 'planPreview' && (
              <PlanPreview
                planId={selectedPlanId}
                onBack={() => selectedMember ? goToMemberDetail(selectedMember) : goToMemberList()}
                onExportPDF={exportPlanPDF}
              />
            )}
            {memberView === 'personalizedPlanInput' && selectedMember && (
              <PersonalizedPlanInput
                member={selectedMember}
                onBack={() => goToMemberDetail(selectedMember)}
                onPlanGenerated={goToPersonalizedPlanPreview}
              />
            )}
            {memberView === 'personalizedPlanPreview' && (
              <PersonalizedPlanPreview
                planId={selectedPlanId}
                onBack={() => selectedMember ? goToMemberDetail(selectedMember) : goToMemberList()}
              />
            )}
          </main>
        )}

        {/* ===== BOTTOM TAB BAR ===== */}
        <nav className="h-16 flex-shrink-0 bg-white border-t border-black/5 flex items-center justify-around z-20">
          <button
            onClick={() => { setActiveTab('handbook'); setSelectedItem(null); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 transition-colors ${
              activeTab === 'handbook' ? 'text-lab-dark' : 'text-lab-gray'
            }`}
          >
            <span className={`iconify ph--books text-2xl ${activeTab === 'handbook' ? 'text-lab-dark' : 'text-lab-gray'}`}></span>
            <span className="text-[10px] font-bold">手册</span>
          </button>
          <button
            onClick={() => { setActiveTab('members'); goToMemberList(); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 transition-colors ${
              activeTab === 'members' ? 'text-lab-dark' : 'text-lab-gray'
            }`}
          >
            <span className={`iconify ph--users text-2xl ${activeTab === 'members' ? 'text-lab-dark' : 'text-lab-gray'}`}></span>
            <span className="text-[10px] font-bold">会员</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
