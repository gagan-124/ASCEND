import React from 'react';
import { ShieldCheck, Cpu, Mic, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InterviewInitStep = 'environment' | 'session' | 'media' | 'ready';
export type InitStepId = InterviewInitStep;

export interface InitStep {
  id: InitStepId;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface InterviewInitOverlayProps {
  step?: InitStepId;
  currentStep?: InitStepId;
  roleTitle?: string;
  error?: string | null;
  onRetry?: () => void;
}

const STEPS: InitStep[] = [
  {
    id: 'environment',
    label: 'Checking Environment',
    detail: 'Verifying browser features and Web Audio API capabilities...',
    icon: ShieldCheck,
  },
  {
    id: 'session',
    label: 'Connecting AI Interviewer',
    detail: 'Calibrating interview questions and role evaluation matrix...',
    icon: Cpu,
  },
  {
    id: 'media',
    label: 'Preparing Audio & Video',
    detail: 'Wiring hardware media streams and active proctoring guards...',
    icon: Mic,
  },
  {
    id: 'ready',
    label: 'Proctoring Environment Ready',
    detail: 'Entering live room...',
    icon: CheckCircle2,
  },
];

export const InterviewInitOverlay: React.FC<InterviewInitOverlayProps> = ({
  step,
  currentStep,
  roleTitle = 'SOFTWARE ENGINEER',
  error,
  onRetry,
}) => {
  const activeStep = step || currentStep || 'environment';
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#06111E] text-[#F6EFE4] flex flex-col items-center justify-center p-6 select-none font-sans"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0E1D30] border border-border/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
            INTERVIEW INITIALIZATION
          </span>
          <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
            {roleTitle}
          </h2>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs space-y-2">
            <p>{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-mono text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Retry Initialization
              </button>
            )}
          </div>
        )}

        {/* Step Progress List */}
        <div className="space-y-3">
          {STEPS.map((stepItem, idx) => {
            const Icon = stepItem.icon;
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={stepItem.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3.5',
                  isCurrent && 'bg-surface/80 border-accent/40 text-foreground',
                  isCompleted && 'bg-surface/30 border-border/20 text-foreground/80',
                  isPending && 'bg-surface/10 border-border/10 text-foreground/40'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0 mt-0.5',
                    isCurrent && 'bg-accent/20 text-accent border border-accent/30',
                    isCompleted && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                    isPending && 'bg-surface/40 text-foreground/30'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium uppercase tracking-wider">
                      {stepItem.label}
                    </span>
                    {isCurrent && (
                      <div className="w-2 h-2 rounded-full bg-accent animate-ping motion-reduce:animate-none" />
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Done</span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground/60 leading-relaxed font-sans">
                    {stepItem.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
