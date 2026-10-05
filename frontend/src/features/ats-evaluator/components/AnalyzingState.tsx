import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  'Reading resume',
  'Comparing job requirements',
  'Evaluating skills alignment',
  'Preparing recommendations',
] as const;

export const AnalyzingState: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6 font-sans select-none"
    >
      <div className="space-y-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-accent font-semibold animate-pulse motion-reduce:animate-none">
          ANALYZING RESUME
        </h2>
        <p className="text-sm text-foreground-muted font-sans">
          Evaluating document alignment against target role specifications...
        </p>
      </div>

      {/* Subtle stage transition sequence */}
      <div className="w-full max-w-sm py-4 border-y border-border/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-base font-mono text-foreground font-medium flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 bg-accent rounded-full animate-ping shrink-0 motion-reduce:animate-none" />
            <span>{STAGES[currentStageIndex]}...</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2">
        {STAGES.map((stage, idx) => (
          <div
            key={stage}
            className={`h-1 transition-all duration-300 ${
              idx <= currentStageIndex
                ? 'w-8 bg-accent'
                : 'w-4 bg-border/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
