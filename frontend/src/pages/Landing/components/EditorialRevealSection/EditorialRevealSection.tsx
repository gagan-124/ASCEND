import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import img1 from '@/assets/images/editorial/editorial-1.webp';
import img2 from '@/assets/images/editorial/editorial-2.webp';
import img3 from '@/assets/images/editorial/editorial-3.webp';


export interface EditorialRevealSectionProps {
  className?: string;
}

const SEQUENCE_ITEMS = [
  { text: 'LEARN.', isDisplay: true },
  { text: 'ADAPT.', isDisplay: true },
  { text: 'DEPLOY.', isDisplay: true },
  { text: 'with ASCEND.', isDisplay: false },
];

export const EditorialRevealSection: React.FC<EditorialRevealSectionProps> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();

  // Typography entrance sequence
  const textContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.2,
      },
    },
  };

  const textItemVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
  };

  // Image entrance variants
  const imgLeftVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
  };

  const imgRightVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        delay: 0.15,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
  };

  const img3LeftVariants = {
    hidden: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        delay: 0.3,
        ease: [0.25, 1, 0.5, 1] as const,
      },
    },
  };

  return (
    <section
      id="editorial-sequence"
      aria-label="Editorial Brand Sequence"
      className={cn(
        'w-full bg-background text-foreground transition-colors duration-150',
        'py-20 sm:py-28 md:py-36 lg:py-44 overflow-hidden',
        className
      )}
    >
      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 xl:gap-16 items-center">
          
          {/* LEFT HALF: Layered Photographic Editorial Image Cluster */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-start">
            <motion.div
              initial={shouldReduceMotion ? 'visible' : 'hidden'}
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl flex flex-col"
            >
              {/* Image 1: Left-aligned (Candidate in AI Interview) */}
              <motion.div
                variants={imgLeftVariants}
                className="relative z-10 w-[68%] sm:w-[64%] self-start overflow-hidden rounded-md"
              >
                <motion.img
                  src={img1}
                  alt="Candidate AI interview session visual"
                  className="w-full h-auto object-cover block"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { y: [0, -5, 0] }
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>

              {/* Image 2: Right-aligned, partially overlapping Image 1 (Developer Desk Setup) */}
              <motion.div
                variants={imgRightVariants}
                className="relative z-20 w-[68%] sm:w-[64%] self-end -mt-24 sm:-mt-32 md:-mt-40 overflow-hidden rounded-md"
              >
                <motion.img
                  src={img2}
                  alt="Developer confidence analytics dashboard visual"
                  className="w-full h-auto object-cover block"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { y: [0, 5, 0] }
                  }
                  transition={{
                    duration: 5.5,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>

              {/* Image 3: Left-aligned, partially overlapping Image 2 (Team Collaboration Workspace) */}
              <motion.div
                variants={img3LeftVariants}
                className="relative z-30 w-[78%] sm:w-[74%] self-start -mt-20 sm:-mt-28 md:-mt-32 overflow-hidden rounded-md"
              >
                <motion.img
                  src={img3}
                  alt="Collaborative interview engineering workspace visual"
                  className="w-full h-auto object-cover block"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { y: [0, -4, 0] }
                  }
                  transition={{
                    duration: 6,
                    delay: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* RIGHT HALF: Editorial Statement */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
            <motion.div
              variants={textContainerVariants}
              initial={shouldReduceMotion ? 'visible' : 'hidden'}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col items-start text-left select-none w-full"
            >
              {SEQUENCE_ITEMS.map((item, index) => (
                <motion.div key={index} variants={textItemVariants}>
                  {item.isDisplay ? (
                    <span className="block font-stardom font-normal text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] xl:text-[5.5rem] tracking-tight text-foreground leading-[1.05] uppercase">
                      {item.text}
                    </span>
                  ) : (
                    <span className="block mt-4 sm:mt-6 font-satoshi text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground/60 font-light tracking-wide">
                      {item.text}
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};


