import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScreeningModeCard } from './ScreeningModeCard';
import { Briefcase, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScreeningModeSelectorProps {
  selectedMode: 'role' | 'resume' | null;
  onSelectMode: (mode: 'role' | 'resume') => void;
  roleContent?: React.ReactNode;
  resumeContent?: React.ReactNode;
  className?: string;
}

export const ScreeningModeSelector: React.FC<ScreeningModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  roleContent,
  resumeContent,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const updateMedia = () => setIsDesktop(media.matches);
    updateMedia();
    media.addEventListener('change', updateMedia);
    return () => media.removeEventListener('change', updateMedia);
  }, []);

  // Custom physical cubic-bezier(0.16, 1, 0.3, 1) transition curve (~1000ms duration)
  const unfoldTransition = {
    duration: shouldReduceMotion ? 0 : 1.0,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  const handleCardClick = (id: 'role' | 'resume') => {
    if (!selectedMode) {
      onSelectMode(id);
    }
  };

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 select-none relative transition-all duration-300',
        selectedMode ? 'max-w-[1440px] 2xl:max-w-[1600px] py-0.5 sm:py-1 lg:py-2' : 'max-w-6xl py-2 sm:py-6 md:py-8',
        className
      )}
    >
      {/* Header Title Section - Collapses vertically & fades out on selection */}
      <motion.div
        initial={false}
        animate={{
          opacity: selectedMode ? 0 : 1,
          height: selectedMode ? 0 : 'auto',
          marginBottom: selectedMode ? 0 : isDesktop ? 36 : 24,
        }}
        transition={unfoldTransition}
        className="text-center overflow-hidden px-2"
      >
        <span className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-foreground/60 px-3 py-1 rounded-full border border-border/40 bg-surface/40 inline-block mb-2 sm:mb-3">
          ASCEND Setup Protocol
        </span>
        <h1 className="text-[28px] xs:text-3xl sm:text-4xl md:text-5xl font-stardom font-normal text-foreground uppercase tracking-tight leading-tight">
          Select Interview Mode
        </h1>
        <p className="text-[13px] sm:text-sm md:text-base font-sans text-foreground/70 mt-2 sm:mt-3 max-w-lg mx-auto leading-relaxed">
          Choose whether to practice against a curated role profile or evaluate directly against your resume.
        </p>
      </motion.div>

      {/* Two-Pillar Monolithic Unfold Container */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 sm:gap-6 md:gap-8 w-full max-w-[420px] md:max-w-none mx-auto relative">
        {/* PILLAR 01: ROLE-BASED SCREENING */}
        <motion.div
          initial={false}
          animate={
            selectedMode === null
              ? { flex: isDesktop ? '1 1 50%' : '1 1 100%', width: '100%', opacity: 1 }
              : selectedMode === 'role'
              ? { flex: '1 1 100%', width: '100%', opacity: 1 }
              : { flex: '0 0 0%', width: '0%', opacity: 0 }
          }
          style={{
            overflow: selectedMode === 'resume' ? 'hidden' : 'visible',
            pointerEvents: selectedMode === 'resume' ? 'none' : 'auto',
          }}
          transition={unfoldTransition}
          className="w-full min-w-0 flex flex-col items-center"
        >
          {selectedMode === null ? (
            <ScreeningModeCard
              id="role"
              title="Role-Based Screening"
              subtitle="Mode 01"
              description="Practice for a specific role and interview profile."
              icon={Briefcase}
              isSelected={false}
              isDisabled={false}
              onSelect={() => handleCardClick('role')}
              className="w-full h-full"
            />
          ) : selectedMode === 'role' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: shouldReduceMotion ? 0 : 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {roleContent}
            </motion.div>
          ) : null}
        </motion.div>

        {/* PILLAR 02: RESUME-BASED SCREENING */}
        <motion.div
          initial={false}
          animate={
            selectedMode === null
              ? { flex: isDesktop ? '1 1 50%' : '1 1 100%', width: '100%', opacity: 1 }
              : selectedMode === 'resume'
              ? { flex: '1 1 100%', width: '100%', opacity: 1 }
              : { flex: '0 0 0%', width: '0%', opacity: 0 }
          }
          style={{
            overflow: selectedMode === 'role' ? 'hidden' : 'visible',
            pointerEvents: selectedMode === 'role' ? 'none' : 'auto',
          }}
          transition={unfoldTransition}
          className="w-full min-w-0 flex flex-col items-center"
        >
          {selectedMode === null ? (
            <ScreeningModeCard
              id="resume"
              title="Resume-Based Screening"
              subtitle="Mode 02"
              description="Let your resume drive the interview."
              icon={FileText}
              isSelected={false}
              isDisabled={false}
              onSelect={() => handleCardClick('resume')}
              className="w-full h-full"
            />
          ) : selectedMode === 'resume' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: shouldReduceMotion ? 0 : 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {resumeContent}
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

