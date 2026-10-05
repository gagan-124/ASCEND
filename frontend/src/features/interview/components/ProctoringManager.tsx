import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { TerminationReason } from '@/types/interview';

export interface ProctoringManagerProps {
  isTerminated: boolean;
  terminationReason: TerminationReason | null;
  warningLevel: 0 | 1 | 2;
  onResetInactivity: () => void;
  onReturnToDashboard: () => void;
}

export const ProctoringManager: React.FC<ProctoringManagerProps> = ({
  isTerminated,
  terminationReason,
  warningLevel,
  onResetInactivity,
  onReturnToDashboard,
}) => {
  const getReasonDetails = (reason: TerminationReason | null) => {
    switch (reason) {
      case 'PAGE_RELOAD':
        return {
          title: 'Session Reloaded',
          message: 'The interview page was reloaded or refreshed. Per security guidelines, reloading an active session terminates the interview.',
        };
      case 'TAB_SWITCH':
        return {
          title: 'Browser Tab Changed',
          message: 'You switched tabs or left the active interview window. Leaving the active interview page terminates the session immediately.',
        };
      case 'INACTIVITY':
        return {
          title: 'Inactivity Limit Exceeded',
          message: 'The interview was ended because no candidate speech or activity was detected for an extended period after multiple warnings.',
        };
      case 'USER_ENDED':
        return {
          title: 'Interview Ended',
          message: 'The interview session was concluded.',
        };
      default:
        return {
          title: 'Session Terminated',
          message: 'This interview session has been ended and cannot be resumed.',
        };
    }
  };

  const details = getReasonDetails(terminationReason);

  return (
    <>
      {/* 1. Inactivity Warning Modals (Warning 1 & Warning 2) */}
      <AnimatePresence>
        {!isTerminated && warningLevel > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 sm:p-7 rounded-2xl bg-surface border border-amber-500/50 shadow-2xl text-left font-sans"
            >
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  INACTIVITY WARNING {warningLevel === 2 ? '(FINAL NOTICE)' : ''}
                </h3>
              </div>

              <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                Are you still there? We&apos;ve detected no candidate activity for 3 minutes. Please resume your interview to continue.
              </p>

              <div className="flex items-center justify-end font-mono text-xs">
                <button
                  type="button"
                  onClick={onResetInactivity}
                  className="px-5 py-2.5 rounded-xl bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-95 cursor-pointer shadow-md"
                >
                  RESUME INTERVIEW
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Terminated Interview Full-Screen Security Guard */}
      <AnimatePresence>
        {isTerminated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 z-50 select-none text-center font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-surface border border-destructive/40 shadow-2xl flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-mono text-[10px] font-bold uppercase tracking-widest inline-block mb-3">
                  INTERVIEW TERMINATED
                </div>
                <h2 className="text-xl sm:text-2xl font-stardom text-foreground tracking-tight">
                  {details.title}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed max-w-md">
                {details.message}
              </p>

              <div className="pt-4 border-t border-border/40 w-full flex items-center justify-center font-mono text-xs">
                <button
                  type="button"
                  onClick={onReturnToDashboard}
                  className="px-6 py-3 rounded-xl bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-95 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>RETURN TO DASHBOARD</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
