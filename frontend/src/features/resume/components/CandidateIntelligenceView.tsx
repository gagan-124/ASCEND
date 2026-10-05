import React from 'react';
import { motion } from 'framer-motion';
import { Award, Target, Briefcase, Check, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CandidateIntelligence, QualitativeMatch } from '@/types/resume';

export interface CandidateIntelligenceViewProps {
  intelligence: CandidateIntelligence;
  selectedRoleTitle?: string;
  onSelectRole: (roleTitle: string, roleId?: string) => void;
  className?: string;
}

const getMatchBadgeStyle = (match: QualitativeMatch) => {
  switch (match) {
    case 'Exceptional Match':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'Strong Match':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'Good Match':
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    case 'Potential Match':
    default:
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  }
};

export const CandidateIntelligenceView: React.FC<CandidateIntelligenceViewProps> = ({
  intelligence,
  selectedRoleTitle,
  onSelectRole,
  className,
}) => {
  const { keyInfo, strongAreas, targetRoles, recommendedRoles, isSparseEvidence } = intelligence;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('w-full flex flex-col gap-6 text-left select-none font-sans', className)}
    >
      {/* Top Banner Notice for Sparse Evidence if applicable */}
      {isSparseEvidence && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>
            Recommendations are focused based on available resume evidence.
          </p>
        </div>
      )}

      {/* SECTION 1: KEY CANDIDATE INFORMATION - Full Width 4-Column Desktop Grid */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border/60 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-foreground/70" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
              KEY CANDIDATE INFORMATION
            </h3>
          </div>
          <span className="text-[11px] font-mono text-foreground/50">Verified Evidence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-background/50 border border-border/30">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block mb-1">
              Candidate Name
            </span>
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{keyInfo.candidateName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background/50 border border-border/30">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block mb-1">
              Recent / Current Role
            </span>
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{keyInfo.currentRecentRole}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background/50 border border-border/30">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block mb-1">
              Total Experience
            </span>
            <p className="font-semibold text-foreground text-sm sm:text-base">{keyInfo.totalExperience}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-background/50 border border-border/30">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block mb-1">
              Education
            </span>
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{keyInfo.education}</p>
          </div>
        </div>

        {/* Core Skills Chips - Horizontal Cloud */}
        {keyInfo.coreSkills && keyInfo.coreSkills.length > 0 && (
          <div className="pt-3 border-t border-border/30">
            <span className="text-[11px] font-mono uppercase text-foreground/50 block mb-2.5">
              Core Technical Skills
            </span>
            <div className="flex flex-wrap gap-2">
              {keyInfo.coreSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-foreground/5 border border-border/40 font-mono text-xs text-foreground/90 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 & 3: TWO-COLUMN DESKTOP GRID (Strong Areas + Target Roles) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: STRONG AREAS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border/60 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3.5">
            <Award className="w-4 h-4 text-foreground/70" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
              STRONG AREAS
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            {strongAreas.map((area, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-background/50 border border-border/40 flex items-center gap-3 text-xs sm:text-sm font-medium text-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: TARGET / AIMING ROLES */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border/60 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3.5">
            <Target className="w-4 h-4 text-foreground/70" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
              TARGET / AIMING ROLES
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm pt-1">
            {/* Explicit Target Roles */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground/60 flex items-center justify-between border-b border-border/20 pb-1">
                <span>EXPLICIT</span>
                <span className="text-[10px] text-foreground/40 font-normal lowercase">Stated in Resume</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {targetRoles.explicit.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-foreground/10 border border-foreground/20 font-medium text-foreground text-xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Inferred Target Roles */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground/60 flex items-center justify-between border-b border-border/20 pb-1">
                <span>INFERRED</span>
                <span className="text-[10px] text-foreground/40 font-normal lowercase">Derived from Evidence</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {targetRoles.inferred.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-surface-muted border border-border/50 text-foreground/80 text-xs"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: RECOMMENDED ROLES - Full Width */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border/60 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3.5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-foreground/70" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
              RECOMMENDED ROLES
            </h3>
          </div>
          <span className="text-[11px] font-mono text-foreground/50">
            Select role to focus evaluation
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          {recommendedRoles.map((rec, index) => {
            const isSelected = selectedRoleTitle === rec.roleTitle;
            const indexStr = String(index + 1).padStart(2, '0');

            return (
              <div
                key={index}
                onClick={() => onSelectRole(rec.roleTitle, rec.roleId)}
                className={cn(
                  'p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6',
                  isSelected
                    ? 'bg-foreground/5 border-foreground ring-1 ring-foreground/20 shadow-xs'
                    : 'bg-background/40 border-border/40 hover:border-foreground/40 hover:bg-background/80'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-bold text-foreground/40 mt-0.5 shrink-0">
                    {indexStr}
                  </span>

                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                        {rec.roleTitle}
                      </h4>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold tracking-wider uppercase border',
                          getMatchBadgeStyle(rec.matchStrength)
                        )}
                      >
                        {rec.matchStrength}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{rec.conciseReasoning}</p>

                    {/* Supporting Evidence Bullets */}
                    {rec.supportingEvidence && rec.supportingEvidence.length > 0 && (
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1 text-xs text-foreground/70 font-sans">
                        {rec.supportingEvidence.map((ev, eIdx) => (
                          <span key={eIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                            {ev}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end sm:pl-4">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-foreground border-foreground text-background'
                        : 'border-border/60 text-transparent'
                    )}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
