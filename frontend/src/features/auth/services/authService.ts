import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/auth';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

export function parseAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';
  const msg = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : String(error);

  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email address already exists.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many authentication attempts. Please wait a moment and try again.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Network error. Unable to reach authentication server.';
  }
  return msg;
}

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!supabase) {
        // Fallback for local development if Supabase keys are not configured yet
        const mockUser: UserProfile = {
          id: 'dev_user_1',
          email,
          fullName: email.split('@')[0],
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
        };
        const token = 'ascend_token_dev_' + Date.now();
        useAuthStore.getState().setAuth(mockUser, token);
        return { success: true, user: mockUser };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      if (data.session && data.user) {
        let fullName = data.user.user_metadata?.full_name || email.split('@')[0];
        let avatarUrl = data.user.user_metadata?.avatar_url || undefined;

        // Fetch or create public.profiles record idempotently
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            fullName = profile.full_name || fullName;
            avatarUrl = profile.avatar_path || avatarUrl;
          } else {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
              avatar_path: avatarUrl || null,
            });
          }
        } catch {
          // Fall back gracefully if profile lookup fails
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email ?? email,
          fullName,
          avatarUrl,
          createdAt: data.user.created_at,
        };
        useAuthStore.getState().setAuth(userProfile, data.session.access_token);
        return { success: true, user: userProfile };
      }

      return { success: false, message: 'Authentication failed. Please try again.' };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },

  async signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!supabase) {
        // Fallback for local development
        const mockUser: UserProfile = {
          id: 'dev_user_' + Date.now(),
          email,
          fullName: email.split('@')[0],
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
        };
        const token = 'ascend_token_dev_' + Date.now();
        useAuthStore.getState().setAuth(mockUser, token);
        return { success: true, user: mockUser };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      if (data.session && data.user) {
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email ?? email,
          fullName: data.user.user_metadata?.full_name ?? email.split('@')[0],
          avatarUrl: undefined,
          createdAt: data.user.created_at,
        };
        useAuthStore.getState().setAuth(userProfile, data.session.access_token);
        return { success: true, user: userProfile };
      }

      return {
        success: true,
        message: 'Account created! Please check your email for confirmation instructions.',
      };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      if (!supabase) {
        return {
          success: true,
          message: 'Password reset instructions have been sent to your email.',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      return {
        success: true,
        message: 'Password reset instructions have been sent to your email.',
      };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },

  async signInWithOAuth(provider: 'google' | 'github' | 'azure'): Promise<AuthResponse> {
    try {
      if (!supabase) {
        // Dev fallback
        const mockUser: UserProfile = {
          id: `dev_${provider}_` + Date.now(),
          email: `candidate_${provider}@ascend.ai`,
          fullName: `Candidate (${provider.toUpperCase()})`,
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
        };
        const token = 'ascend_token_dev_oauth_' + Date.now();
        useAuthStore.getState().setAuth(mockUser, token);
        return { success: true, user: mockUser };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/interview/setup`,
        },
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },
};
