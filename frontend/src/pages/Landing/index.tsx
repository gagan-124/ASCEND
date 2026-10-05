import { HeroSection } from './components/Hero';
import { EditorialRevealSection } from './components/EditorialRevealSection';
import { LandingFooter } from './components/LandingFooter';
import { ScrollIndicator } from './components/ScrollIndicator';

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground relative">
      <HeroSection />
      <ScrollIndicator targetId="editorial-sequence" />
      <EditorialRevealSection />
      <LandingFooter />
    </div>
  );
}
