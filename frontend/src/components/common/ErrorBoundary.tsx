import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ASCEND ErrorBoundary] Uncaught React rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-8 bg-surface/50 border border-border/60 rounded-2xl shadow-xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-stardom text-foreground uppercase tracking-tight">
                Application Error
              </h2>
              <p className="text-xs font-mono text-foreground-muted">
                An unexpected interface rendering exception occurred.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-surface/80 border border-border/40 text-[11px] font-mono text-red-400 text-left overflow-x-auto rounded-lg max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-primary text-primary-foreground font-sans text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RETURN TO HOME</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
