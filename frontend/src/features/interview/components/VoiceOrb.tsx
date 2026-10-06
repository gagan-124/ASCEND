import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface VoiceOrbProps {
  activityLevel?: number;
  isSpeaking?: boolean;
  state?: InterviewState;
  className?: string;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  isSpeaking = false,
  state = 'LISTENING',
  className,
}) => {
  const isListening = state === 'LISTENING';
  const isProcessing = state === 'EVALUATING';

  const statusText = isSpeaking
    ? 'Speaking...'
    : isListening
    ? 'Listening...'
    : isProcessing
    ? 'Processing...'
    : 'Ready';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center select-none pointer-events-none',
        className
      )}
    >
      {/* Outer Cyan/Blue Ambient Glow Halo */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.06, 1] : 1,
          opacity: isSpeaking ? [0.4, 0.7, 0.4] : isListening ? [0.3, 0.5, 0.3] : 0.2,
        }}
        transition={{
          duration: isSpeaking ? 1.2 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-cyan-500/25 blur-xl pointer-events-none"
      />

      {/* Main Spherical Glass Orb */}
      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-[#162a3b] via-[#09131d] to-[#04080d] border border-cyan-500/40 p-1 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center overflow-hidden">
        {/* Subtle Specular Highlights */}
        <div className="absolute top-1 left-2 w-5 h-2 rounded-full bg-white/20 blur-[0.5px] transform -rotate-15 pointer-events-none" />

        {/* Central Dynamic Energy Wave */}
        <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center bg-radial from-cyan-400/20 via-blue-600/30 to-transparent">
          <motion.div
            animate={{
              scaleY: isSpeaking ? [1, 1.8, 0.8, 1.4, 1] : isListening ? [0.8, 1.2, 0.9, 1.1, 0.8] : [0.6, 0.8, 0.6],
              rotate: isProcessing ? 360 : 0,
            }}
            transition={{
              duration: isSpeaking ? 0.9 : isListening ? 2 : 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-8 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500 blur-[0.5px] shadow-[0_0_10px_rgba(56,189,248,0.8)]"
          />
        </div>
      </div>

      {/* Status Label Below Orb */}
      <span className="mt-1.5 font-sans text-[11px] font-medium text-cyan-300/80 tracking-wide">
        {statusText}
      </span>
    </div>
  );
};
