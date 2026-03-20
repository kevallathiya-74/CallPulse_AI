import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 glass-card m-4">
          <AlertTriangle size={48} className="text-warning mb-4" />
          <h2 className="heading-md text-text-primary mb-2">Something went wrong</h2>
          <p className="text-text-muted text-sm mb-6 text-center max-w-md">
            An unexpected error occurred in this section. You can try refreshing, or continue using other parts of the application.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border border-primary/30 text-primary rounded-[50px] text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
