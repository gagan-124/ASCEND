import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { HERO_ROLES } from './rolesData';
import { RoleTextMaskSlide } from './RoleTextMaskSlide';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RoleSlideshowProps {
  className?: string;
  autoplayIntervalMs?: number;
}

export const RoleSlideshow: React.FC<RoleSlideshowProps> = ({
  className,
  autoplayIntervalMs = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = HERO_ROLES.length;
  const currentRole = HERO_ROLES[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Temporary pause on manual interaction (resumes after ~6 seconds)
  const notifyInteraction = useCallback(() => {
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 6000);
  }, []);

  // Autoplay loop respecting reduced motion and manual interaction state
  useEffect(() => {
    if (shouldReduceMotion || isUserInteracting) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoplayIntervalMs);

    return () => clearInterval(timer);
  }, [shouldReduceMotion, isUserInteracting, autoplayIntervalMs, handleNext]);

  // Cleanup interaction timer on unmount
  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation within focused slideshow
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      notifyInteraction();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      notifyInteraction();
      handleNext();
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="ASCEND Prepared Engineering Roles Framed Artwork Slideshow"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={notifyInteraction}
      className={cn(
        'relative w-full flex flex-col justify-center focus-visible:outline-none select-none',
        className
      )}
    >
      {/* Black Outer Artwork Canvas — borderless seamless black visual field */}
      <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[540px] 2xl:h-[600px] bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <RoleTextMaskSlide
            key={currentRole.id}
            role={currentRole}
          />
        </AnimatePresence>
      </div>

      {/* Editorial Metadata Annotations & Navigation Controls */}
      <div className="mt-3 flex items-center justify-between gap-4 select-none text-[10px] sm:text-xs font-mono uppercase tracking-widest text-foreground/50">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
          <span className="text-foreground/70 font-medium">PERSPECTIVE // {currentRole.role}</span>
          <span className="hidden sm:inline text-foreground/30">•</span>
          <span className="hidden sm:inline text-foreground/40">0{currentIndex + 1} / 0{totalSlides}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              notifyInteraction();
              handlePrev();
            }}
            aria-label="Previous role artwork slide"
            className="w-8 h-8 rounded-full border border-border/40 hover:border-foreground/40 bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              notifyInteraction();
              handleNext();
            }}
            aria-label="Next role artwork slide"
            className="w-8 h-8 rounded-full border border-border/40 hover:border-foreground/40 bg-foreground/5 hover:bg-foreground/10 text-foreground flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
