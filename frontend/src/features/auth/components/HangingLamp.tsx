import React from 'react';
import { cn } from '@/lib/utils';

export interface HangingLampProps {
  lightIntensity: number; // 0.05 to 1.0
  angle: number; // rotation in degrees
  isInteractive: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * HangingLamp
 * A realistic, lightweight SVG/CSS hanging lamp component.
 * Includes:
 * - Ceiling plate, cord, cap, dark industrial shade, and visible warm bulb
 * - Soft, diffused downward light beam attached directly to the bulb
 * - The light beam sways gracefully WITH the lamp!
 */
export const HangingLamp: React.FC<HangingLampProps> = ({
  lightIntensity,
  angle,
  isInteractive,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn('relative flex flex-col items-center select-none z-40', className)}
      style={{
        transformOrigin: 'top center',
        transform: `rotate(${angle}deg)`,
        transition: 'transform 0.05s linear',
      }}
    >
      {/* Ceiling Mounting Plate */}
      <div className="w-7 h-1.5 rounded-full bg-slate-700/90 shadow-sm border border-slate-600/50" />

      {/* Thin Hanging Cord */}
      <div className="w-[1.5px] h-20 sm:h-24 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 shadow-xs" />

      {/* Lamp Cap / Metallic Fixture */}
      <div className="w-4 h-3 bg-gradient-to-r from-amber-900 via-yellow-700 to-amber-950 rounded-t-xs border-t border-amber-600/40 shadow-inner" />

      {/* Industrial Lamp Shade & Bulb Assembly */}
      <div
        onClick={isInteractive ? onClick : undefined}
        title={isInteractive ? 'Click to swing lamp' : undefined}
        className={cn(
          'relative flex flex-col items-center -mt-0.5',
          isInteractive ? 'cursor-pointer group' : 'cursor-default'
        )}
      >
        {/* Lamp Shade SVG */}
        <svg
          width="76"
          height="34"
          viewBox="0 0 76 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg z-20 relative transition-transform duration-150 group-hover:scale-[1.02]"
        >
          <path
            d="M 28 0 L 48 0 C 52 0 56 4 58 8 L 74 28 C 76 32 74 34 68 34 L 8 34 C 2 34 0 32 2 28 L 18 8 C 20 4 24 0 28 0 Z"
            fill="url(#lamp-shade-grad)"
            stroke="#334155"
            strokeWidth="0.8"
          />

          {/* Golden Interior Rim */}
          <ellipse
            cx="38"
            cy="33"
            rx="33"
            ry="2.5"
            fill={lightIntensity > 0.1 ? '#fef3c7' : '#334155'}
            opacity={Math.max(0.35, lightIntensity)}
          />

          <defs>
            <linearGradient id="lamp-shade-grad" x1="0" y1="0" x2="76" y2="34">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="45%" stopColor="#0f172a" />
              <stop offset="55%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
        </svg>

        {/* Visible Bulb Component (Clear light source) */}
        <div className="relative -mt-1 flex items-center justify-center z-30">
          {/* Bulb Core Radial Ambient Glow */}
          <div
            className="absolute w-12 h-12 rounded-full pointer-events-none transition-opacity duration-150"
            style={{
              opacity: Math.max(0.2, lightIntensity),
              background: `radial-gradient(
                circle at 50% 50%,
                rgba(254, 243, 199, ${0.9 * lightIntensity}) 0%,
                rgba(251, 191, 36, ${0.5 * lightIntensity}) 35%,
                rgba(245, 158, 11, 0) 70%
              )`,
            }}
          />

          {/* Glass Envelope */}
          <div
            className={cn(
              'w-4 h-5 rounded-b-full transition-all duration-150 flex items-center justify-center relative z-10',
              lightIntensity > 0.15
                ? 'bg-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.9),0_0_30px_rgba(245,158,11,0.6)]'
                : 'bg-slate-800 border border-slate-700/60'
            )}
            style={{
              opacity: Math.max(0.4, lightIntensity),
            }}
          >
            {/* Filament Wire */}
            <div
              className={cn(
                'w-1.5 h-2 border-t-2 border-x rounded-t-xs transition-colors duration-100',
                lightIntensity > 0.15
                  ? 'border-amber-400 bg-amber-200/90 shadow-[0_0_6px_#fbbf24]'
                  : 'border-slate-600'
              )}
            />
          </div>
        </div>

        {/* SOFT DIFFUSED DOWNWARD LIGHT BEAM (Attached directly to bulb, sways WITH the lamp!) */}
        <div
          className="absolute top-[28px] left-1/2 -translate-x-1/2 w-[440px] sm:w-[580px] h-[650px] pointer-events-none z-10 transition-opacity duration-150"
          style={{
            opacity: Math.max(0.08, lightIntensity),
            background: `radial-gradient(
              ellipse 260px 420px at 50% 0%,
              rgba(254, 243, 199, ${0.35 * lightIntensity}) 0%,
              rgba(251, 191, 36, ${0.16 * lightIntensity}) 30%,
              rgba(245, 158, 11, ${0.05 * lightIntensity}) 65%,
              transparent 100%
            )`,
          }}
        />
      </div>
    </div>
  );
};
