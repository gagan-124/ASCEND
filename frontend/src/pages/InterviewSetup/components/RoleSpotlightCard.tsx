import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { InterviewRole } from '../data/roles';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

// Domain-specific controlled accent colors for role emblem glow & spotlight
export const FIELD_GLOW: Record<string, { color: string; rgb: string }> = {
  'software-engineering': { color: '#38BDF8', rgb: '56, 189, 248' },    // Cyan
  'ai-ml': { color: '#A78BFA', rgb: '167, 139, 250' },                   // Violet
  'data-analytics': { color: '#2DD4BF', rgb: '45, 212, 191' },          // Teal
  'cloud-devops': { color: '#60A5FA', rgb: '96, 165, 250' },           // Blue
  'cybersecurity': { color: '#F43F5E', rgb: '244, 63, 94' },           // Crimson
  'product-management': { color: '#F59E0B', rgb: '245, 158, 11' },    // Amber
  'design': { color: '#E879F9', rgb: '232, 121, 249' },                // Magenta
  'quality-engineering': { color: '#4ADE80', rgb: '74, 222, 128' },   // Green
  'mobile-dev': { color: '#38BDF8', rgb: '56, 189, 248' },            // Electric blue
  'game-dev': { color: '#C084FC', rgb: '192, 132, 252' },              // Purple
  'embedded-hardware': { color: '#34D399', rgb: '52, 211, 153' },      // Mint
  'finance': { color: '#FBBF24', rgb: '251, 191, 36' },               // Gold
  'marketing': { color: '#FB7185', rgb: '251, 113, 133' },            // Coral
  'operations': { color: '#818CF8', rgb: '129, 140, 248' },           // Indigo
};

export interface RoleSpotlightCardProps {
  role: InterviewRole;
  isActive: boolean;
  offset: number; // Index relative to active index: -2, -1, 0, 1, 2...
  onClick: () => void;
  className?: string;
}

