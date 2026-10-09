import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { LoadingButton } from '@/components/common';
import { authService } from '../services/authService';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface RecoveryFormProps {
  className?: string;
}

export const RecoveryForm: React.FC<RecoveryFormProps> = ({ className }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(email);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset instructions sent to your email.');
      } else {
        setErrorMessage(res.message || 'Unable to send password reset email.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-surface border border-border/60 text-foreground',
        'shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] select-none',
        'transition-colors duration-150',
        className
      )}
    >
      {/* Form Header */}
      <div className="flex flex-col items-center text-center select-none mb-6 sm:mb-8">
        <Link to="/" aria-label="Return to Home" className="mb-4 inline-block">
          <AscendLogo size="md" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-stardom font-normal text-foreground uppercase tracking-tight">
          Reset password
        </h1>
        <p className="text-xs sm:text-sm font-sans text-foreground/70 mt-1">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:bg-red-950/50 dark:border-red-800/60 dark:text-red-300 flex items-start gap-2.5 text-xs sm:text-sm font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Feedback Banner */}
      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/60 dark:text-emerald-300 flex items-start gap-2.5 text-xs sm:text-sm font-sans">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Email Recovery Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recovery-email" className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground/80 select-none">
            Email
          </label>
          <input
            id="recovery-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@company.com"
            disabled={isLoading}
            className={cn(
              'h-11 px-3.5 rounded-lg bg-background/80 dark:bg-background/30 border border-border/80 dark:border-border/40 text-foreground text-sm',
              'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40',
              'transition-all duration-150'
            )}
          />
        </div>

        {/* Tactile Primary Button */}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="SENDING..."
          className={cn(
            'mt-2 h-11 w-full rounded-xl font-mono text-xs font-semibold uppercase tracking-widest text-background bg-foreground',
            'shadow-[2px_2px_8px_rgba(0,0,0,0.12)] active:scale-[0.99]',
            'hover:opacity-95'
          )}
        >
          SEND RESET LINK
        </LoadingButton>
      </form>

      {/* Switch to Login Link */}
      <div className="mt-6 text-center text-xs font-sans text-foreground/70 select-none">
        Remembered your password?{' '}
        <Link
          to="/auth/login"
          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 rounded"
        >
          Back to Sign in
        </Link>
      </div>
    </div>

  );
};
