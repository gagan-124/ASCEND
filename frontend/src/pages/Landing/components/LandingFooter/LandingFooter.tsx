import React from 'react';
import { Link } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { cn } from '@/lib/utils';

export interface LandingFooterProps {
  className?: string;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ className }) => {
  return (
    <footer
      aria-label="Site Footer"
      className={cn(
        'w-full border-t border-border/30 bg-background text-foreground transition-colors duration-150',
        'pt-16 sm:pt-20 pb-10 sm:pb-12',
        className
      )}
    >
      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Top Section: Three Column Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12 pb-12 sm:pb-16 border-b border-border/25">
          {/* COLUMN 1 — BRAND */}
          <div className="md:col-span-6 lg:col-span-5 flex flex-col items-start justify-start">
            <Link
              to="/"
              aria-label="ASCEND — Return to Home"
              className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded inline-block"
            >
              <AscendLogo size="md" />
            </Link>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-sans text-foreground/60 font-normal tracking-wide select-none">
              Practice smarter. Perform stronger.
            </p>
          </div>

          {/* RIGHT COLUMNS (NAVIGATION & PRODUCT) */}
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-8 sm:gap-12">
            {/* COLUMN 2 — NAVIGATION */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-xs font-mono font-medium uppercase tracking-widest text-foreground/40 select-none">
                Navigation
              </h3>
              <ul className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm font-sans">
                <li>
                  <Link
                    to="/"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/interview/setup"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    Interviews
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ats-evaluator"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    ATS Evaluator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 3 — PRODUCT */}
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-xs font-mono font-medium uppercase tracking-widest text-foreground/40 select-none">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5 sm:gap-3 text-xs sm:text-sm font-sans">
                <li>
                  <Link
                    to="/interview/setup"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    Start Interview
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth/login"
                    className="text-foreground/70 hover:text-foreground transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Metadata Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-foreground/40 select-none">
          <p>© 2026 ASCEND</p>
          <div className="flex items-center gap-6">
            <span className="text-foreground/40 font-mono">
              Privacy
            </span>
            <span className="text-foreground/40 font-mono">
              Terms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

