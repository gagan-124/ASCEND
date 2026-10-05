import type { FC } from 'react';
import { BookOpen } from 'lucide-react';
import type { PrepareNextTopic } from '../types/dashboard';

interface PrepareNextSectionProps {
  topics: PrepareNextTopic[];
}

export const PrepareNextSection: FC<PrepareNextSectionProps> = ({ topics }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
          PREPARATION GUIDANCE
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="p-5 border border-border/40 bg-surface/20 space-y-3"
          >
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
              {topic.title}
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed font-sans">
              "{topic.description}"
            </p>

            {topic.concepts && topic.concepts.length > 0 && (
              <ul className="space-y-1.5 pt-1 text-xs text-foreground">
                {topic.concepts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
