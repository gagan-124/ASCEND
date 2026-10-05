import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface NavItemProps {
  to: string;
  label: string;
  exact?: boolean;
  className?: string;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  label,
  exact = false,
  className,
  onClick,
}) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const isActive = exact
    ? location.pathname === to
    : to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={({ isPending }) =>
        cn(
          'relative px-3 py-1.5 text-xs sm:text-sm font-medium tracking-wide transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 select-none',
          isActive
            ? 'text-foreground font-semibold'
            : 'text-foreground/70 hover:text-foreground',
          isPending && 'opacity-70',
          className
        )
      }
    >
      {/* Animated Subtle Capsule Indicator for Desktop Navigation */}
      {isActive && (
        <motion.span
          layoutId={shouldReduceMotion ? undefined : 'desktop-navbar-active-indicator'}
          className="absolute inset-0 rounded-md bg-foreground/[0.08] pointer-events-none"
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
          }}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">{label}</span>
    </NavLink>
  );
};
