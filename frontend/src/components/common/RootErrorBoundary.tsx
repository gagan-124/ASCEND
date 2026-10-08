import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home, Sparkles } from 'lucide-react';

interface RootErrorBoundaryProps {
  error?: unknown;
  onReset?: () => void;
}

export function RootErrorBoundary({ error: propError, onReset }: RootErrorBoundaryProps) {
  const routeError = useRouteError();
  const error = propError || routeError;

  let errorMessage = "An unexpected error occurred while loading this page.";
  let isChunkError = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      errorMessage = "The page you are looking for could not be found.";
    } else {
      errorMessage = error.statusText || error.data?.message || errorMessage;
    }
  } else if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('ChunkLoadError')
    ) {
      isChunkError = true;
      errorMessage = "A newer version of the application was recently deployed or your network connection was interrupted.";
    } else if (import.meta.env.DEV) {
      errorMessage = error.message;
    }
  }

  // Developer diagnostics
  if (error) {
    console.error('[ASCEND RootErrorBoundary] Caught error:', error);
  }

  const handleRetry = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-6 transition-colors duration-200">
      <div className="max-w-md w-full p-8 bg-surface/90 border border-border/80 rounded-2xl shadow-xl backdrop-blur-md text-center space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-stardom text-base tracking-widest text-foreground font-bold">
            ASCEND
          </span>
        </div>

        {/* Error Icon */}
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-stardom text-foreground tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-foreground-muted leading-relaxed">
            We couldn't load this page correctly. Your data hasn't been deleted.
          </p>
          {isChunkError && (
            <p className="text-xs text-foreground-muted/80 bg-accent/5 border border-accent/20 rounded-md p-2 mt-2">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-surface hover:bg-surface-elevated text-foreground border border-border/80 font-sans text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
