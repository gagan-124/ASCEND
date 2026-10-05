import { useState, type FC } from 'react';
import { CheckCircle2, Target, ChevronRight, ChevronDown } from 'lucide-react';
import type { DomainPerformance, FocusAreaItem } from '../types/results';

interface DomainAnalysisSectionProps {
  strongDomains: DomainPerformance[];
  focusAreas: FocusAreaItem[];
}

export const DomainAnalysisSection: FC<DomainAnalysisSectionProps> = ({
  strongDomains,
  focusAreas,
}) => {
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  const toggleEvidence = (key: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
        QUALITATIVE ANALYSIS & OBSERVATIONS
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WHAT YOU DID WELL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              WHAT YOU DID WELL
            </h3>
          </div>

          <div className="space-y-5">
            {strongDomains.map((item, idx) => {
              const key = `strong-${idx}`;
              const isExpanded = !!expandedEvidence[key];

              return (
                <div key={key} className="space-y-2 font-sans">
                  <div className="text-base font-semibold text-foreground">
                    {item.domain}
                  </div>
                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {item.explanation}
                  </p>

                  {item.evidence && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleEvidence(key)}
                        className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 cursor-pointer focus:outline-none"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Hide observed evidence</span>
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>View observed evidence</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 bg-surface/50 border-l-2 border-emerald-500 text-xs font-mono text-foreground-muted leading-relaxed">
                          <strong className="text-foreground">Observed:</strong> {item.evidence}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WHERE TO FOCUS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Target className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              WHERE TO FOCUS
            </h3>
          </div>

          <div className="space-y-5">
            {focusAreas.map((item, idx) => {
              const key = `focus-${idx}`;
              const isExpanded = !!expandedEvidence[key];

              return (
                <div key={key} className="space-y-2 font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-foreground">
                      {item.domain}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.level}
                    </span>
                  </div>

                  <p className="text-sm text-foreground-muted leading-relaxed">
                    {item.explanation}
                  </p>

                  {item.evidence && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleEvidence(key)}
                        className="text-xs font-mono text-accent hover:underline flex items-center gap-1.5 cursor-pointer focus:outline-none"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Hide observed evidence</span>
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span>View observed evidence</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3.5 bg-surface/50 border-l-2 border-amber-500 text-xs font-mono text-foreground-muted leading-relaxed">
                          <strong className="text-foreground">Observed:</strong> {item.evidence}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
