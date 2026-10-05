import type { FC } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { DomainPerformance } from '../types/results';

interface StrongDomainsProps {
  domains: DomainPerformance[];
}

export const StrongDomains: FC<StrongDomainsProps> = ({ domains }) => {
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-foreground-muted">
          STRONG DOMAINS
        </h3>
      </div>
      <p className="text-xs text-foreground-muted mb-4">
        Core capabilities demonstrated effectively during your session
      </p>

      <div className="space-y-4">
        {domains.map((item, index) => (
          <div
            key={index}
            className="pb-4 border-b border-border/40 last:border-b-0 last:pb-0"
          >
            <div className="text-sm font-semibold text-foreground mb-1">
              {item.domain}
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed mb-1.5 font-sans">
              {item.explanation}
            </p>
            {item.evidence && (
              <div className="text-[11px] text-foreground-muted/90 font-mono bg-surface/50 p-2 border-l-2 border-emerald-500/50">
                <span className="font-semibold text-foreground">Observed:</span> {item.evidence}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
