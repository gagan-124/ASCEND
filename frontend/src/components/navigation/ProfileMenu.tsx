import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProfileMenuProps {
  className?: string;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { user, clearAuth } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const avatarUrl = profile.avatarUrl || user?.avatarUrl || null;
  const activeName = profile.fullName || user?.fullName;
  const activeEmail = profile.email || user?.email;

  const userInitial = activeName
    ? activeName.trim().charAt(0).toUpperCase()
    : activeEmail
    ? activeEmail.trim().charAt(0).toUpperCase()
    : 'U';

  const displayName = activeName || activeEmail?.split('@')[0] || 'Account';

  const menuItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        setIsOpen(false);
        navigate('/settings');
      },
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      icon: LogOut,
      action: () => {
        setIsOpen(false);
        clearAuth();
        navigate('/');
      },
      danger: true,
    },
  ];

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  // Handle keyboard events inside the menu
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % menuItems.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(menuItems.length - 1);
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Keep focus in sync with focusedIndex
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn('relative inline-block text-left', className)}
    >
      {/* Profile Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setFocusedIndex(-1);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`User account menu for ${displayName}`}
        className="inline-flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-border/60 hover:border-border transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 select-none cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover shrink-0 border border-border/60"
            aria-hidden="true"
          />
        ) : (
          <span
            className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 text-foreground font-semibold text-xs leading-none shrink-0"
            aria-hidden="true"
          >
            {userInitial}
          </span>
        )}
        <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-foreground/60 transition-transform duration-150',
            isOpen && 'rotate-180 text-foreground'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Accessible Dropdown Menu Panel (Solid continuous page background, no glassmorphism) */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="User account actions"
          className="absolute right-0 mt-2 w-48 rounded-md border border-border/60 bg-background py-1.5 shadow-md z-50 focus:outline-none"
        >
          {/* User identifier header inside menu */}
          <div className="px-3 py-2 border-b border-border/40 select-none">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {displayName}
            </p>
            {user?.email && (
              <p className="text-[11px] text-foreground/60 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <div className="py-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    menuItemsRef.current[index] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer select-none focus-visible:outline-none',
                    item.danger
                      ? 'text-status-danger hover:bg-status-danger/10 focus:bg-status-danger/10'
                      : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5 focus:bg-foreground/5 focus:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
