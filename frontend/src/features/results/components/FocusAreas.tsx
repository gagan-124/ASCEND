import type { FC } from 'react';
import { Target } from 'lucide-react';
import type { FocusAreaItem } from '../types/results';

interface FocusAreasProps {
  items: FocusAreaItem[];
}

export const FocusAreas: FC<FocusAreasProps> = ({ items }) => {
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-muted">
          FOCUS AREAS
        </h3>
      </div>
      <p className="text-xs text-foreground-muted mb-4">
        Targeted development areas to elevate your technical delivery
      </p>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="pb-4 border-b border-border/40 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {item.domain}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                {item.level}
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed mb-1.5 font-sans">
              {item.explanation}
            </p>
            {item.evidence && (
              <div className="text-[11px] text-foreground-muted/90 font-mono bg-surface/50 p-2 border-l-2 border-amber-500/50">
                <span className="font-semibold text-foreground">Observed:</span> {item.evidence}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
