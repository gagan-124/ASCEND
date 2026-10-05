import { create } from 'zustand';
import type { UserProfile } from '@/types/auth';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('ascend_auth_token'),
  isAuthenticated: Boolean(localStorage.getItem('ascend_auth_token')),
  setAuth: (user, token) => {
    localStorage.setItem('ascend_auth_token', token);
    set({ user, token, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('ascend_auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
