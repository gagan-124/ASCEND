import type { FC } from 'react';

interface AISummaryProps {
  summary: string;
}

export const AISummary: FC<AISummaryProps> = ({ summary }) => {
  return (
    <div className="space-y-2">
      <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
        AI EVALUATOR SUMMARY
      </div>
      <p className="text-base sm:text-lg text-foreground font-sans leading-relaxed pl-4 border-l-2 border-accent/60">
        "{summary}"
      </p>
    </div>
  );
};
