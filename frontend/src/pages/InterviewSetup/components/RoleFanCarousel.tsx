import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HERO_ROLES, type RoleSlideConfig } from '@/pages/Landing/components/Hero/rolesData';
import { RoleCard } from './RoleCard';
import { ChevronLeft, ChevronRight, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RoleFanCarouselProps {
  onSelectRole: (role: RoleSlideConfig) => void;
  onBack: () => void;
  className?: string;
}

export const RoleFanCarousel: React.FC<RoleFanCarouselProps> = ({
  onSelectRole,
  onBack,
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to SOFTWARE ENGINEER (index 1)
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const rolesCount = HERO_ROLES.length;
  const activeRole = HERO_ROLES[activeIndex];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % rolesCount);
  }, [rolesCount]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + rolesCount) % rolesCount);
  }, [rolesCount]);

  // Keyboard navigation support (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch & Mouse Drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX === null) return;
    const diffX = e.clientX - dragStartX;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setDragStartX(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center select-none', className)}
    >
      {/* Top Header & Navigation Bar */}
      <div className="w-full flex items-center justify-between mb-8 sm:mb-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-foreground/70 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/40 hover:border-border hover:bg-surface-muted cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Change Mode</span>
        </button>

        <div className="text-center">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-foreground/60 block">
            Role Selection
          </span>
          <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
            Choose Target Profile
          </h2>
        </div>

        <div className="w-24 sm:w-28 text-right font-mono text-xs text-foreground/50">
          {activeIndex + 1} / {rolesCount}
        </div>
      </div>

      {/* Fan Deck Carousel Stage Container */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative w-full h-[320px] sm:h-[370px] flex items-center justify-center overflow-visible my-4 touch-pan-y"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {HERO_ROLES.map((role, index) => {
            // Calculate signed distance offset relative to activeIndex
            let offset = index - activeIndex;
            // Wrap around offset logic for continuous loop
            if (offset > rolesCount / 2) offset -= rolesCount;
            if (offset < -rolesCount / 2) offset += rolesCount;

            // Only render cards within visual range (-2 to +2)
            if (Math.abs(offset) > 2) return null;

            return (
              <RoleCard
                key={role.id}
                role={role}
                isActive={index === activeIndex}
                offset={offset}
                onClick={() => setActiveIndex(index)}
              />
            );
          })}
        </div>

        {/* Previous & Next Control Buttons */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Role Profile"
          className="absolute left-2 sm:left-6 z-40 w-11 h-11 rounded-full bg-surface/90 border border-border/60 hover:border-foreground text-foreground flex items-center justify-center shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Role Profile"
          className="absolute right-2 sm:right-6 z-40 w-11 h-11 rounded-full bg-surface/90 border border-border/60 hover:border-foreground text-foreground flex items-center justify-center shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center gap-2 my-6">
        {HERO_ROLES.map((role, idx) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to ${role.role}`}
            className={cn(
              'h-2 rounded-full transition-all duration-300 cursor-pointer',
              idx === activeIndex
                ? 'w-8 bg-foreground'
                : 'w-2 bg-foreground/20 hover:bg-foreground/40'
            )}
          />
        ))}
      </div>

      {/* Selected Role Summary & Primary Action CTA */}
      <div className="w-full max-w-xl flex flex-col items-center text-center mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-1 mb-6"
          >
            <span className="font-mono text-xs text-foreground/60 uppercase tracking-widest font-semibold">
              Selected Profile
            </span>
            <h3 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
              {activeRole.role}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-foreground/70 max-w-md">
              {activeRole.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => onSelectRole(activeRole)}
          className={cn(
            'w-full max-w-md h-12 sm:h-13 rounded-xl font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-background bg-foreground',
            'shadow-[0_8px_20px_rgba(16,44,87,0.2)] hover:opacity-95 active:scale-[0.99] transition-all duration-150',
            'flex items-center justify-center gap-2.5 cursor-pointer'
          )}
        >
          <span>START ROLE INTERVIEW</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
