import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RoleSlideConfig } from './rolesData';
import { cn } from '@/lib/utils';

export interface RoleSlideProps {
  role: RoleSlideConfig;
  className?: string;
}

export const RoleTextMaskSlide: React.FC<RoleSlideProps> = ({
  role,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const scale = role.artwork?.scale || 0.98;
  const position = role.artwork?.position || 'center';

  return (
    <motion.div
      key={role.id}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className={cn('relative w-full h-full flex items-center justify-center select-none overflow-hidden bg-black p-2 sm:p-3 md:p-4', className)}
      role="group"
      aria-roledescription="slide"
      aria-label={`Role slide: ${role.role}`}
    >
      {/* Screen-reader accessible label */}
      <h2 className="sr-only">{role.role} — {role.description}</h2>

      {/* Direct prepared PNG artwork rendering inside black frame — strictly contain, never cover */}
      <img
        src={role.image}
        alt={role.role}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-300"
        style={{
          objectFit: 'contain',
          objectPosition: position,
          transform: `scale(${scale})`,
        }}
        loading="eager"
        decoding="async"
      />
    </motion.div>
  );
};
