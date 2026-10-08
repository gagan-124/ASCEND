import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { LoadingButton } from '@/components/common';
import { OAuthButtons } from './OAuthButtons';
import { authService } from '../services/authService';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SignupFormProps {
  className?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/interview/setup';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submissions

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
      setErrorMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy before continuing.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signUpWithEmail(email, password, fullName);
      if (res.success) {
        if (res.user) {
          const isOnboarded = useProfileStore.getState().isOnboarded;
          navigate(isOnboarded ? redirectTarget : '/onboarding', { replace: true });
        } else {
          setSuccessMessage(
            res.message || 'Account created! Please check your email inbox to confirm your account before signing in.'
          );
        }
      } else {
        setErrorMessage(res.message || 'Sign up failed. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy before continuing.');
      return;
    }
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
        'w-full max-w-[480px] mx-auto p-6 sm:p-7 rounded-2xl bg-surface border border-border/60 text-foreground',
        'shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
        'transition-colors duration-150',
        className
      )}
    >
      {/* Form Header */}
      <div className="flex flex-col items-center text-center select-none mb-5">
        <Link to="/" aria-label="Return to Home" className="mb-3 inline-block">
          <AscendLogo size="md" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-stardom font-normal text-foreground uppercase tracking-tight">
          Create account
        </h1>
        <p className="text-xs sm:text-sm font-sans text-foreground/70 mt-1">
          Start practicing with AI-powered mock interviews
        </p>
      </div>

      {/* Error Feedback Banner with high contrast in both themes */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:bg-red-950/50 dark:border-red-800/60 dark:text-red-300 flex items-start gap-2.5 text-xs sm:text-sm font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Feedback Banner */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300 flex items-start gap-2.5 text-xs sm:text-sm font-sans">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* OAuth Icon Buttons */}
      <div className="mb-4">
        <OAuthButtons onSelectProvider={handleOAuth} isLoading={isLoading} />
      </div>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <span className="relative px-3 bg-surface text-[11px] font-mono uppercase tracking-widest text-foreground/50 select-none">
          OR
        </span>
      </div>

      {/* Email / Password Credentials Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-sans">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-name" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/80 select-none">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Maya Chen"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/80 select-none">
            Email
          </label>
          <input
            id="signup-email"
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

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-password" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/80 select-none">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 chars (upper, lower, number)"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-confirm-password" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/80 select-none">
            Confirm Password
          </label>
          <input
            id="signup-confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Mandatory Legal & Privacy Consent Checkbox */}
        <div className="flex items-start gap-2.5 my-1 text-xs text-foreground/80">
          <input
            id="signup-agree-terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading}
            className="mt-0.5 w-4 h-4 rounded border-border/60 text-foreground focus:ring-foreground cursor-pointer shrink-0 accent-foreground"
          />
          <label htmlFor="signup-agree-terms" className="text-[11px] sm:text-xs leading-normal text-foreground/90 cursor-pointer font-sans select-none">
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="font-semibold text-foreground underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground">
              Terms &amp; Conditions
            </Link>{' '}
            and acknowledge the{' '}
            <Link to="/privacy" target="_blank" className="font-semibold text-foreground underline hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground">
              Privacy Policy
            </Link>.
          </label>
        </div>

        {/* Tactile Primary Button */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          disabled={!agreedToTerms || isLoading}
          loadingText="CREATING ACCOUNT..."
          className={cn(
            'mt-1 h-11 w-full rounded-xl font-mono text-xs font-semibold uppercase tracking-widest text-background bg-foreground',
            'shadow-[2px_2px_8px_rgba(0,0,0,0.12)] active:scale-[0.99]',
            'hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          CREATE ACCOUNT
        </LoadingButton>
      </form>

      {/* Switch to Login Link */}
      <div className="mt-5 text-center text-xs font-sans text-foreground/70 select-none">
        Already have an account?{' '}
        <Link
          to={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
