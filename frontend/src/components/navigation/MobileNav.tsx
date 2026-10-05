import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { PRIMARY_NAV_ITEMS } from './DesktopNav';
import { LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  className,
}) => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const lastPathname = useRef(location.pathname);

  // Close mobile navigation only when route path actually changes
  useEffect(() => {
    if (lastPathname.current !== location.pathname) {
      lastPathname.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleStartInterview = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/interview/setup');
    } else {
      navigate('/auth/login?redirect=/interview/setup');
    }
  };

  const handleSignOut = () => {
    onClose();
    clearAuth();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          id="mobile-navigation-panel"
          role="region"
          aria-label="Mobile Navigation"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
          className={cn(
            'overflow-hidden w-full border-b border-border/40 bg-background select-none',
            className
          )}
        >
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* 1. Primary Navigation Links */}
            <nav className="flex flex-col gap-1" aria-label="Mobile Primary Links">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-foreground/[0.08] text-foreground font-semibold'
                        : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                    )}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="h-px bg-border/40 w-full" aria-hidden="true" />

            {/* 2. Primary CTA: Start Interview */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStartInterview}
                className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-md bg-foreground text-background transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground select-none cursor-pointer"
              >
                Start Interview
              </button>

              {/* 3. Authentication controls */}
              {!isAuthenticated ? (
                <NavLink
                  to="/auth/login"
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs font-medium text-foreground/70 hover:text-foreground rounded-md transition-colors"
                >
                  Sign In
                </NavLink>
              ) : (
                <div className="flex flex-col gap-1 pt-2">
                  <div className="px-3 py-1 text-xs text-foreground/50">
                    Signed in as <span className="font-semibold text-foreground">{user?.fullName || user?.email}</span>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground/80 hover:text-foreground rounded-md hover:bg-foreground/5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground/80 hover:text-foreground rounded-md hover:bg-foreground/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-status-danger hover:bg-status-danger/10 rounded-md transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
