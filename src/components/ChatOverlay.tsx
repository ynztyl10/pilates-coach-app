import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}

export default function ChatOverlay({ isOpen, onClose, initialContext }: ChatOverlayProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message or pre-fill context
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        setMessages([
          { 
            id: Date.now().toString(), 
            role: 'ai', 
            content: '您好！我是普拉提临床助手。您可以问我关于解剖、评估或具体动作训练的任何问题。' 
          }
        ]);
      }
      if (initialContext) {
        setInput(initialContext);
      }
    }
  }, [isOpen, initialContext, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    
    const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "这是AI助手的智能回复。在实际应用中，它将连接大语言模型，并结合《普拉提教练手册》中的专业数据为您解答。";
      if (newMsg.content.includes('X型腿') || newMsg.content.includes('膝盖')) {
        reply = "对于X型腿相关的膝盖疼痛，强化臀中肌以改善骨盆控制是关键。此外，在做下肢闭链运动时，应时刻关注髌骨轨迹是否对准足部第二三脚趾，避免内扣引发代偿。";
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-lab-bg animate-[slideUp_0.25s_ease-out]">
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      
      {/* Header */}
      <header className="h-14 flex items-center px-4 flex-shrink-0 bg-white border-b border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10">
        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-lab-green flex items-center justify-center text-white shadow-sm border border-black/5">
            <span className="iconify ph--robot text-lg"></span>
          </div>
          <div>
            <h2 className="font-bold text-[14px] text-lab-dark leading-tight">智能助手</h2>
            <p className="text-[10px] text-lab-gray font-medium tracking-wide">康复知识模型驱动</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-lab-gray hover:text-lab-dark bg-lab-light rounded-full transition-colors"
        >
          <span className="iconify ph--x text-lg"></span>
        </button>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50 pb-20">
        <div className="text-center mb-2">
          <span className="inline-block bg-black/[0.03] text-lab-gray text-[10px] px-3 py-1 rounded-full font-medium tracking-wider">
            今天 {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-lab-green flex items-center justify-center flex-shrink-0 text-white shadow-sm mb-0.5">
                <span className="iconify ph--robot text-[14px]"></span>
              </div>
            )}
            <div 
              className={`max-w-[82%] rounded-[20px] p-3.5 text-[14px] leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-lab-dark text-white rounded-br-sm' 
                  : 'bg-white text-lab-dark border border-black/5 rounded-bl-sm'
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start items-end gap-2 animate-[fadeIn_0.2s]">
            <div className="w-7 h-7 rounded-full bg-lab-green flex items-center justify-center flex-shrink-0 text-white shadow-sm mb-0.5">
              <span className="iconify ph--robot text-[14px]"></span>
            </div>
            <div className="bg-white border border-black/5 rounded-[20px] rounded-bl-sm p-4 flex gap-1.5 items-center shadow-sm h-[46px]">
              <span className="w-1.5 h-1.5 bg-lab-green/60 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-lab-green/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
              <span className="w-1.5 h-1.5 bg-lab-green/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-black/5 pb-safe">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="描述症状或询问动作细节..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-lab-light border-none rounded-full pl-4 pr-3 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-lab-dark text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors flex-shrink-0 shadow-sm"
          >
            <span className="iconify ph--paper-plane-right-fill text-lg"></span>
          </button>
        </div>
      </div>
    </div>
  );
}
