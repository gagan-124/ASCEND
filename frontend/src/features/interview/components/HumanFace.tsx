import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface HumanFaceProps {
  state?: InterviewState;
  /** Real-time audio amplitude (0 to 100) from AnalyserNode */
  audioLevel?: number;
  isSpeaking?: boolean;
  className?: string;
}

export const HumanFace: React.FC<HumanFaceProps> = ({
  state = 'READY',
  audioLevel = 0,
  isSpeaking = false,
  className,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isThinking = state === 'EVALUATING';

  // Natural irregular eye blinking (2.5s - 6.0s cycle)
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = Math.random() * 3500 + 2500;
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Subtle pupil offsets during thinking posture
  const pupilOffsetX = isThinking ? 2.5 : 0;
  const pupilOffsetY = isThinking ? -1.5 : 0;

  // Real-time audio-driven mouth opening height (in pixels)
  const mouthOpenness = isSpeaking
    ? Math.max(3, (audioLevel / 100) * 16 + 3)
    : 2;

  return (
    <div className={cn('relative w-44 h-44 sm:w-56 sm:h-56 select-none flex items-center justify-center', className)}>
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full object-contain"
        animate={{
          y: isSpeaking ? [0, -1.5, 0] : [0, 1.5, 0],
        }}
        transition={{
          duration: isSpeaking ? 1.4 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
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

        {/* Professional Sleek Haircut */}
        <path
          d="M 52 82 C 52 40, 75 25, 100 25 C 125 25, 148 40, 148 82 C 148 65, 135 35, 100 35 C 65 35, 52 65, 52 82 Z"
          fill="url(#hairGrad)"
        />

        {/* Eyebrows */}
        <path
          d={isThinking ? 'M 70 68 Q 80 64 90 70' : 'M 70 67 Q 80 65 90 67'}
          fill="none"
          stroke="#1E293B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={isThinking ? 'M 110 70 Q 120 64 130 68' : 'M 110 67 Q 120 65 130 67'}
          fill="none"
          stroke="#1E293B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Eyes & Blinking */}
        {!isBlinking ? (
          <>
            <ellipse cx="80" cy="78" rx="7" ry="5" fill="#FFFFFF" />
            <circle cx={80 + pupilOffsetX} cy={78 + pupilOffsetY} r="3.5" fill="#10253F" />
            <circle cx={81 + pupilOffsetX} cy={77 + pupilOffsetY} r="1" fill="#FFFFFF" />

            <ellipse cx="120" cy="78" rx="7" ry="5" fill="#FFFFFF" />
            <circle cx={120 + pupilOffsetX} cy={78 + pupilOffsetY} r="3.5" fill="#10253F" />
            <circle cx={121 + pupilOffsetX} cy={77 + pupilOffsetY} r="1" fill="#FFFFFF" />
          </>
        ) : (
          <>
            <path d="M 73 78 Q 80 82 87 78" fill="none" stroke="#1E293B" strokeWidth="2" />
            <path d="M 113 78 Q 120 82 127 78" fill="none" stroke="#1E293B" strokeWidth="2" />
          </>
        )}

        {/* Nose */}
        <path d="M 100 80 L 97 95 L 103 95 Z" fill="rgba(16, 37, 63, 0.15)" />

        {/* Mouth Articulation Driven directly by real Audio Level */}
        <path
          d={
            isSpeaking
              ? `M 84 112 Q 100 ${112 + mouthOpenness} 116 112 Q 100 ${110 - mouthOpenness / 2} 84 112 Z`
              : 'M 86 112 Q 100 115 114 112'
          }
          fill={isSpeaking ? '#881337' : 'none'}
          stroke="#9F1239"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Eyewear */}
        <rect x="68" y="70" width="24" height="16" rx="4" fill="none" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
        <rect x="108" y="70" width="24" height="16" rx="4" fill="none" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
        <line x1="92" y1="76" x2="108" y2="76" stroke="rgba(205, 181, 141, 0.8)" strokeWidth="1.5" />
      </motion.svg>
    </div>
  );
};
