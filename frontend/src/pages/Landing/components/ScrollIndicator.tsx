import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScrollIndicatorProps {
  targetId?: string;
  className?: string;
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  targetId = 'editorial-sequence',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Scroll to explore more"
      initial={{ opacity: 0, y: -4 }}
      animate={{
        opacity: isVisible ? (isHovered ? 0.95 : 0.6) : 0,
      }}
      transition={{
        duration: 0.4,
        delay: isVisible ? 1.0 : 0,
        ease: 'easeOut',
      }}
      className={cn(
        'fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-30',
        'p-3 cursor-pointer select-none border-none bg-transparent outline-none',
        'focus-visible:ring-1 focus-visible:ring-foreground/40 rounded-sm',
        !isVisible && 'pointer-events-none',
        className
      )}
    >
      <motion.div
        animate={
          shouldReduceMotion || !isVisible
            ? { y: isHovered ? 4 : 0 }
            : {
                y: isHovered
                  ? [4, 14, 14, 4, 4]
                  : [0, 10, 10, 0, 0],
              }
        }
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: [0.25, 1, 0.5, 1],
          times: [0, 0.35, 0.55, 0.75, 1],
        }}
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-foreground stroke-[1.25] transition-colors" />
      </motion.div>
    </motion.button>
  );
};
