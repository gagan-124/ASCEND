import React from 'react';
import { NavItem } from './NavItem';
import { cn } from '@/lib/utils';

export interface DesktopNavProps {
  className?: string;
}

export const PRIMARY_NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/interview', label: 'Interviews', exact: false },
  { to: '/ats-evaluator', label: 'ATS Evaluator', exact: false },
  { to: '/dashboard', label: 'Dashboard', exact: false },
] as const;

export const DesktopNav: React.FC<DesktopNavProps> = ({ className }) => {
  return (
    <nav
      aria-label="Primary Navigation"
      className={cn('items-center gap-1 lg:gap-2', className)}
    >
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          label={item.label}
          exact={item.exact}
        />
      ))}
    </nav>
  );
};
