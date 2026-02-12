import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { logError } from '../utils/errorLogger';
import './WidgetErrorBoundary.css';

interface WidgetErrorBoundaryProps {
  widgetId: string;
  widgetTitle: string;
  onRetry?: () => void;
  children: ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logError('Widget Error', {
      error,
      errorInfo,
      widgetId: this.props.widgetId,
      widgetTitle: this.props.widgetTitle
    });

    this.setState({
      errorInfo
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          error={this.state.error}
          widgetTitle={this.props.widgetTitle}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface WidgetErrorFallbackProps {
  error: Error | null;
  widgetTitle: string;
  onRetry: () => void;
}

const WidgetErrorFallback: React.FC<WidgetErrorFallbackProps> = ({ error, widgetTitle, onRetry }) => {
  return (
    <div className="widget-error-fallback">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">Error in {widgetTitle}</h3>
      <p className="error-message">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button 
        className="retry-button"
        onClick={onRetry}
        aria-label={`Retry loading ${widgetTitle}`}
      >
        Retry
      </button>
    </div>
  );
};

export default WidgetErrorBoundary;
