import React, { useRef, useEffect } from 'react';
import { Menu, User, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TranscriptEntry {
  id: string;
  speaker: 'ai' | 'candidate' | 'system';
  speakerName?: string;
  text: string;
  timestamp: string;
}

export interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  className?: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  entries,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl bg-[#0d1219] border border-white/10 flex flex-col overflow-hidden font-sans select-none',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2 text-white/90 font-medium text-xs">
          <Menu className="w-3.5 h-3.5 text-white/60" />
          <span>Transcript</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Notice */}
      <div className="px-4 py-1.5 bg-white/[0.02] border-b border-white/10 text-[10px] font-mono text-white/40 flex items-center gap-1.5 shrink-0">
        <AlertCircle className="w-3 h-3 text-amber-400/80 shrink-0" />
        <span>Note: Full transcript will be available on the Results page.</span>
      </div>

      {/* Transcript Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans scrollbar-thin scrollbar-thumb-white/10"
      >
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-1.5">
            <span className="text-xs">Live interview transcription will stream here...</span>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              {/* Avatar Circle */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-xs',
                  entry.speaker === 'ai'
                    ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/15 text-white/80'
                )}
              >
                {entry.speaker === 'ai' ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Speaker Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/90 text-xs">
                    {entry.speakerName || (entry.speaker === 'ai' ? 'Interviewer (IRA)' : 'You')}
                  </span>
                  <span className="font-mono text-[10px] text-white/40">{entry.timestamp}</span>
                </div>
                <p className="text-white/80 leading-relaxed text-xs whitespace-pre-wrap">
                  {entry.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
