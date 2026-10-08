import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { LoadingButton } from '@/components/common';
import { OAuthButtons } from './OAuthButtons';
import { authService } from '../services/authService';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/interview/setup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signInWithEmail(email, password);
      if (res.success) {
        const isOnboarded = useProfileStore.getState().isOnboarded;
        navigate(isOnboarded ? redirectTarget : '/onboarding', { replace: true });
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await authService.signInWithOAuth(provider);
      if (!res.success) {
        setErrorMessage(res.message || `Unable to connect to ${provider}.`);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Failed to connect to authentication provider.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[420px] mx-auto p-6 sm:p-7 rounded-2xl bg-surface border border-border/60 text-foreground',
        'shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] select-none',
        'transition-colors duration-150',
        className
      )}
    >
      {/* Form Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <Link to="/" aria-label="Return to Home" className="mb-3 inline-block">
          <AscendLogo size="md" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-stardom font-normal text-foreground uppercase tracking-tight">
          WELCOME BACK
        </h1>
        <p className="text-xs font-sans text-foreground/70 mt-1">
          Sign in to continue your interview practice
        </p>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:bg-red-950/50 dark:border-red-800/60 dark:text-red-300 flex items-start gap-2.5 text-xs font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Social OAuth Buttons */}
      <div className="mb-5">
        <OAuthButtons onSelectProvider={handleOAuth} isLoading={isLoading} />
      </div>

      {/* OR Divider */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <span className="relative px-3 bg-surface text-[10px] font-mono uppercase tracking-widest text-foreground/50">
          OR
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="auth-email"
            className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/80"
          >
            EMAIL
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@company.com"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/80"
            >
              PASSWORD
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-sans text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="auth-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Primary SIGN IN Button */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="SIGNING IN..."
          className={cn(
            'mt-1 h-10 w-full rounded-xl font-mono text-xs font-semibold uppercase tracking-widest text-background bg-foreground',
            'shadow-[2px_2px_8px_rgba(0,0,0,0.12)] active:scale-[0.99] hover:opacity-95'
          )}
        >
          SIGN IN
        </LoadingButton>
      </form>

      {/* Sign Up Link */}
      <div className="mt-5 text-center text-xs font-sans text-foreground/70">
        Don&apos;t have an account?{' '}
        <Link
          to={`/auth/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Sign up
        </Link>
      </div>

      {/* Subtle Legal Navigation Row */}
      <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-center gap-2 text-[11px] font-mono text-foreground/50 select-none">
        <Link
          to="/privacy"
          className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Privacy Policy
        </Link>
        <span>·</span>
        <Link
          to="/terms"
          className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
};
