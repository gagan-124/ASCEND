import React from 'react';
import { HeroContent } from './HeroContent';
import { RoleSlideshow } from './RoleSlideshow';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  return (
    <section
      aria-label="Hero"
      className={cn(
        'w-full bg-background text-foreground transition-colors duration-150',
        'pt-20 sm:pt-24 md:pt-28 lg:pt-4 pb-12 sm:pb-16 lg:pb-8',
        'lg:min-h-[calc(100vh-4.5rem)] flex items-center',
        className
      )}
    >
      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-10 xl:gap-12 items-center">
          {/* Left Column: Slightly Smaller Editorial Statement & Primary CTA */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center">
            <HeroContent />
          </div>

          {/* Right Column: Dominant Role Artwork Slideshow */}
          <div className="lg:col-span-7 xl:col-span-8 w-full flex flex-col justify-center overflow-hidden">
            <RoleSlideshow />
          </div>
        </div>
      </div>
    </section>
  );
};
