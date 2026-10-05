import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { INTERVIEW_ROLES, type InterviewRole } from '../data/roles';
import { RoleSpotlightCard, FIELD_GLOW } from './RoleSpotlightCard';
import { ChevronLeft, ChevronRight, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

export interface RoleCarouselProps {
  selectedFieldId: string;
  selectedRoleId?: string | null;
  roleConfirmed?: boolean;
  onConfirmRole: (role: InterviewRole) => void;
  onChangeRole: () => void;
  className?: string;
}

export const RoleCarousel: React.FC<RoleCarouselProps> = ({
  selectedFieldId,
  selectedRoleId,
  roleConfirmed = false,
  onConfirmRole,
  onChangeRole,
  className,
}) => {
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark';

  // Filter roles exclusively for the selected technical field
  const fieldRoles = INTERVIEW_ROLES.filter((r) => r.fieldId === selectedFieldId);

  // Active role index state
  const [activeIndex, setActiveIndex] = useState(() => {
    if (selectedRoleId) {
      const foundIdx = fieldRoles.findIndex((r) => r.id === selectedRoleId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Reset active index when selected field changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedFieldId]);

  const rolesCount = fieldRoles.length;
  const activeRole = fieldRoles[activeIndex] || fieldRoles[0];
  const fieldGlow = FIELD_GLOW[selectedFieldId] || { color: '#DAC0A3', rgb: '218, 192, 163' };

  const handleNext = useCallback(() => {
    if (roleConfirmed || rolesCount === 0) return;
    setActiveIndex((prev) => (prev + 1) % rolesCount);
  }, [roleConfirmed, rolesCount]);

  const handlePrev = useCallback(() => {
    if (roleConfirmed || rolesCount === 0) return;
    setActiveIndex((prev) => (prev - 1 + rolesCount) % rolesCount);
  }, [roleConfirmed, rolesCount]);

  // Keyboard navigation support (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (roleConfirmed) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, roleConfirmed]);

  // Touch & Pointer drag support
  const handlePointerDown = (e: React.PointerEvent) => {
    if (roleConfirmed) return;
    setDragStartX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (roleConfirmed || dragStartX === null) return;
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

  if (!fieldRoles || fieldRoles.length === 0) {
    return (
      <div className="w-full text-center py-10 text-foreground/60 font-sans">
        No interview profiles configured for this field.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-center select-none', className)}
    >
      {/* Active Selection Info Bar */}
      <div className="w-full flex items-center justify-center sm:justify-start mb-4 px-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground/60">
            PROFILE SELECTION:
          </span>
          <span
            style={{
              borderColor: `rgba(${fieldGlow.rgb}, 0.4)`,
              backgroundColor: `rgba(${fieldGlow.rgb}, 0.12)`,
              color: fieldGlow.color,
            }}
            className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border transition-colors"
          >
            {activeRole?.title}
          </span>
        </div>
      </div>

      {/* Spotlight Carousel Stage - Height tailored for portrait cards */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative w-full h-[450px] sm:h-[485px] md:h-[500px] flex items-center justify-center overflow-visible my-3 touch-pan-y"
      >
        {/* 3D Perspective Card Deck */}
        <div className="relative w-full h-full flex items-center justify-center perspective-[1000px] z-10">
          {fieldRoles.map((role, index) => {
            // Calculate signed distance offset relative to activeIndex
            let offset = index - activeIndex;
            // Loop wrap-around offset logic
            if (offset > rolesCount / 2) offset -= rolesCount;
            if (offset < -rolesCount / 2) offset += rolesCount;

            // Render active center card and adjacent (-2 to +2) cards
            if (Math.abs(offset) > 2) return null;

            return (
              <RoleSpotlightCard
                key={role.id}
                role={role}
                isActive={index === activeIndex}
                offset={offset}
                onClick={() => {
                  if (!roleConfirmed) {
                    setActiveIndex(index);
                  }
                }}
              />
            );
          })}
        </div>

        {/* Tactile Neumorphic Navigation Control Buttons */}
        {!roleConfirmed && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Role Profile"
              className={cn(
                'absolute left-1 sm:left-2 md:left-6 z-40 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer',
                'backdrop-blur-md transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0.5 active:scale-[0.97]',
                isDark
                  ? 'bg-[#0A121D]/92 border border-[#F8F0E5]/12 text-[#F8F0E5] shadow-[8px_8px_18px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.025),inset_1px_1px_0_rgba(255,255,255,0.06)]'
                  : 'bg-[#F8F0E5]/95 border border-[#DAC0A3] text-[#102C57] shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_12px_rgba(16,44,87,0.15)]'
              )}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Role Profile"
              className={cn(
                'absolute right-1 sm:right-2 md:right-6 z-40 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer',
                'backdrop-blur-md transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:translate-y-0.5 active:scale-[0.97]',
                isDark
                  ? 'bg-[#0A121D]/92 border border-[#F8F0E5]/12 text-[#F8F0E5] shadow-[8px_8px_18px_rgba(0,0,0,0.5),-4px_-4px_10px_rgba(255,255,255,0.025),inset_1px_1px_0_rgba(255,255,255,0.06)]'
                  : 'bg-[#F8F0E5]/95 border border-[#DAC0A3] text-[#102C57] shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_12px_rgba(16,44,87,0.15)]'
              )}
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dot Indicators */}
      <div className="flex items-center gap-2 my-5">
        {fieldRoles.map((role, idx) => (
          <button
            key={role.id}
            type="button"
            onClick={() => {
              if (!roleConfirmed) setActiveIndex(idx);
            }}
            aria-label={`Go to ${role.title}`}
            className={cn(
              'h-2 rounded-full transition-all duration-300 cursor-pointer',
              idx === activeIndex
                ? 'w-8 bg-primary'
                : 'w-2 bg-foreground/20 hover:bg-foreground/40'
            )}
          />
        ))}
      </div>

      {/* Confirmation Control Banner */}
      <div className="w-full max-w-xl flex flex-col items-center text-center mt-2">
        {!roleConfirmed ? (
          <motion.button
            type="button"
            onClick={() => onConfirmRole(activeRole)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-foreground text-background font-mono text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg group cursor-pointer"
          >
            <span>CONFIRM ROLE: {activeRole.title} →</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col sm:flex-row items-center gap-4 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed Profile: {activeRole.title}</span>
            </div>

            <button
              type="button"
              onClick={onChangeRole}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-wider text-foreground/80 hover:text-foreground transition-colors px-3 py-1 rounded-lg border border-border/60 bg-surface hover:bg-surface-muted cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Role</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
