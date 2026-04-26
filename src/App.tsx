import React, { useState } from 'react';
import { PilatesKnowledge } from './data/knowledge';
import Home from './components/Home';
import Detail from './components/Detail';
import ChatOverlay from './components/ChatOverlay';

export default function App() {
  const [selectedItem, setSelectedItem] = useState<PilatesKnowledge | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string>('');

  const openChat = (context?: string) => {
    if (context) {
      setChatContext(context);
    } else {
      setChatContext('');
    }
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-200 font-sans text-lab-dark">
      <div className="w-full max-w-[480px] h-[100dvh] bg-lab-bg relative shadow-2xl flex flex-col overflow-hidden">
        
        {/* Main Header */}
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

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {!selectedItem ? (
            <Home onSelectItem={setSelectedItem} />
          ) : (
            <Detail 
              item={selectedItem} 
              onBack={() => setSelectedItem(null)} 
              onAskAI={() => openChat(`关于“${selectedItem.name}”的疑问：`)}
            />
          )}
        </main>

        {/* Chat Overlay */}
        <ChatOverlay 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          initialContext={chatContext}
        />
      </div>
    </div>
  );
}
