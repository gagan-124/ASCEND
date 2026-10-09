import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { authService, parseAuthError } from '@/features/auth/services/authService';
import { useProfileStore } from '@/stores/profileStore';
import { AppSessionLoader } from '@/components/common';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';

/**
 * AuthCallbackPage
 * Handles OAuth redirects and email verification tokens.
 * Awaits session establishment, syncs profile state, and routes to /onboarding or /interview/setup.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for error parameters returned from auth provider (e.g. user cancelled consent)
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        const message = errorDescription || error || 'Authentication was cancelled or failed.';
        if (isMounted) {
          setErrorMsg(parseAuthError(message));
        }
        return;
      }

      try {
        // 2. Initialize auth and await session establishment
        // Supabase client auto-exchanges PKCE code from URL and populates session
        await authService.initializeAuth();

        // 3. Verify that session is established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          console.error('[AUTH_CALLBACK] No valid session established:', sessionError?.message);
          if (isMounted) {
            setErrorMsg('Unable to verify authentication session. Please try signing in again.');
          }
          return;
        }

        // 4. Check onboarding status to route correctly
        const isOnboarded = useProfileStore.getState().isOnboarded;
        const targetRoute = isOnboarded ? '/interview/setup' : '/onboarding';

        if (isMounted) {
          navigate(targetRoute, { replace: true });
        }
      } catch (err) {
        console.error('[AUTH_CALLBACK] Unexpected callback handling error:', err);
        if (isMounted) {
          setErrorMsg('An unexpected error occurred during authentication. Please try signing in again.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface border border-border text-center shadow-lg">
          <Link to="/" aria-label="Return to Home" className="mb-4 inline-block">
            <AscendLogo size="md" />
          </Link>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-stardom text-foreground uppercase tracking-tight mb-2">
            Authentication Error
          </h2>
          <p className="text-xs sm:text-sm text-foreground/70 mb-6 font-sans">
            {errorMsg}
          </p>
          <Link
            to="/auth/login"
            replace
            className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold font-mono hover:opacity-90 transition-opacity"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <AppSessionLoader statusText="Authenticating session..." />;
}
