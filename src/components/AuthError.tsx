import React from 'react';
import './AuthError.css';

export type AuthErrorType = 
  | 'token_expired'
  | 'authentication_failed'
  | 'invalid_credentials'
  | 'network_error'
  | 'unknown';

export const AuthErrorType = {
  TOKEN_EXPIRED: 'token_expired' as AuthErrorType,
  AUTHENTICATION_FAILED: 'authentication_failed' as AuthErrorType,
  INVALID_CREDENTIALS: 'invalid_credentials' as AuthErrorType,
  NETWORK_ERROR: 'network_error' as AuthErrorType,
  UNKNOWN: 'unknown' as AuthErrorType
};

interface AuthErrorProps {
  errorType: AuthErrorType;
  serviceName: string;
  message?: string;
  onReAuthenticate: () => void;
  onDismiss?: () => void;
}

const AuthError: React.FC<AuthErrorProps> = ({
  errorType,
  serviceName,
  message,
  onReAuthenticate,
  onDismiss
}) => {
  const getErrorTitle = (): string => {
    switch (errorType) {
      case AuthErrorType.TOKEN_EXPIRED:
        return 'Session Expired';
      case AuthErrorType.AUTHENTICATION_FAILED:
        return 'Authentication Failed';
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Invalid Credentials';
      case AuthErrorType.NETWORK_ERROR:
        return 'Connection Error';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorMessage = (): string => {
    if (message) {
      return message;
    }

    switch (errorType) {
      case AuthErrorType.TOKEN_EXPIRED:
        return `Your ${serviceName} session has expired. Please sign in again to continue.`;
      case AuthErrorType.AUTHENTICATION_FAILED:
        return `Failed to authenticate with ${serviceName}. Please try again.`;
      case AuthErrorType.INVALID_CREDENTIALS:
        return `The credentials for ${serviceName} are invalid. Please sign in again.`;
      case AuthErrorType.NETWORK_ERROR:
        return `Unable to connect to ${serviceName}. Please check your internet connection and try again.`;
      default:
        return `An error occurred while authenticating with ${serviceName}.`;
    }
  };

  return (
    <div className="auth-error-container" role="alert" aria-live="assertive">
      <div className="auth-error-content">
        <div className="auth-error-icon">🔒</div>
        <h3 className="auth-error-title">{getErrorTitle()}</h3>
        <p className="auth-error-message">{getErrorMessage()}</p>
        <div className="auth-error-actions">
          <button
            className="auth-error-button primary"
            onClick={onReAuthenticate}
            aria-label={`Re-authenticate with ${serviceName}`}
          >
            Sign In Again
          </button>
          {onDismiss && (
            <button
              className="auth-error-button secondary"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthError;
