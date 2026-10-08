import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';

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
    return 'An account with this email address already exists. Please sign in.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for the confirmation email.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many authentication attempts. Please wait a moment and try again.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Network error. Unable to reach authentication server.';
  }
  return msg;
}

async function buildUserProfileFromSession(session: Session): Promise<UserProfile> {
  const email = session.user.email ?? '';
  let fullName = session.user.user_metadata?.full_name || email.split('@')[0];
  let avatarUrl = session.user.user_metadata?.avatar_url || undefined;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile) {
      fullName = profile.full_name || fullName;
      avatarUrl = profile.avatar_url || avatarUrl;
    }
  } catch {
    // Non-blocking: fallback to metadata if profile record is still syncing
  }

  return {
    id: session.user.id,
    email,
    fullName,
    avatarUrl,
    createdAt: session.user.created_at,
  };
}

export const authService = {
  /**
   * Initializes Supabase Auth listener and restores session on application mount.
   * Single source of truth: Supabase Auth session -> Auth Store -> UI.
   */
  async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const userProfile = await buildUserProfileFromSession(session);
        useAuthStore.getState().setAuth(userProfile, session.access_token);
      } else {
        useAuthStore.getState().clearAuth();
      }
    } catch (err) {
      console.error('[AUTH] Session restoration failed:', err);
      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().setInitialized(true);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH] Auth state changed: ${event}`);
      if (session && session.user) {
        const userProfile = await buildUserProfileFromSession(session);
        useAuthStore.getState().setAuth(userProfile, session.access_token);
      } else if (event === 'SIGNED_OUT' || !session) {
        useAuthStore.getState().clearAuth();
      }
    });
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AUTH] Sign out error:', err);
    }
    useAuthStore.getState().clearAuth();
  },

  async signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      if (data.session && data.user) {
        const userProfile = await buildUserProfileFromSession(data.session);
        useAuthStore.getState().setAuth(userProfile, data.session.access_token);
        return { success: true, user: userProfile };
      }

      return { success: false, message: 'Authentication failed. Please check your credentials.' };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },

  async signUpWithEmail(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/interview/setup`,
        },
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      // If email confirmation is disabled on Supabase, a session is returned immediately
      if (data.session && data.user) {
        const userProfile = await buildUserProfileFromSession(data.session);
        useAuthStore.getState().setAuth(userProfile, data.session.access_token);
        return { success: true, user: userProfile };
      }

      // If email confirmation is enabled, user is registered but requires email verification
      return {
        success: true,
        message: 'Account created! Please check your email inbox to confirm your account before signing in.',
      };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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

  async signInWithOAuth(provider: 'google' | 'github'): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/interview/setup`,
        },
      });

      if (error) {
        return { success: false, message: parseAuthError(error) };
      }

      // Supabase OAuth redirects the browser to the provider URL
      if (data?.url) {
        window.location.href = data.url;
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: parseAuthError(err) };
    }
  },
};
