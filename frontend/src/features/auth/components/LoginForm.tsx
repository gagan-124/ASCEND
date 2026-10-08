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
        'w-full max-w-[420px] mx-auto p-6 sm:p-7 rounded-2xl bg-[#0c1322] border border-slate-800/80',
        'shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-slate-100 select-none',
        'transition-colors duration-150',
        className
      )}
    >
      {/* Form Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <Link to="/" aria-label="Return to Home" className="mb-3 inline-block">
          <AscendLogo size="md" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-stardom font-normal text-slate-100 uppercase tracking-tight">
          WELCOME BACK
        </h1>
        <p className="text-xs font-sans text-slate-400 mt-1">
          Sign in to continue your interview practice
        </p>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/50 text-red-300 flex items-start gap-2.5 text-xs font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
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
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative px-3 bg-[#0c1322] text-[10px] font-mono uppercase tracking-widest text-slate-400">
          OR
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="auth-email"
            className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-300"
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
              'h-10 px-3.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-100 text-sm',
              'placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50',
              'transition-all duration-150'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-300"
            >
              PASSWORD
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-sans text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 rounded"
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
              'h-10 px-3.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-100 text-sm',
              'placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/50',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Tactile Cream/Off-white Primary SIGN IN Button */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="SIGNING IN..."
          className={cn(
            'mt-1 h-10 w-full rounded-xl font-mono text-xs font-semibold uppercase tracking-widest text-slate-950 bg-[#fef3c7] hover:bg-[#fde68a]',
            'shadow-[0_2px_8px_rgba(254,243,199,0.15)] active:scale-[0.99]'
          )}
        >
          SIGN IN
        </LoadingButton>
      </form>

      {/* Sign Up Link */}
      <div className="mt-5 text-center text-xs font-sans text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          to={`/auth/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-slate-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 rounded"
        >
          Sign up
        </Link>
      </div>

      {/* Subtle Legal Navigation Row */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400 select-none">
        <Link
          to="/privacy"
          className="hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 rounded"
        >
          Privacy Policy
        </Link>
        <span>·</span>
        <Link
          to="/terms"
          className="hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40 rounded"
        >
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
};
