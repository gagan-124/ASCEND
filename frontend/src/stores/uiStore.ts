import { create } from 'zustand';
import { LOCAL_STORAGE_KEYS } from '@/config/constants';

export type ThemeMode = 'light' | 'dark';

interface UIState {
  theme: ThemeMode;
  isSidebarOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

/**
 * Browser-safe theme initialization helper.
 * Checks localStorage first, then falls back to system color scheme preference,
 * safely guarding against non-browser environments.
 */
function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // Ignore localStorage / matchMedia errors in constrained environments
  }
  return 'dark';
}

function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_MODE, theme);
  } catch {
    // Ignore write failures in private browsing mode or storage quotas
  }
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  isSidebarOpen: false,
  setTheme: (theme: ThemeMode) => {
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      persistTheme(nextTheme);
      return { theme: nextTheme };
    });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
