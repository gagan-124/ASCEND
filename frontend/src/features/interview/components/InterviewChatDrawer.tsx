import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'candidate' | 'system';
  text: string;
  timestamp: string;
}

export interface InterviewChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const InterviewChatDrawer: React.FC<InterviewChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed top-16 right-4 bottom-24 w-80 sm:w-96 bg-surface/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden font-sans select-none"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2 text-foreground font-mono text-xs font-bold uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span>Interview Clarification Chat</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-background/80 text-foreground/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-foreground/50 space-y-2">
                <MessageSquare className="w-8 h-8 text-foreground/20" />
                <p className="text-xs">
                  Ask a clarification or view system interview notes here.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col gap-1 max-w-[85%]',
                    msg.sender === 'candidate'
                      ? 'ml-auto items-end'
                      : msg.sender === 'system'
                      ? 'mx-auto items-center text-center max-w-[95%]'
                      : 'mr-auto items-start'
                  )}
                >
                  <div className="flex items-center gap-1 text-[10px] font-mono text-foreground/50">
                    {msg.sender === 'interviewer' && (
                      <>
                        <Bot className="w-3 h-3 text-accent" />
                        <span>AI Interviewer</span>
                      </>
                    )}
                    {msg.sender === 'candidate' && (
                      <>
                        <User className="w-3 h-3 text-foreground/70" />
                        <span>You</span>
                      </>
                    )}
                    <span>· {msg.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      'p-2.5 rounded-xl leading-relaxed text-xs',
                      msg.sender === 'candidate'
                        ? 'bg-foreground text-background font-medium rounded-br-none'
                        : msg.sender === 'system'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px]'
                        : 'bg-background/90 border border-border/60 text-foreground rounded-bl-none'
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-border/60 bg-surface/80 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a clarification..."
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border/60 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-foreground text-background disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
