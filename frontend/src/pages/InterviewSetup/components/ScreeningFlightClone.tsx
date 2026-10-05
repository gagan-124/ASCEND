import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Briefcase, FileText } from 'lucide-react';
import { Spotlight } from '@/components/ui/spotlight';

export interface ScreeningFlightCloneProps {
  id: 'role' | 'resume';
  originRect: DOMRect;
  onImpactPhase: () => void;
  onFlightComplete: () => void;
}

export const ScreeningFlightClone: React.FC<ScreeningFlightCloneProps> = ({
  id,
  originRect,
  onImpactPhase,
  onFlightComplete,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const hasNotifiedImpact = useRef(false);

  // Measure delta to center of screen for natural 3D flight trajectory
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const cardCenterX = originRect.left + originRect.width / 2;
  const cardCenterY = originRect.top + originRect.height / 2;

  const targetX = viewportWidth / 2 - cardCenterX;
  const targetY = viewportHeight / 2 - cardCenterY;

  const isRole = id === 'role';
  const title = isRole ? 'Role-Based Screening' : 'Resume-Based Screening';
  const subtitle = isRole ? 'Mode 01' : 'Mode 02';
  const description = isRole
    ? 'Practice for a specific role and interview profile.'
    : 'Let your resume drive the interview.';
  const Icon = isRole ? Briefcase : FileText;

  // Responsive scaling cap for smaller viewports (mobile/tablet)
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const maxZ = isMobile ? 380 : isTablet ? 550 : 720;
  const maxScale = isMobile ? 1.25 : isTablet ? 1.45 : 1.65;

  // Reduced Motion handling
  useEffect(() => {
    if (shouldReduceMotion) {
      onImpactPhase();
      const timer = setTimeout(() => {
        onFlightComplete();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [shouldReduceMotion, onImpactPhase, onFlightComplete]);

  // Handle timeline notifications
  useEffect(() => {
    if (shouldReduceMotion) return;

    // Trigger impact phase at ~1.65s (75% of 2.2s flight)
    const impactTimer = setTimeout(() => {
      if (!hasNotifiedImpact.current) {
        hasNotifiedImpact.current = true;
        onImpactPhase();
      }
    }, 1650);

    // Complete flight & unmount clone at 2.2s
    const completeTimer = setTimeout(() => {
      onFlightComplete();
    }, 2200);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(completeTimer);
    };
  }, [shouldReduceMotion, onImpactPhase, onFlightComplete]);

  if (shouldReduceMotion) {
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="p-8 bg-surface border border-border rounded-2xl max-w-md text-center shadow-2xl"
        >
          <h2 className="text-xl font-stardom text-foreground uppercase">{title}</h2>
        </motion.div>
      </div>
    );
  }

  // 3D Motion timeline values (0ms, 200ms, 700ms, 1100ms, 1450ms, 1650ms, 1900ms, 2200ms)
  const times = [0, 0.09, 0.32, 0.5, 0.66, 0.75, 0.86, 1.0];

  const zValues = [0, 35, 260, 460, maxZ * 0.88, maxZ, maxZ * 0.4, 0];
  const scaleValues = [1, 1.03, 1.1, 1.25, maxScale * 0.88, maxScale, 1.1, 1];
  const xValues = [
    0,
    targetX * 0.1,
    targetX * 0.45,
    targetX * 0.75,
    targetX * 0.95,
    targetX,
    targetX,
    targetX,
  ];
  const yValues = [
    0,
    targetY * 0.1,
    targetY * 0.45,
    targetY * 0.75,
    targetY * 0.95,
    targetY,
    targetY,
    targetY,
  ];

  // Asymmetric 3D rotational trajectory with clear edge-on tumbling beat at 1100ms (t=0.5)
  const rotateXValues = [0, 14, -35, -12, 16, -4, 0, 0];
  const rotateYValues = isRole
    ? [0, -12, 65, 88, 18, 3, 0, 0] // 88 deg edge-on for Left/Role card
    : [0, 12, -65, -88, -18, -3, 0, 0]; // -88 deg edge-on for Right/Resume card
  const rotateZValues = isRole
    ? [0, -4, 18, 8, -6, -1, 0, 0]
    : [0, 4, -18, -8, 6, 1, 0, 0];

  const opacityValues = [1, 1, 1, 1, 1, 1, 0.4, 0];

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      <motion.div
        initial={{
          top: originRect.top,
          left: originRect.left,
          width: originRect.width,
          height: originRect.height,
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1,
          opacity: 1,
        }}
        animate={{
          x: xValues,
          y: yValues,
          z: zValues,
          rotateX: rotateXValues,
          rotateY: rotateYValues,
          rotateZ: rotateZValues,
          scale: scaleValues,
          opacity: opacityValues,
        }}
        transition={{
          duration: 2.2,
          times: times,
          ease: ['easeInOut', 'easeOut', 'easeInOut', 'easeInOut', 'easeOut', 'easeIn', 'easeOut'],
        }}
        style={{
          position: 'fixed',
          top: originRect.top,
          left: originRect.left,
          width: originRect.width,
          height: originRect.height,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        className="rounded-2xl p-8 sm:p-10 text-left bg-surface/90 dark:bg-surface/80 backdrop-blur-md border border-foreground/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col justify-between"
      >
        {/* Spotlight & Inner Highlight */}
        <Spotlight size={320} className="from-accent/30 via-accent/15 to-transparent" />
        <div className="absolute inset-0 rounded-2xl border border-white/30 dark:border-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Card Header & Icon */}
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-xl bg-foreground/10 border border-border/60 flex items-center justify-center text-foreground">
              <Icon className="w-7 h-7 stroke-[1.75]" />
            </div>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-foreground/10 text-foreground font-semibold">
              {subtitle}
            </span>
          </div>

          {/* Card Body */}
          <div className="mt-6">
            <h2 className="text-xl sm:text-2xl font-stardom font-normal uppercase tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs sm:text-sm font-sans text-foreground/80 mt-2.5 leading-relaxed max-w-sm">
              {description}
            </p>
          </div>

          {/* Indicator */}
          <div className="mt-6 flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-foreground/80">
            <span>Launching Setup...</span>
            <span>→</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
