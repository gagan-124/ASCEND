import React from 'react';
import { ShieldCheck, Cpu, Mic, CheckCircle2, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
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
  onCancel?: () => void;
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
  onCancel,
}) => {
  const activeStep = step || currentStep || 'environment';
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);
  const hasError = Boolean(error && error.trim().length > 0);

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

        {/* Error Banner - Guaranteed non-empty, actionable card */}
        {hasError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-3 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-rose-300">
                  Initialization Interrupted
                </h3>
                <p className="text-[12px] text-rose-200/90 leading-relaxed font-sans">
                  {error?.trim() || 'The AI interviewer service timed out or was temporarily unreachable. Please retry.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Initialization</span>
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 font-mono text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
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
