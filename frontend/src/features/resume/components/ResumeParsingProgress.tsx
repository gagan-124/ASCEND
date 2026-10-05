import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, FileText, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResumeParsingProgressProps {
  fileName: string;
  onComplete?: () => void;
  className?: string;
}

const STAGES = [
  { id: 'extract', label: 'ANALYZING RESUME', detail: 'Extracting text evidence & structure' },
  { id: 'parse', label: 'PARSING EVIDENCE', detail: 'Mapping experience, education & projects' },
  { id: 'skills', label: 'IDENTIFYING STRENGTHS', detail: 'Cataloging technical capabilities & tools' },
  { id: 'alignment', label: 'EVALUATING ROLE ALIGNMENT', detail: 'Deriving explicit & inferred target roles' },
  { id: 'finalize', label: 'GENERATING CANDIDATE INTELLIGENCE', detail: 'Synthesizing grounded recommendations' },
];

export const ResumeParsingProgress: React.FC<ResumeParsingProgressProps> = ({
  fileName,
  onComplete,
  className,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        clearInterval(stageInterval);
        return prev;
      });
    }, 450);

    return () => clearInterval(stageInterval);
  }, []);

  useEffect(() => {
    if (currentStageIndex === STAGES.length - 1 && onComplete) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }
  }, [currentStageIndex, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        'w-full max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-surface border border-border/80 text-left shadow-lg',
        className
      )}
    >
      {/* File Badge */}
      <div className="flex items-center gap-3 pb-6 border-b border-border/40">
        <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/60">
            Target Document
          </p>
          <p className="text-sm font-semibold text-foreground truncate">{fileName}</p>
        </div>
      </div>

      {/* Main Processing Header */}
      <div className="my-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-foreground/5 text-foreground animate-pulse">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span>ASCEND INTELLIGENCE ENGINE</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </h3>
          <p className="text-xs text-foreground/60 font-sans mt-0.5">
            Processing evidence server-side. Preserving authentic resume data.
          </p>
        </div>
      </div>

      {/* Stage Steps Checklist */}
      <div className="space-y-3.5 my-6 font-mono text-xs">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <div
              key={stage.id}
              className={cn(
                'flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200',
                isCurrent && 'bg-foreground/5 border border-border/50',
                isDone && 'opacity-80'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border/60" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'font-semibold tracking-wider uppercase text-[11px]',
                    isCurrent ? 'text-foreground font-bold' : isDone ? 'text-foreground/80' : 'text-foreground/40'
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-[11px] font-sans text-foreground/60 mt-0.5">{stage.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Trust Indicator */}
      <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-foreground/50">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Strict Schema Constrained Output
        </span>
        <span>No Percentage Scores</span>
      </div>
    </motion.div>
  );
};
