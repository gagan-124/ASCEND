import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, ShieldAlert, Zap, Layers, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInterviewStore } from '@/stores/interviewStore';

export interface DifficultySectionProps {
  onStartInterview: () => void;
  className?: string;
}

export const DifficultySection: React.FC<DifficultySectionProps> = ({
  onStartInterview,
  className,
}) => {
  const { setupConfig, setSetupConfig } = useInterviewStore();

  const difficultyLevels: Array<{
    id: 'Easy' | 'Medium' | 'Hard';
    label: string;
    description: string;
    icon: typeof Zap;
  }> = [
    {
      id: 'Easy',
      label: 'Easy · Foundational',
      description: 'Core concepts, standard syntax, and fundamental questions.',
      icon: Zap,
    },
    {
      id: 'Medium',
      label: 'Medium · Standard',
      description: 'Production scenarios, system tradeoffs, and algorithm challenges.',
      icon: Flame,
    },
    {
      id: 'Hard',
      label: 'Hard · Expert',
      description: 'Edge-case scenarios, high-concurrency debugging, and architectural deep-dives.',
      icon: ShieldAlert,
    },
  ];

  const experienceLevels: Array<'Entry' | 'Mid' | 'Senior' | 'Lead'> = [
    'Entry',
    'Mid',
    'Senior',
    'Lead',
  ];

  const focusAreas: Array<'Comprehensive' | 'Technical' | 'Behavioral'> = [
    'Comprehensive',
    'Technical',
    'Behavioral',
  ];

  const activeDifficulty = setupConfig.difficulty || 'Medium';
  const activeExperience = setupConfig.experienceLevel || 'Mid';
  const activeFocus = setupConfig.focusArea || 'Comprehensive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'w-full max-w-4xl mx-auto px-6 sm:px-8 py-8 sm:py-10 my-6 rounded-3xl select-none',
        'bg-[#050D18]/95 border border-[#F8F0E5]/12 backdrop-blur-md',
        'shadow-[0_24px_50px_rgba(0,0,0,0.65),inset_1px_1px_0_rgba(255,255,255,0.06),inset_-1px_-1px_0_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[#F8F0E5]/15 bg-[#0A1C33]/60 text-[#DAC0A3] inline-flex items-center gap-2 mb-3 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-[#DAC0A3]" />
          <span>STEP 04 · MATRIX CALIBRATION</span>
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-stardom text-[#F8F0E5] uppercase tracking-tight">
          SELECT INTERVIEW DIFFICULTY
        </h2>
        <p className="text-xs sm:text-sm font-sans text-[#F8F0E5]/70 mt-1.5 max-w-lg leading-relaxed">
          Calibrate question complexity, seniority depth, and evaluation focus area.
        </p>
      </div>

      {/* 1. Difficulty Level Selector (Horizontal Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {difficultyLevels.map((diff) => {
          const isSelected = activeDifficulty === diff.id;
          const Icon = diff.icon;

          return (
            <button
              key={diff.id}
              type="button"
              onClick={() => setSetupConfig({ difficulty: diff.id })}
              className={cn(
                'p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden',
                isSelected
                  ? 'bg-[#F8F0E5] border-[#F8F0E5] text-[#102C57] shadow-[0_10px_25px_rgba(248,240,229,0.25)]'
                  : 'bg-[#0A1C33]/50 border-[#F8F0E5]/12 hover:border-[#F8F0E5]/30 hover:bg-[#0A1C33]/80 text-[#F8F0E5] shadow-xs'
              )}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span
                  className={cn(
                    'font-mono text-xs font-bold uppercase tracking-wider',
                    isSelected ? 'text-[#102C57]' : 'text-[#F8F0E5]'
                  )}
                >
                  {diff.label}
                </span>
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200',
                    isSelected
                      ? 'bg-[#102C57]/10 text-[#102C57]'
                      : 'bg-[#F8F0E5]/10 text-[#DAC0A3] group-hover:scale-105'
                  )}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>

              <p
                className={cn(
                  'text-xs font-sans leading-relaxed',
                  isSelected ? 'text-[#102C57]/85 font-medium' : 'text-[#F8F0E5]/70'
                )}
              >
                {diff.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* 2. Seniority & Focus Sub-selectors (Two-Column Desktop Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#F8F0E5]/12 mb-8">
        {/* EXPERIENCE LEVEL — VERTICAL SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#F8F0E5]/70 block mb-1">
            EXPERIENCE LEVEL
          </span>
          <div className="flex flex-col gap-2">
            {experienceLevels.map((exp) => {
              const isSelected = activeExperience === exp;
              return (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setSetupConfig({ experienceLevel: exp })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xs',
                    isSelected
                      ? 'bg-[#F8F0E5] text-[#102C57] border-[#F8F0E5] shadow-md'
                      : 'bg-[#0A1C33]/50 text-[#F8F0E5]/80 border-[#F8F0E5]/12 hover:bg-[#0A1C33] hover:border-[#F8F0E5]/30'
                  )}
                >
                  <span>{exp}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#102C57] stroke-[3]" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[#F8F0E5]/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* EVALUATION FOCUS — VERTICAL SELECTOR */}
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#F8F0E5]/70 block mb-1">
            EVALUATION FOCUS
          </span>
          <div className="flex flex-col gap-2">
            {focusAreas.map((focus) => {
              const isSelected = activeFocus === focus;
              return (
                <button
                  key={focus}
                  type="button"
                  onClick={() => setSetupConfig({ focusArea: focus })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xs',
                    isSelected
                      ? 'bg-[#F8F0E5] text-[#102C57] border-[#F8F0E5] shadow-md'
                      : 'bg-[#0A1C33]/50 text-[#F8F0E5]/80 border-[#F8F0E5]/12 hover:bg-[#0A1C33] hover:border-[#F8F0E5]/30'
                  )}
                >
                  <span>{focus}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#102C57] stroke-[3]" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-[#F8F0E5]/20" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Final Action CTA: START INTERVIEW SESSION */}
      <div className="flex flex-col items-center pt-2">
        <button
          type="button"
          onClick={onStartInterview}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#F8F0E5] text-[#102C57] font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.2em] hover:bg-white active:scale-[0.99] transition-all shadow-[0_12px_30px_rgba(248,240,229,0.2)] flex items-center justify-center gap-3 group cursor-pointer"
        >
          <span>START INTERVIEW SESSION →</span>
          <ArrowRight className="w-4 h-4 text-[#102C57] transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
