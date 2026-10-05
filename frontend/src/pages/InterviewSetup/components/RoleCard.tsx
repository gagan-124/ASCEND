import React from 'react';
import { motion } from 'framer-motion';
import type { RoleSlideConfig } from '@/pages/Landing/components/Hero/rolesData';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface RoleCardProps {
  role: RoleSlideConfig;
  isActive: boolean;
  offset: number; // Index relative to active index: -2, -1, 0, 1, 2...
  onClick: () => void;
  className?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isActive,
  offset,
  onClick,
  className,
}) => {
  // Fan composition geometry calculations based on offset distance
  const absOffset = Math.abs(offset);

  // X offset spacing
  const translateX = offset * 180; // horizontal separation
  const scale = isActive ? 1.05 : Math.max(0.78, 1 - absOffset * 0.12);
  const rotateZ = offset * -6; // Fan angle
  const opacity = isActive ? 1 : Math.max(0.35, 1 - absOffset * 0.3);
  const zIndex = 30 - absOffset * 10;

  return (
    <motion.div
      onClick={onClick}
      aria-selected={isActive}
      aria-label={`Role: ${role.role}`}
      tabIndex={isActive ? 0 : -1}
      role="button"
      animate={{
        x: translateX,
        scale,
        rotateZ,
        opacity,
        zIndex,
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={cn(
        'absolute w-[260px] sm:w-[300px] md:w-[330px] rounded-2xl p-6 sm:p-7 select-none cursor-pointer text-left',
        'bg-surface border transition-colors duration-200',
        isActive
          ? 'border-foreground shadow-[0_16px_40px_rgba(16,44,87,0.15)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] ring-1 ring-foreground/20'
          : 'border-border/40 hover:border-border shadow-md hover:opacity-90',
        className
      )}
    >
      {/* Artwork Container */}
      <div className="relative w-full h-[160px] sm:h-[190px] rounded-xl overflow-hidden bg-background/50 border border-border/30 flex items-center justify-center p-3 mb-5">
        <img
          src={role.image}
          alt={role.role}
          className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 pointer-events-none"
        />
        {isActive && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </div>

      {/* Role Text Content */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-foreground/60">
          Interview Profile
        </span>
        <h3 className="text-lg sm:text-xl font-stardom font-normal text-foreground uppercase tracking-tight leading-tight">
          {role.role}
        </h3>
        <p className="text-xs font-sans text-foreground/70 line-clamp-2 mt-1 leading-relaxed">
          {role.description}
        </p>
      </div>
    </motion.div>
  );
};
