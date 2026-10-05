import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AuthBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ className, children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative min-h-screen w-full bg-background text-foreground transition-colors duration-150 overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      {/* Low-contrast theme-aware SVG background curves */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40 dark:opacity-25 select-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Subtle flowing stroke 1 */}
          <motion.path
            d="M-200 450 C200 200, 600 700, 1000 350 C1300 100, 1500 500, 1700 300"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-foreground/12"
            initial={
              shouldReduceMotion
                ? false
                : {
                    d: 'M-200 450 C200 200, 600 700, 1000 350 C1300 100, 1500 500, 1700 300',
                    pathLength: 1,
                    opacity: 0.3,
                  }
            }
            animate={
              shouldReduceMotion
                ? false
                : {
                    d: [
                      'M-200 450 C200 200, 600 700, 1000 350 C1300 100, 1500 500, 1700 300',
                      'M-200 420 C250 250, 550 650, 1050 380 C1250 150, 1550 450, 1700 320',
                      'M-200 450 C200 200, 600 700, 1000 350 C1300 100, 1500 500, 1700 300',
                    ],
                  }
            }
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Subtle flowing stroke 2 */}
          <motion.path
            d="M-100 700 C300 500, 700 800, 1100 550 C1400 350, 1600 650, 1800 500"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-foreground/8"
            initial={
              shouldReduceMotion
                ? false
                : {
                    d: 'M-100 700 C300 500, 700 800, 1100 550 C1400 350, 1600 650, 1800 500',
                    pathLength: 1,
                    opacity: 0.2,
                  }
            }
            animate={
              shouldReduceMotion
                ? false
                : {
                    d: [
                      'M-100 700 C300 500, 700 800, 1100 550 C1400 350, 1600 650, 1800 500',
                      'M-100 680 C320 530, 680 770, 1120 520 C1380 380, 1620 620, 1800 520',
                      'M-100 700 C300 500, 700 800, 1100 550 C1400 350, 1600 650, 1800 500',
                    ],
                  }
            }
            transition={{
              duration: 25,
              delay: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </div>

      {/* Main page content container */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
};