export const RoleSpotlightCard: React.FC<RoleSpotlightCardProps> = ({
  role,
  isActive,
  offset,
  onClick,
  className,
}) => {
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark';
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const absOffset = Math.abs(offset);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Fan 3D positioning concept (APPROVED - LOCKED)
  const translateX = offset * (isMobile ? 145 : 215);
  const translateY = absOffset * 10;
  const rotateZ = offset * 4.5;
  const rotateY = offset * -10;
  const scale = isActive ? 1.0 : Math.max(0.83, 1 - absOffset * 0.12);
  const opacity = isActive ? 1.0 : Math.max(0.48, 1 - absOffset * 0.32);
  const zIndex = 30 - absOffset * 10;

  const Icon = role.icon;
  const fieldGlow = FIELD_GLOW[role.fieldId] || { color: '#38BDF8', rgb: '56, 189, 248' };

  // Pointer tracking for cursor spotlight (only active when hovered)
  const handleMouseEnter = () => {
    if (isActive) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      aria-selected={isActive}
      aria-label={`Interview Role Profile: ${role.title}`}
      tabIndex={isActive ? 0 : -1}
      role="button"
      animate={{
        x: translateX,
        y: translateY,
        rotateZ,
        rotateY,
        scale,
        opacity,
        zIndex,
      }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 32,
        mass: 0.6,
      }}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className={cn(
        // PORTRAIT CONTAINER (w: ~270-335px, h: ~420-475px)
        'absolute w-[270px] xs:w-[295px] sm:w-[325px] md:w-[335px] h-[420px] xs:h-[435px] sm:h-[460px] md:h-[475px] rounded-3xl p-5 sm:p-6 select-none cursor-pointer text-center flex flex-col justify-between group overflow-hidden transition-colors duration-200',
        // Dark Smoked Clay Material (#060B13 Base) - Uniform dark, no top light at rest
        isActive
          ? isDark
            ? 'bg-[#060B13] border border-white/14 shadow-[20px_20px_45px_rgba(0,0,0,0.65),-4px_-4px_16px_rgba(255,255,255,0.02),inset_1px_1px_0_rgba(255,255,255,0.08),inset_-1px_-1px_0_rgba(0,0,0,0.4)] backdrop-blur-md'
            : 'bg-[#F4EFEA] border border-[#DAC0A3] shadow-[-8px_-8px_20px_rgba(255,255,255,0.95),12px_12px_28px_rgba(16,44,87,0.18)] backdrop-blur-md'
          : isDark
          ? 'bg-[#060B13]/85 border border-white/8 shadow-md backdrop-blur-xs'
          : 'bg-[#F4EFEA]/85 border border-[#DAC0A3]/60 shadow-xs backdrop-blur-xs',
        className
      )}
    >
      {/* LOCALIZED CURSOR SPOTLIGHT - Only visible when cursor enters active card */}
      {isActive && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl z-10 transition-opacity duration-200"
          style={{
            background: `radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), rgba(${fieldGlow.rgb}, ${
              isDark ? '0.22' : '0.26'
            }), rgba(${fieldGlow.rgb}, 0.03) 55%, transparent 80%)`,
          }}
        />
      )}

      {/* 1. TOP METADATA ROW */}
      <div className="relative z-20 flex items-center justify-between w-full">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-foreground/50">
          INTERVIEW PROFILE
        </span>
        {isActive ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-border/20 shrink-0" />
        )}
      </div>

      {/* 2. HERO ROLE EMBLEM (Large Logo Area in Restrained Glass Enclosure) */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto">
        <div
          style={{
            boxShadow: isActive
              ? `0 0 24px rgba(${fieldGlow.rgb}, 0.22), inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 2px rgba(0,0,0,0.5)`
              : absOffset === 1
              ? `0 0 12px rgba(${fieldGlow.rgb}, 0.10), inset 0 1px 1px rgba(255,255,255,0.06)`
              : undefined,
            borderColor: isActive
              ? `rgba(${fieldGlow.rgb}, 0.4)`
              : 'rgba(255, 255, 255, 0.08)',
          }}
          className={cn(
            'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border flex items-center justify-center transition-all duration-300 relative',
            isDark ? 'bg-[#0A111D]/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md'
          )}
        >
          {/* Inner glass accent bevel ring */}
          <div className="absolute inset-1 rounded-[22px] border border-white/5 pointer-events-none" />
          <Icon
            style={{
              color: fieldGlow.color,
              filter: isActive
                ? `drop-shadow(0 0 6px ${fieldGlow.color}) drop-shadow(0 0 18px ${fieldGlow.color})`
                : absOffset === 1
                ? `drop-shadow(0 0 3px ${fieldGlow.color}) drop-shadow(0 0 8px rgba(${fieldGlow.rgb}, 0.35))`
                : `drop-shadow(0 0 2px ${fieldGlow.color}) drop-shadow(0 0 5px rgba(${fieldGlow.rgb}, 0.2))`,
              opacity: isActive ? 1 : absOffset === 1 ? 0.8 : 0.6,
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.5] transition-all duration-300"
          />
        </div>
      </div>

      {/* 3. ROLE TITLE & PROFILE SUB-HEADER */}
      <div className="relative z-20 flex flex-col items-center gap-1 my-auto">
        <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/40">
          PROFILE SPECIFICATION
        </span>
        <h3 className="text-xl sm:text-2xl font-stardom font-normal text-foreground uppercase tracking-tight leading-tight text-center">
          {role.title}
        </h3>
      </div>

      {/* 4. DESCRIPTION */}
      <div className="relative z-20 flex justify-center my-auto">
        <p className="text-xs sm:text-[13px] font-sans text-foreground/75 line-clamp-3 leading-relaxed text-center px-1 max-w-[270px]">
          {role.description}
        </p>
      </div>

      {/* 5. TECHNOLOGY KEYWORD TAGS */}
      <div className="relative z-20 flex flex-wrap justify-center gap-1.5 pt-3 border-t border-white/10 mt-auto">
        {role.skills.map((skill) => (
          <span
            key={skill}
            className={cn(
              'font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-semibold border backdrop-blur-xs transition-colors',
              isActive
                ? isDark
                  ? 'bg-white/8 text-foreground/90 border-white/15 shadow-xs'
                  : 'bg-[#102C57]/10 text-[#102C57] border-[#102C57]/20 shadow-xs'
                : 'bg-white/4 text-foreground/50 border-white/5'
            )}
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
};
