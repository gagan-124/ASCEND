import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AnimationPhase =
  | 'INITIAL'          // 0–350ms: Compact double-arrow centered in viewport
  | 'ARROWS_SPLIT'     // 350–900ms: Left arrow moves left, right arrow moves right
  | 'WORDMARK_REVEAL'  // 650–1200ms: ASCEND emerges through the expanding aperture
  | 'FINAL_LOCKUP'     // 1200–1700ms: Resolves into [DOUBLE-ARROW] ASCEND lockup
  | 'HOLD_AND_TRANSITION'; // 1700–2100ms: Brief hold, signals completion

export interface OpeningAnimationProps {
  onComplete?: () => void;
  className?: string;
  layoutId?: string;
  forcePhase?: AnimationPhase;
}

/**
 * Refined cinematic easing curve specified in the ASCEND design constitution.
 * Controlled acceleration and deceleration with zero bounce and zero overshoot.
 */
const CINEMATIC_EASE = [0.65, 0, 0.35, 1] as const;

/**
 * Authoritative SVG paths for Left and Right Arrow elements.
 * Triangle: viewBox 0 0 36 144, path centered vertically.
 * Chevron:  viewBox 0 0 72 144, path from y=0 to y=144.
 */
const ARROW_PATHS = {
  leftArrow: 'M 0 36 L 36 72 L 0 108 Z',
  rightArrow: 'M 0 0 L 72 72 L 0 144 L 0 108 L 36 72 L 0 36 Z',
} as const;

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({
  onComplete,
  className,
  layoutId,
  forcePhase,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<AnimationPhase>(() =>
    shouldReduceMotion ? 'HOLD_AND_TRANSITION' : 'INITIAL'
  );

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const activePhase = forcePhase || phase;

  useEffect(() => {
    if (forcePhase) return;

    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 300);
      return () => clearTimeout(timer);
    }

    const timers: NodeJS.Timeout[] = [];

    // Phase 2: Arrows Split (350ms)
    timers.push(
      setTimeout(() => {
        setPhase('ARROWS_SPLIT');
      }, 350)
    );

    // Phase 3: Wordmark Reveal via expanding aperture (650ms)
    timers.push(
      setTimeout(() => {
        setPhase('WORDMARK_REVEAL');
      }, 650)
    );

    // Phase 4: Final Lockup resolution (1200ms)
    timers.push(
      setTimeout(() => {
        setPhase('FINAL_LOCKUP');
      }, 1200)
    );

    // Phase 5: Hold & Transition trigger (1700ms)
    timers.push(
      setTimeout(() => {
        setPhase('HOLD_AND_TRANSITION');
      }, 1700)
    );

    // Complete callback (2100ms)
    timers.push(
      setTimeout(() => {
        handleComplete();
      }, 2100)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [shouldReduceMotion, handleComplete, forcePhase]);

  // Geometric layout parameters (in screen px)
  // Distance between centers of triangle (14px wide) and chevron (28px wide) when forming compact mark
  const arrowSpacing = 8;

  // Split displacement: moves arrows wide enough to frame "ASCEND" (width ~174px) with elegant clearance
  const splitDistance = 120;

  // Horizontal position for final lockup: [DOUBLE-ARROW] + ASCEND centered as a unified group
  const lockupCenterSymbol = -96;
  const lockupCenterWordmark = 28;

  const isSplitOrReveal = activePhase === 'ARROWS_SPLIT' || activePhase === 'WORDMARK_REVEAL';
  const isLockup = activePhase === 'FINAL_LOCKUP' || activePhase === 'HOLD_AND_TRANSITION';

  // Left arrow X position
  const leftArrowX = isLockup
    ? lockupCenterSymbol - arrowSpacing
    : isSplitOrReveal
    ? -splitDistance
    : -arrowSpacing;

  // Right arrow X position
  const rightArrowX = isLockup
    ? lockupCenterSymbol + arrowSpacing
    : isSplitOrReveal
    ? splitDistance
    : arrowSpacing;

  // Wordmark X position and aperture clip
  const wordmarkX = isLockup ? lockupCenterWordmark : 0;
  const isWordmarkVisible = activePhase === 'WORDMARK_REVEAL' || isLockup;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none w-full max-w-4xl h-44 sm:h-56 md:h-64 py-4 overflow-hidden',
        className
      )}
      role="img"
      aria-label="ASCEND — AI Career & Interview Intelligence"
    >
      <motion.div
        layoutId={layoutId}
        className="relative flex items-center justify-center w-full h-full scale-[1.3] sm:scale-[1.45] md:scale-[1.65] origin-center transform-gpu"
      >
        {/* Left Arrow Component (Triangular Head) */}
        <motion.div
          animate={{ x: leftArrowX }}
          transition={{
            duration: isLockup ? 0.5 : 0.55,
            ease: CINEMATIC_EASE,
          }}
          className="absolute z-20 flex items-center justify-center pointer-events-none"
        >
          <svg
            viewBox="0 0 36 144"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 sm:h-12 md:h-14 w-auto aspect-[36/144] shrink-0 text-foreground"
            aria-hidden="true"
          >
            <path d={ARROW_PATHS.leftArrow} />
          </svg>
        </motion.div>

        {/* Right Arrow Component (45° Chevron) */}
        <motion.div
          animate={{ x: rightArrowX }}
          transition={{
            duration: isLockup ? 0.5 : 0.55,
            ease: CINEMATIC_EASE,
          }}
          className="absolute z-20 flex items-center justify-center pointer-events-none"
        >
          <svg
            viewBox="0 0 72 144"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 sm:h-12 md:h-14 w-auto aspect-[72/144] shrink-0 text-foreground"
            aria-hidden="true"
          >
            <path d={ARROW_PATHS.rightArrow} />
          </svg>
        </motion.div>

        {/* Wordmark revealed through expanding aperture */}
        <motion.div
          initial={{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }}
          animate={{
            x: wordmarkX,
            clipPath: isWordmarkVisible ? 'inset(0 0% 0 0%)' : 'inset(0 50% 0 50%)',
            opacity: isWordmarkVisible ? 1 : 0,
          }}
          transition={{
            x: { duration: 0.5, ease: CINEMATIC_EASE },
            clipPath: { duration: 0.55, ease: CINEMATIC_EASE },
            opacity: { duration: 0.35, ease: 'easeOut' },
          }}
          className="absolute z-10 flex items-center justify-center font-stardom font-semibold uppercase tracking-[0.14em] text-2xl sm:text-3xl md:text-4xl text-foreground whitespace-nowrap leading-none pointer-events-none"
        >
          ASCEND
        </motion.div>
      </motion.div>
    </div>
  );
};
