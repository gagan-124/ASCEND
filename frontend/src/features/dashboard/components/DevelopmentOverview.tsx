import type { FC } from 'react';
import { CheckCircle2, Target } from 'lucide-react';

interface DevelopmentOverviewProps {
  strongDomains: string[];
  focusAreas: string[];
}

export const DevelopmentOverview: FC<DevelopmentOverviewProps> = ({
  strongDomains,
  focusAreas,
}) => {
  return (
    <div className="py-4">
      <div className="text-xs font-mono uppercase tracking-widest text-foreground-muted mb-3">
        DEVELOPMENT OVERVIEW
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Domains */}
        <div className="p-4 border border-border/50 bg-surface/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
              STRONG DOMAINS
            </h4>
          </div>

          <ul className="space-y-2 font-sans">
            {strongDomains.map((domain, idx) => (
              <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-emerald-500 font-bold leading-none">•</span>
                <span>{domain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Focus Areas */}
        <div className="p-4 border border-border/50 bg-surface/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground">
              FOCUS AREAS FOR GROWTH
            </h4>
          </div>

          <ul className="space-y-2 font-sans">
            {focusAreas.map((area, idx) => (
              <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-amber-500 font-bold leading-none">•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
