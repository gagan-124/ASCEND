import type { FC } from 'react';
import { BookOpen } from 'lucide-react';
import type { PreparationTopic } from '../types/results';

interface WhatToPrepareNextProps {
  topics: PreparationTopic[];
}

export const WhatToPrepareNext: FC<WhatToPrepareNextProps> = ({ topics }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          WHAT TO PREPARE NEXT
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="p-5 border border-border/40 bg-surface/20 space-y-3"
          >
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
              {topic.category}
            </div>

            <p className="text-sm text-foreground-muted font-sans">
              {topic.leadInText}
            </p>

            <ul className="space-y-1.5 font-sans pt-1">
              {topic.bulletPoints.map((point, ptIndex) => (
                <li key={ptIndex} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-accent font-bold leading-none select-none">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
