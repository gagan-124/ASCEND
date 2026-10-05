import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { DesktopNav } from './DesktopNav';
import { MobileNav } from './MobileNav';
import { ProfileMenu } from './ProfileMenu';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  className?: string;
  showLogo?: boolean;
  logoLayoutId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  className,
  showLogo = true,
  logoLayoutId = 'ascend-brand-logo',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleStartInterview = () => {
    if (isAuthenticated) {
      navigate('/interview/setup');
    } else {
      navigate('/auth/login?redirect=/interview/setup');
    }
  };

  return (
    <header
      className={cn(
        'w-full border-b border-border/40 bg-background text-foreground transition-colors duration-150',
        className
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Left Side: Brand Anchor & Primary Desktop Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Logo container with layoutId preservation for opening transition */}
          <div className="flex items-center min-h-[36px]">
            {showLogo && (
              <Link
                to="/"
                aria-label="ASCEND — Return to Home"
                className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
              >
                <AscendLogo
                  size="md"
                  layoutId={logoLayoutId}
                  className="cursor-pointer"
                />
              </Link>
            )}
          </div>

          {/* Primary Desktop Navigation Links */}
          <DesktopNav className="hidden md:flex" />
        </div>

        {/* Right Side: Authentication Actions & Primary CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <ThemeToggle />

          {!isAuthenticated ? (
            <>
              <Link
                to="/auth/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 select-none"
              >
                Sign In
              </Link>

              <button
                type="button"
                onClick={handleStartInterview}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide rounded-md bg-foreground text-background transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground select-none cursor-pointer"
              >
                Start Interview
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartInterview}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide rounded-md bg-foreground text-background transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground select-none cursor-pointer"
              >
                Start Interview
              </button>

              <ProfileMenu />
            </>
          )}
        </div>

        {/* Mobile Viewport Actions (< md) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-panel"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-1.5 rounded-md border border-border/60 hover:border-border text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Navigation Panel */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={handleCloseMobileMenu}
      />
    </header>
  );
};
