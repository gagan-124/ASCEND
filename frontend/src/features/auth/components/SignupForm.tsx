import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { LoadingButton } from '@/components/common';
import { OAuthButtons } from './OAuthButtons';
import { authService } from '../services/authService';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface SignupFormProps {
  className?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/interview/setup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
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
      const res = await authService.signUpWithEmail(email, password);
      if (res.success) {
        if (res.user) {
          navigate(redirectTarget, { replace: true });
        } else {
          setErrorMessage(res.message || 'Account created successfully.');
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

  const handleOAuth = async (provider: 'google' | 'github' | 'azure') => {
    setErrorMessage(null);
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy before continuing.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.signInWithOAuth(provider);
      if (res.success && !res.message) {
        navigate(redirectTarget, { replace: true });
      } else if (!res.success) {
        setErrorMessage(res.message || `Unable to sign in with ${provider}.`);
      }
    } catch {
      setErrorMessage('Failed to connect to authentication provider.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[480px] mx-auto p-6 sm:p-7 rounded-2xl bg-surface border border-border/40',
        'shadow-[0_4px_24px_rgba(16,44,87,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
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
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Start practicing with AI-powered mock interviews
        </p>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs sm:text-sm font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* OAuth Icon Buttons */}
      <div className="mb-4">
        <OAuthButtons onSelectProvider={handleOAuth} isLoading={isLoading} />
      </div>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <span className="relative px-3 bg-surface text-[11px] font-mono uppercase tracking-widest text-foreground/40 select-none">
          OR
        </span>
      </div>

      {/* Email / Password Credentials Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-sans">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/60 select-none">
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
              'h-10 px-3.5 rounded-lg bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-password" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/60 select-none">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
            className={cn(
              'h-10 px-3.5 rounded-lg bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-confirm-password" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/60 select-none">
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
              'h-10 px-3.5 rounded-lg bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Mandatory Legal & Privacy Consent Checkbox (Positioned directly above Submit Button) */}
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
      <div className="mt-5 text-center text-xs font-sans text-foreground/60 select-none">
        Already have an account?{' '}
        <Link
          to={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
