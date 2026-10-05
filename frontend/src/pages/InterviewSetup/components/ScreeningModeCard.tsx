import React, { useRef, useCallback } from 'react';
import { motion, useSpring, useReducedMotion } from 'framer-motion';
import { Spotlight } from '@/components/ui/spotlight';
import { cn } from '@/lib/utils';

export interface ScreeningModeCardProps {
  id: 'role' | 'resume';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (id: 'role' | 'resume', rect?: DOMRect) => void;
  className?: string;
}

export const ScreeningModeCard: React.FC<ScreeningModeCardProps> = ({
  id,
  title,
  subtitle,
  description,
  icon: Icon,
  isSelected,
  isDisabled,
  onSelect,
  className,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Controlled 3D pointer tilt springs (3–5 degrees max tilt)
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);

  // Scale spring for subtle tactile hover response
  const scale = useSpring(1, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || isDisabled || isSelected || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
      const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

      // Max tilt bounded to 4 degrees for restrained, subtle feel
      rotateY.set(relativeX * 8);
      rotateX.set(-relativeY * 8);
    },
    [rotateX, rotateY, shouldReduceMotion, isDisabled, isSelected]
  );

  const handleMouseEnter = useCallback(() => {
    if (shouldReduceMotion || isDisabled || isSelected) return;
    scale.set(1.02);
  }, [scale, shouldReduceMotion, isDisabled, isSelected]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }, [rotateX, rotateY, scale]);

  const handleClick = () => {
    if (!isDisabled && !isSelected) {
      const rect = cardRef.current?.getBoundingClientRect();
      onSelect(id, rect);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && !isSelected) {
      e.preventDefault();
      const rect = cardRef.current?.getBoundingClientRect();
      onSelect(id, rect);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isDisabled || isSelected ? -1 : 0}
      role="button"
      aria-selected={isSelected}
      aria-label={`${title}: ${description}`}
      style={
        shouldReduceMotion || isDisabled || isSelected
          ? undefined
          : {
              rotateX,
              rotateY,
              scale,
              transformPerspective: 1000,
            }
      }
      className={cn(
        'relative group overflow-hidden rounded-2xl p-5 sm:p-8 md:p-10 cursor-pointer select-none text-left transition-all duration-300 w-full',
        // Glass-neumorphic surface aesthetics
        'bg-surface/80 dark:bg-surface/60 backdrop-blur-md border border-border/40',
        'shadow-[0_8px_30px_rgba(16,44,87,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]',
        'hover:border-foreground/30 hover:shadow-[0_12px_40px_rgba(16,44,87,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
        isSelected && 'ring-2 ring-foreground border-foreground bg-surface',
        isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {/* Local Spotlight Effect */}
      {!isDisabled && <Spotlight size={280} className="from-accent/25 via-accent/10 to-transparent" />}

      {/* Subtle Inner Highlight Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/20 dark:border-white/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[190px] sm:min-h-[240px] md:min-h-[260px]">
        {/* Card Header & Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-foreground/5 dark:bg-foreground/10 border border-border/40 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform duration-300">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/70 font-semibold">
            {subtitle}
          </span>
        </div>

        {/* Card Body */}
        <div className="mt-5 sm:mt-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-stardom font-normal uppercase tracking-tight text-foreground group-hover:text-foreground transition-colors">
            {title}
          </h2>
          <p className="text-[13px] sm:text-sm font-sans text-foreground/70 mt-2 sm:mt-2.5 leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        {/* Tactile Arrow Indicator */}
        <div className="mt-4 sm:mt-6 flex items-center gap-2.5 text-xs font-mono font-medium uppercase tracking-wider text-foreground/60 group-hover:text-foreground transition-colors">
          <span>Select Mode</span>
          <div className="w-7 h-7 rounded-lg bg-surface/80 dark:bg-surface/50 border border-border/60 shadow-[0_2px_6px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4)] flex items-center justify-center text-foreground group-hover:-translate-y-0.5 group-active:translate-y-0.5 transition-all duration-200">
            <span className={cn(
              "text-xs font-bold transition-transform duration-200",
              id === 'role' ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
            )}>
              {id === 'role' ? '←' : '→'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
