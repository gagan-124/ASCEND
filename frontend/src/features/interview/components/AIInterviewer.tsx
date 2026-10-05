import React from 'react';
import { MoreVertical, Mic, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HumanFace } from './HumanFace';
import type { InterviewState } from '@/config/interviewConfig';

export interface AIInterviewerProps {
  state?: InterviewState;
  audioLevel?: number;
  isSpeaking?: boolean;
  interviewerName?: string;
  className?: string;
}

export const AIInterviewer: React.FC<AIInterviewerProps> = ({
  state = 'READY',
  audioLevel = 0,
  isSpeaking = false,
  interviewerName = 'Interviewer (IRA)',
  className,
}) => {
  const isListening = state === 'LISTENING';
  const isThinking = state === 'EVALUATING';

  const statusLabel = isSpeaking
    ? 'Speaking'
    : isListening
    ? 'Listening'
    : isThinking
    ? 'Processing'
    : 'Ready';

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl bg-[#0d1219] border overflow-hidden flex items-center justify-center select-none transition-all duration-300',
        isSpeaking
          ? 'border-cyan-500/70 shadow-[0_0_30px_rgba(6,182,212,0.18)]'
          : isListening
          ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
          : 'border-white/10',
        className
      )}
    >
      {/* Background Ambient Spotlight Glow */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500 pointer-events-none',
          isSpeaking
            ? 'bg-gradient-to-b from-cyan-950/30 via-transparent to-black/60 opacity-100'
            : isListening
            ? 'bg-gradient-to-b from-emerald-950/20 via-transparent to-black/60 opacity-100'
            : 'bg-gradient-to-b from-white/[0.02] to-black/60 opacity-100'
        )}
      />

      {/* Top Right Options Menu */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
          title="Interviewer options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Central Avatar Visual Presentation */}
      <div className="relative flex items-center justify-center w-48 h-48 sm:w-60 sm:h-60 rounded-full">
        {/* Subtle Outer Frame Halo */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border transition-all duration-500',
            isSpeaking
              ? 'border-cyan-500/40 scale-105 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
              : isListening
              ? 'border-emerald-500/30 scale-102 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'border-white/10'
          )}
        />

        {/* Avatar Surface */}
        <div className="relative w-full h-full rounded-full bg-[#121824] border-2 border-white/15 overflow-hidden flex items-center justify-center shadow-2xl">
          <HumanFace state={state} audioLevel={audioLevel} isSpeaking={isSpeaking} />
        </div>
      </div>

      {/* Bottom Left: Interviewer Identifier Badge */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-sans font-medium">
        <span className="flex items-center gap-1 text-cyan-400">
          <Volume2 className="w-3.5 h-3.5" />
        </span>
        <span>{interviewerName}</span>
      </div>

      {/* Bottom Right: Status Indicator Badge */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-sans font-medium">
        <span
          className={cn(
            'flex items-center gap-1',
            isSpeaking ? 'text-cyan-400' : isListening ? 'text-emerald-400' : 'text-white/60'
          )}
        >
          {isSpeaking ? (
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
            </span>
          ) : isListening ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-white/40" />
          )}
        </span>
        <span
          className={cn(
            isSpeaking ? 'text-cyan-300' : isListening ? 'text-emerald-300' : 'text-white/70'
          )}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};
