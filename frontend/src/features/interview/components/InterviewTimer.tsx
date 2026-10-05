import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InterviewTimerProps {
  elapsedSeconds: number;
  className?: string;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({ elapsedSeconds, className }) => {
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/50 border border-border/40 text-foreground/70 font-mono text-xs select-none',
        className
      )}
    >
      <Timer className="w-3.5 h-3.5" />
      <span>{formatTimer(elapsedSeconds)}</span>
    </div>
  );
};
