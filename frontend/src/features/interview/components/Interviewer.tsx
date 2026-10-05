import React from 'react';
import { cn } from '@/lib/utils';
import { HumanFace } from './HumanFace';
import type { InterviewState } from '@/config/interviewConfig';

export interface InterviewerProps {
  state?: InterviewState;
  audioLevel?: number;
  isSpeaking?: boolean;
  interviewerName?: string;
  interviewerTitle?: string;
  className?: string;
}

export const Interviewer: React.FC<InterviewerProps> = ({
  state = 'READY',
  audioLevel = 0,
  isSpeaking = false,
  interviewerName = 'Dr. Sarah Jenkins',
  interviewerTitle = 'Senior Executive Evaluator',
  className,
}) => {
  const isListening = state === 'LISTENING';
  const isThinking = state === 'EVALUATING';

  return (
    <div className={cn('relative flex flex-col items-center justify-center text-center font-sans select-none', className)}>
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/10 blur-3xl -z-10 pointer-events-none" />

      {/* Main Avatar Surface Ring */}
      <div className="relative rounded-full bg-surface border-2 border-border/80 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 transition-colors duration-300 pointer-events-none',
            isSpeaking
              ? 'border-accent/80 shadow-[0_0_20px_rgba(205,181,141,0.25)]'
              : isListening
              ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : isThinking
              ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'border-border/40'
          )}
        />

        <HumanFace state={state} audioLevel={audioLevel} isSpeaking={isSpeaking} />
      </div>

      {/* Interviewer Metadata Pill */}
      <div className="mt-3 flex flex-col items-center">
        <h3 className="text-sm font-bold text-foreground font-stardom uppercase tracking-tight flex items-center gap-1.5">
          <span>{interviewerName}</span>
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isSpeaking
                ? 'bg-accent animate-pulse'
                : isListening
                ? 'bg-emerald-500 animate-ping'
                : 'bg-emerald-500'
            )}
          />
        </h3>
        <p className="text-[11px] font-mono text-foreground/60">{interviewerTitle}</p>
      </div>
    </div>
  );
};
