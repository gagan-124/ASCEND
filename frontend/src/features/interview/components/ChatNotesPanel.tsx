import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from './InterviewChatDrawer';

export interface ChatNotesPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onQuickAction?: (actionText: string) => void;
  className?: string;
}

export const ChatNotesPanel: React.FC<ChatNotesPanelProps> = ({
  messages,
  onSendMessage,
  onQuickAction,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  const [notesText, setNotesText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    'Can you repeat the question?',
    'Give me a hint',
    'Skip this question',
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleActionClick = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    } else {
      onSendMessage(action);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl bg-[#0d1219] border border-white/10 flex flex-col overflow-hidden font-sans select-none',
        className
      )}
    >
      {/* Tab Navigation Header */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 bg-white/[0.02] shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
            activeTab === 'chat'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-white/60 hover:text-white/90 hover:bg-white/5'
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
            activeTab === 'notes'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-white/60 hover:text-white/90 hover:bg-white/5'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notes</span>
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Scroll Area */}
          <div
            ref={scrollRef}
            className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-sans scrollbar-thin scrollbar-thumb-white/10"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-1">
                <MessageSquare className="w-6 h-6 text-white/20" />
                <span className="text-[11px]">Type a question or request clarification below</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs',
                    msg.sender === 'candidate'
                      ? 'ml-auto bg-cyan-600/20 border border-cyan-500/30 text-white'
                      : msg.sender === 'system'
                      ? 'mx-auto bg-white/5 border border-white/10 text-white/60 text-[11px] text-center max-w-[95%]'
                      : 'mr-auto bg-white/5 border border-white/10 text-white/90'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-white/40 font-mono">
                    <span>{msg.sender === 'candidate' ? 'You' : msg.sender === 'interviewer' ? 'Interviewer' : 'System'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Bottom Chat Input Form & Quick Chips */}
          <div className="p-3 border-t border-white/10 bg-white/[0.01] space-y-2 shrink-0">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message... (e.g. request clarification)"
                className="w-full h-9 pl-3 pr-9 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-1.5 w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 disabled:hover:bg-cyan-500/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>

            {/* Quick Action Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionClick(action)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Notes Tab Content */
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Jot down private interview notes or scratchpad code here..."
            className="w-full flex-1 p-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 text-xs focus:outline-none focus:border-cyan-500/50 resize-none font-mono scrollbar-thin scrollbar-thumb-white/10"
          />
        </div>
      )}
    </div>
  );
};
