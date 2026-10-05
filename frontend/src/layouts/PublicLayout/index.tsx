import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OpeningAnimation } from '@/components/branding';
import { Navbar } from '@/components/navigation';

// Session-level flag in module memory: resets on fresh page load/refresh, persists across SPA client routing
let hasPlayedOpeningIntro = false;

/**
 * PublicLayout orchestrates the public shell and houses the shared Framer Motion
 * layout transition between the opening brand reveal and the permanent top-left navbar branding.
 */
export function PublicLayout() {
  const location = useLocation();
  const isDedicatedOpeningRoute = location.pathname === '/opening';
  
  // Show intro only on initial app session load/refresh, never on client-side SPA navigation or Back
  const [showIntro, setShowIntro] = useState(() => {
    if (isDedicatedOpeningRoute) return false;
    return !hasPlayedOpeningIntro;
  });

  const handleComplete = () => {
    hasPlayedOpeningIntro = true;
    setShowIntro(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Integrated Public Navbar in normal document flow */}
      <Navbar
        showLogo={!showIntro || isDedicatedOpeningRoute}
        logoLayoutId={isDedicatedOpeningRoute ? undefined : 'ascend-brand-logo'}
      />

      {/* Main Public Content Destination Shell (Landing, etc.) */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Intro Experience Overlay (Continuous Layout Transition, Zero Route Unmount) */}
      <AnimatePresence>
        {showIntro && !isDedicatedOpeningRoute && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-opening)]"
          >
            <OpeningAnimation
              layoutId="ascend-brand-logo"
              onComplete={handleComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
