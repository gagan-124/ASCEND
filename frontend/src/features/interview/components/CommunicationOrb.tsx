import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface CommunicationOrbProps {
  /** Audio activity level from 0 to 100 */
  activityLevel?: number;
  /** Current interview state */
  state?: InterviewState;
  className?: string;
}

export const CommunicationOrb: React.FC<CommunicationOrbProps> = ({
  activityLevel = 0,
  state = 'SETUP',
  className,
}) => {
  // Clamp activity level between 0 and 100
  const normalizedLevel = Math.max(0, Math.min(100, activityLevel));
  const isActive = normalizedLevel > 5;
  const isSpeaking = state === 'QUESTION' || state === 'FOLLOW_UP';
  const isThinking = state === 'EVALUATING';
  const isListening = state === 'LISTENING';


  // Dynamic scale calculation based on voice activity or state
  const scale = isSpeaking
    ? 1 + Math.sin(Date.now() / 200) * 0.08
    : isActive
    ? 1 + (normalizedLevel / 100) * 0.25
    : 1;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 select-none pointer-events-none',
        className
      )}
    >
      {/* Outer Ambient Diffused Glow */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.25, 1] : isActive ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isActive || isSpeaking ? 0.45 : 0.2,
        }}
        transition={{
          duration: isSpeaking ? 1.2 : isActive ? 0.6 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full bg-accent/30 blur-xl"
      />

      {/* Ripple Rings when active speech detected */}
      {(isActive || isSpeaking) && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.5],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border border-accent/40"
          />
          <motion.div
            animate={{
              scale: [1, 1.8],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1.5,
              delay: 0.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border border-foreground/20"
          />
        </>
      )}

      {/* Thinking State Rotating Pulse Ring */}
      {isThinking && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-4px] rounded-full border-2 border-dashed border-accent/50"
        />
      )}

      {/* Core Spherical Communication Orb Surface */}
      <motion.div
        animate={{
          scale: scale,
          borderRadius: isActive ? ['50%', '42%', '48%', '50%'] : '50%',
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        className={cn(
          'w-16 h-16 sm:w-18 sm:h-18 rounded-full shadow-lg transition-colors duration-300 relative flex items-center justify-center overflow-hidden',
          isSpeaking
            ? 'bg-gradient-to-tr from-accent via-amber-400 to-foreground text-background'
            : isListening && isActive
            ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-300 text-background'
            : isThinking
            ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 text-background'
            : 'bg-surface border border-border/80 shadow-inner'
        )}
      >
        {/* Core Specular Glass Highlight */}
        <div className="absolute top-1 left-2 w-5 h-2 rounded-full bg-white/30 blur-[1px] transform -rotate-12" />

        {/* Dynamic Center Symbol / Activity Core */}
        <div className="flex items-center gap-0.5">
          {[0.4, 0.8, 1, 0.7, 0.3].map((heightFactor, idx) => {
            const barHeight = isSpeaking || (isListening && isActive)
              ? Math.max(4, (normalizedLevel / 100) * 24 * heightFactor + 6)
              : isThinking
              ? 6 + Math.sin(Date.now() / 150 + idx) * 4
              : 4;

            return (
              <motion.span
                key={idx}
                animate={{ height: barHeight }}
                transition={{ duration: 0.08 }}
                className={cn(
                  'w-1 rounded-full',
                  isSpeaking || isListening || isThinking
                    ? 'bg-white'
                    : 'bg-foreground/40'
                )}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
