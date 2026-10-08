import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { HangingLamp } from '@/features/auth/components/HangingLamp';
import { LampContainer } from '@/components/ui/lamp';
import { cn } from '@/lib/utils';

export interface AuthPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AuthPageContainer
 * Dark room illuminated by a top-center hanging lamp and LampContainer primitive engine.
 * Features:
 * - Uses /components/ui/lamp.tsx LampContainer adapted for ASCEND (warm cream/amber palette, 0 cyan)
 * - LampContainer light engine sways in 100% sync with the hanging lamp
 * - Restrained 4-flicker electrical bulb startup
 * - Card surface illumination & content reveal scales smoothly with light intensity
 * - Full prefers-reduced-motion fallback
 */
export const AuthPageContainer: React.FC<AuthPageContainerProps> = ({ children, className }) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Light intensity state (0.05 = dim baseline, 1.0 = full warm illumination)
  const [lightIntensity, setLightIntensity] = useState(0.05);
  const [isInteractive, setIsInteractive] = useState(false);

  // Physics swing refs & state
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const [displayAngle, setDisplayAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastMouseXRef = useRef<number | null>(null);

  // 1. RESTRAINED FOUR FLICKERS TIMELINE (~1.85s total duration)
  useEffect(() => {
    if (shouldReduceMotion) {
      setLightIntensity(1.0);
      setIsInteractive(true);
      return;
    }

    const FLICKER_TIMELINE = [
      { time: 350, intensity: 0.25 },  // Flicker 1: subtle initial bulb warmth
      { time: 480, intensity: 0.12 },  // dip
      { time: 700, intensity: 0.45 },  // Flicker 2: moderate warmth
      { time: 840, intensity: 0.20 },  // dip
      { time: 1050, intensity: 0.65 }, // Flicker 3: stronger glow
      { time: 1200, intensity: 0.35 }, // dip
      { time: 1450, intensity: 0.82 }, // Flicker 4: near-full illumination
      { time: 1620, intensity: 0.60 }, // dip
      { time: 1850, intensity: 1.0, isFinal: true }, // FULL ON permanently
    ];

    const timers: NodeJS.Timeout[] = [];

    FLICKER_TIMELINE.forEach((step) => {
      const t = setTimeout(() => {
        setLightIntensity(step.intensity);
        if (step.isFinal) {
          setIsInteractive(true);
        }
      }, step.time);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [shouldReduceMotion]);

  // 2. DAMPED PHYSICAL LAMP SWING SIMULATION
  const updatePhysics = useCallback(() => {
    if (shouldReduceMotion) return;

    const stiffness = 0.07;
    const damping = 0.935;

    const accel = -stiffness * angleRef.current;
    velocityRef.current = (velocityRef.current + accel) * damping;
    angleRef.current += velocityRef.current;

    angleRef.current = Math.max(-10, Math.min(10, angleRef.current));

    setDisplayAngle(angleRef.current);

    if (Math.abs(angleRef.current) > 0.015 || Math.abs(velocityRef.current) > 0.015) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    } else {
      angleRef.current = 0;
      velocityRef.current = 0;
      setDisplayAngle(0);
      animFrameRef.current = null;
    }
  }, [shouldReduceMotion]);

  const triggerImpulse = useCallback(
    (impulse: number) => {
      if (shouldReduceMotion) return;
      velocityRef.current += impulse;
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(updatePhysics);
      }
    },
    [updatePhysics, shouldReduceMotion]
  );

  const handleLampClick = useCallback(() => {
    if (!isInteractive) return;
    const direction = Math.random() > 0.5 ? 1 : -1;
    triggerImpulse(direction * 8.5);
  }, [isInteractive, triggerImpulse]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isInteractive || shouldReduceMotion) return;
      if (lastMouseXRef.current !== null) {
        const deltaX = e.clientX - lastMouseXRef.current;
        if (Math.abs(deltaX) > 2) {
          const impulse = (deltaX > 0 ? 1 : -1) * Math.min(0.35, Math.abs(deltaX) * 0.015);
          triggerImpulse(impulse);
        }
      }
      lastMouseXRef.current = e.clientX;
    },
    [isInteractive, shouldReduceMotion, triggerImpulse]
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative min-h-screen w-full bg-[#050811] text-foreground flex flex-col items-center justify-start overflow-x-hidden select-none',
        className
      )}
    >
      {/* Top Ceiling & Hanging Lamp */}
      <div className="w-full flex flex-col items-center z-40 pt-0 relative pointer-events-auto">
        <HangingLamp
          lightIntensity={lightIntensity}
          angle={displayAngle}
          isInteractive={isInteractive}
          onClick={handleLampClick}
        />
      </div>

      {/* LAMP CONTAINER LIGHTING ENGINE (Positioned primitive lighting layer) */}
      <div className="w-full absolute top-[110px] left-0 z-20 pointer-events-none">
        <LampContainer intensity={lightIntensity} angle={displayAngle} />
      </div>

      {/* MAIN LOGIN WINDOW CONTAINER */}
      <main className="w-full max-w-[1360px] mx-auto px-4 py-3 sm:py-6 flex-1 flex flex-col items-center justify-center z-30 relative pointer-events-auto">
        {/* LOGIN CARD WITH DYNAMIC ILLUMINATION */}
        <div
          className="w-full max-w-[480px] relative transition-all duration-150 ease-out rounded-2xl"
          style={{
            opacity: 0.35 + 0.65 * lightIntensity,
            filter: `brightness(${0.35 + 0.65 * lightIntensity}) contrast(${0.7 + 0.3 * lightIntensity})`,
          }}
        >
          {/* Warm Front Illumination Overlay on Card Surface */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-30 transition-opacity duration-150"
            style={{
              opacity: lightIntensity,
              background: `linear-gradient(
                180deg,
                rgba(254, 243, 199, 0.12) 0%,
                rgba(251, 191, 36, 0.03) 45%,
                transparent 100%
              )`,
              borderTop: `1px solid rgba(254, 243, 199, ${0.4 * lightIntensity})`,
              boxShadow: `0 16px 48px rgba(0, 0, 0, 0.85), 0 0 ${24 * lightIntensity}px rgba(251, 191, 36, ${0.14 * lightIntensity})`,
            }}
          />
          {children}
        </div>
      </main>
    </div>
  );
};
