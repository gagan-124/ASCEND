import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InterviewProgressProps {
  currentIndex: number;
  totalQuestions: number;
  className?: string;
}

export const InterviewProgress: React.FC<InterviewProgressProps> = ({
  currentIndex,
  totalQuestions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/60 text-foreground/80 font-mono text-xs font-bold select-none',
        className
      )}
    >
      <Sparkles className="w-3.5 h-3.5 text-accent" />
      <span>
        QUESTION {String(currentIndex + 1).padStart(2, '0')} / {String(Math.max(1, totalQuestions)).padStart(2, '0')}
      </span>
    </div>
  );
};
