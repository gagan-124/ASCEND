import { create } from 'zustand';
import type { UserProfile } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true, isInitialized: true });
  },
  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
  },
  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },
}));


