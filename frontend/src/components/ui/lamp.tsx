import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LampContainerProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: number; // 0.05 to 1.0
  angle?: number; // rotation in degrees for lamp sway
}

/**
 * LampContainer
 * Authoritative ASCEND warm lamp lighting engine primitive.
 * Features:
 * - Adapted conic & radial gradients using ASCEND warm palette (#F4D7A1, #FBBF24, #D97706)
 * - Zero cyan color system
 * - Soft, borderless diffused falloff (no hard trapezoid edge)
 * - Sways in 100% sync with hanging lamp rotation angle
 * - Non-intrusive layout (does not force full-screen flex or push login card around)
 */
export const LampContainer: React.FC<LampContainerProps> = ({
  children,
  className,
  intensity = 1.0,
  angle = 0,
}) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-start overflow-hidden w-full pointer-events-none select-none z-10',
        className
      )}
    >
      {/* SWAYING LIGHTING ENGINE (Attached to Bulb origin, sways with angle) */}
      <div
        className="relative flex w-full items-center justify-center isolate z-10 transition-transform duration-75"
        style={{
          transformOrigin: 'top center',
          transform: `rotate(${angle}deg)`,
        }}
      >
        {/* Left Conic Gradient Beam */}
        <motion.div
          initial={{ opacity: 0.3, width: '14rem' }}
          animate={{ opacity: 0.75 * intensity, width: `${24 * Math.max(0.35, intensity)}rem` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-amber-300/40 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-[#050811] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-[#050811] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Right Conic Gradient Beam */}
        <motion.div
          initial={{ opacity: 0.3, width: '14rem' }}
          animate={{ opacity: 0.75 * intensity, width: `${24 * Math.max(0.35, intensity)}rem` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-amber-300/40 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-[#050811] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-[#050811] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* Soft Ambient Warm Blur Layers */}
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-125 bg-[#050811] blur-2xl" />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />

        {/* Soft Warm Radial Glow Core */}
        <div
          className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-amber-400/25 blur-3xl transition-opacity duration-150"
          style={{ opacity: intensity }}
        />
        <motion.div
          initial={{ width: '8rem' }}
          animate={{ width: `${18 * Math.max(0.35, intensity)}rem` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-yellow-200/40 blur-2xl transition-opacity duration-150"
          style={{ opacity: intensity }}
        />
        <motion.div
          initial={{ width: '14rem' }}
          animate={{ width: `${28 * Math.max(0.35, intensity)}rem` }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute inset-auto z-50 h-0.5 w-[28rem] -translate-y-[7rem] bg-amber-200/80 transition-opacity duration-150"
          style={{ opacity: intensity }}
        />

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-[#050811]" />
      </div>

      {/* Children Content Layer */}
      {children && (
        <div className="relative z-50 flex flex-col items-center px-4 pointer-events-auto w-full">
          {children}
        </div>
      )}
    </div>
  );
};
