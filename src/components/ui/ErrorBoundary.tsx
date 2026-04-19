import * as React from 'react';
import { Alert, AlertTitle, AlertDescription, Button } from '../ui';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // @ts-ignore
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      // @ts-ignore
      if (this.props.fallback) {
        // @ts-ignore
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-2xl border-destructive/50 bg-destructive/5">
            <ShieldAlert className="w-5 h-5" />
            <AlertTitle className="font-mono font-bold uppercase tracking-widest text-lg mb-2">
              System Fault Detected
            </AlertTitle>
            <AlertDescription className="space-y-4">
              <p className="text-sm font-mono opacity-80">
                The application encountered an unhandled exception during the synthesis sequence.
              </p>
              <div className="p-4 bg-bg-deep rounded border border-[#28282b] font-mono text-[10px] overflow-auto max-h-[200px]">
                {/* @ts-ignore */}
                {this.state.error?.message || 'Unknown Error'}
              </div>
              <div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="font-mono text-[10px] gap-2"
                >
                  <RefreshCcw className="w-3 h-3" /> RELOAD_RUNTIME
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
