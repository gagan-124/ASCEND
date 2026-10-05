import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface HumanInterviewerAvatarProps {
  state?: InterviewState;
  audioLevel?: number;
  interviewerName?: string;
  interviewerTitle?: string;
  className?: string;
}

export const HumanInterviewerAvatar: React.FC<HumanInterviewerAvatarProps> = ({
  state = 'READY',
  audioLevel = 0,
  interviewerName = 'Dr. Sarah Jenkins',
  interviewerTitle = 'Principal Engineering Evaluator',
  className,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isNodding, setIsNodding] = useState(false);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isSpeaking = state === 'QUESTION' || state === 'FOLLOW_UP';
  const isListening = state === 'LISTENING';
  const isThinking = state === 'EVALUATING';


  // Irregular natural eye blinking cycle
  useEffect(() => {
    const scheduleBlink = () => {
      const nextBlinkDelay = Math.random() * 3500 + 2500; // 2.5s - 6.0s
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 180);
      }, nextBlinkDelay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Occasional nod when candidate audio peaks during listening phase
  useEffect(() => {
    if (isListening && audioLevel > 35 && !isNodding) {
      setIsNodding(true);
      const nodTimeout = setTimeout(() => setIsNodding(false), 900);
      return () => clearTimeout(nodTimeout);
    }
  }, [isListening, audioLevel, isNodding]);

  // Head tilt & rotation parameters based on state
  const headRotation = isThinking ? -4 : isNodding ? 3 : 0;
  const headY = isNodding ? 4 : 0;
  const pupilOffsetX = isThinking ? 3 : 0;
  const pupilOffsetY = isThinking ? -2 : 0;

  // Mouth openness calculation for speech animation
  const mouthOpenness = isSpeaking
    ? Math.max(3, Math.sin(Date.now() / 120) * 8 + 8)
    : 2;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center w-full max-w-sm mx-auto text-center select-none font-sans',
        className
      )}
    >
      {/* Background Ambient Spotlight Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/15 blur-3xl -z-10 pointer-events-none" />

      {/* Main Avatar Container */}
      <motion.div
        animate={{
          y: isSpeaking ? [0, -2, 0] : [0, 2, 0],
        }}
        transition={{
          duration: isSpeaking ? 1.5 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-surface border-2 border-border/80 p-2 shadow-2xl flex items-center justify-center overflow-hidden"
      >
        {/* State Status Light Ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 transition-colors duration-500 pointer-events-none',
            isSpeaking
              ? 'border-accent/80 shadow-[0_0_20px_rgba(205,181,141,0.3)]'
              : isListening
              ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : isThinking
              ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'border-border/40'
          )}
        />

        {/* Professional Human Interviewer Avatar Vector Surface */}
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full object-contain"
          animate={{
            rotate: headRotation,
            y: headY,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5D0C5" />
              <stop offset="100%" stopColor="#E4B4A5" />
            </linearGradient>

            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10253F" />
              <stop offset="100%" stopColor="#0A1626" />
            </linearGradient>
          </defs>

          {/* Shoulders & Business Suit */}
          <path
            d="M 25 190 Q 100 135 175 190 L 185 200 L 15 200 Z"
            fill="url(#suitGrad)"
            stroke="rgba(205, 181, 141, 0.3)"
            strokeWidth="1.5"
          />

          {/* Shirt Collar */}
          <path d="M 82 145 L 100 170 L 118 145 L 100 148 Z" fill="#F6EFE4" />

          {/* Neck */}
          <rect x="86" y="125" width="28" height="25" rx="4" fill="url(#skinGrad)" />

          {/* Head Base */}
          <path
            d="M 55 85 C 55 45, 145 45, 145 85 C 145 125, 130 140, 100 140 C 70 140, 55 125, 55 85 Z"
            fill="url(#skinGrad)"
          />

          {/* Hair Styling (Professional Sleek Haircut) */}
          <path
            d="M 52 82 C 52 40, 75 25, 100 25 C 125 25, 148 40, 148 82 C 148 65, 135 35, 100 35 C 65 35, 52 65, 52 82 Z"
            fill="url(#hairGrad)"
          />

          {/* Eyebrows */}
          <path
            d={isThinking ? "M 70 68 Q 80 64 90 70" : "M 70 67 Q 80 65 90 67"}
            fill="none"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={isThinking ? "M 110 70 Q 120 64 130 68" : "M 110 67 Q 120 65 130 67"}
            fill="none"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Eyes & Blinking */}
          {!isBlinking ? (
            <>
              {/* Left Eye */}
              <ellipse cx="80" cy="78" rx="7" ry="5" fill="#FFFFFF" />
              <circle
                cx={80 + pupilOffsetX}
                cy={78 + pupilOffsetY}
                r="3.5"
                fill="#10253F"
              />
              <circle cx={81 + pupilOffsetX} cy={77 + pupilOffsetY} r="1" fill="#FFFFFF" />

              {/* Right Eye */}
              <ellipse cx="120" cy="78" rx="7" ry="5" fill="#FFFFFF" />
              <circle
                cx={120 + pupilOffsetX}
                cy={78 + pupilOffsetY}
                r="3.5"
                fill="#10253F"
              />
              <circle cx={121 + pupilOffsetX} cy={77 + pupilOffsetY} r="1" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Closed Eye Lids for Natural Blink */}
              <path d="M 73 78 Q 80 82 87 78" fill="none" stroke="#1E293B" strokeWidth="2" />
              <path d="M 113 78 Q 120 82 127 78" fill="none" stroke="#1E293B" strokeWidth="2" />
            </>
          )}

          {/* Nose */}
          <path d="M 100 80 L 97 95 L 103 95 Z" fill="rgba(16, 37, 63, 0.15)" />

          {/* Mouth Articulation for Speech */}
          <motion.path
            d={
              isSpeaking
                ? `M 84 112 Q 100 ${112 + mouthOpenness} 116 112 Q 100 ${110 - mouthOpenness / 2} 84 112 Z`
                : "M 86 112 Q 100 116 114 112"
            }
            fill={isSpeaking ? '#881337' : 'none'}
            stroke="#9F1239"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Subtle Glasses / Professional Eyewear */}
          <rect x="68" y="70" width="24" height="16" rx="4" fill="none" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
          <rect x="108" y="70" width="24" height="16" rx="4" fill="none" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
          <line x1="92" y1="76" x2="108" y2="76" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
        </motion.svg>
      </motion.div>

      {/* Interviewer Name & Credential Pill */}
      <div className="mt-3 flex flex-col items-center">
        <h3 className="text-sm font-bold text-foreground font-stardom uppercase tracking-tight flex items-center gap-1.5">
          <span>{interviewerName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </h3>
        <p className="text-[11px] font-mono text-foreground/60">{interviewerTitle}</p>
      </div>
    </div>
  );
};
