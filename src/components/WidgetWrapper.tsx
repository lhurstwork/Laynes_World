import React from 'react';
import type { ReactNode } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import './WidgetWrapper.css';

interface WidgetWrapperProps {
  widgetId: string;
  title: string;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  onRetry?: () => void;
  children: ReactNode;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widgetId,
  title,
  isLoading = false,
  error = null,
  onRefresh,
  onRetry,
  children
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <WidgetErrorBoundary
      widgetId={widgetId}
      widgetTitle={title}
      onRetry={onRetry}
    >
      <article className="widget-wrapper" aria-labelledby={`${widgetId}-title`}>
        <div className="widget-header">
          <h2 id={`${widgetId}-title`} className="widget-title">{title}</h2>
          {onRefresh && (
            <button
              className="widget-refresh-button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label={`Refresh ${title}`}
              title="Refresh widget"
              type="button"
            >
              <svg
                className={`refresh-icon ${isLoading ? 'spinning' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span className="sr-only">
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          )}
        </div>

        <div className="widget-content">
          {isLoading && (
            <div 
              className="widget-loading-overlay" 
              role="status" 
              aria-live="polite"
              aria-label={`Loading ${title}`}
            >
              <div className="widget-loading-spinner" aria-hidden="true"></div>
              <p className="widget-loading-text">Loading...</p>
            </div>
          )}

          {error && (
            <div 
              className="widget-error-display" 
              role="alert" 
              aria-live="assertive"
            >
              <div className="error-icon" aria-hidden="true">⚠️</div>
              <p className="error-text">{error.message}</p>
              {onRetry && (
                <button
                  className="error-retry-button"
                  onClick={onRetry}
                  aria-label={`Retry loading ${title}`}
                  type="button"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!error && (
            <div className={`widget-body ${isLoading ? 'loading' : ''}`}>
              {children}
            </div>
          )}
        </div>
      </article>
    </WidgetErrorBoundary>
  );
};

export default WidgetWrapper;
