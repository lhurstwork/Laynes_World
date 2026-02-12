import { AuthTokenStore } from '../services/AuthTokenStore';
import { logError, ErrorCategory } from './errorLogger';
import type { AuthErrorType } from '../components/AuthError';
import { AuthErrorType as AuthErrorTypeValues } from '../components/AuthError';

/**
 * Authentication error class for better error handling
 */
export class AuthenticationError extends Error {
  public errorType: AuthErrorType;
  public serviceName: string;

  constructor(
    message: string,
    errorType: AuthErrorType,
    serviceName: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
    this.errorType = errorType;
    this.serviceName = serviceName;
  }
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (error instanceof AuthenticationError) {
    return true;
  }

  // Check for common auth error patterns
  const message = error?.message?.toLowerCase() || '';
  const status = error?.response?.status;

  return (
    status === 401 ||
    status === 403 ||
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('token') ||
    message.includes('expired')
  );
}

/**
 * Determine the auth error type from an error
 */
export function getAuthErrorType(error: any): AuthErrorType {
  if (error instanceof AuthenticationError) {
    return error.errorType;
  }

  const message = error?.message?.toLowerCase() || '';
  const status = error?.response?.status;

  if (message.includes('expired') || message.includes('token')) {
    return AuthErrorTypeValues.TOKEN_EXPIRED;
  }

  if (status === 401) {
    return AuthErrorTypeValues.INVALID_CREDENTIALS;
  }

  if (status === 403) {
    return AuthErrorTypeValues.AUTHENTICATION_FAILED;
  }

  if (message.includes('network') || message.includes('fetch')) {
    return AuthErrorTypeValues.NETWORK_ERROR;
  }

  return AuthErrorTypeValues.UNKNOWN;
}

/**
 * Handle authentication errors with logging and token cleanup
 */
export function handleAuthError(
  error: any,
  serviceName: string,
  authTokenStore: AuthTokenStore
): AuthenticationError {
  const errorType = getAuthErrorType(error);
  
  // Log the error
  logError(`Authentication error for ${serviceName}`, {
    error,
    serviceName,
    errorType
  });

  // Remove invalid token
  authTokenStore.removeToken(serviceName);

  // Create and return authentication error
  return new AuthenticationError(
    error.message || `Authentication failed for ${serviceName}`,
    errorType,
    serviceName
  );
}

/**
 * Check if a token is expired and handle accordingly
 */
export function checkTokenExpiration(
  serviceName: string,
  authTokenStore: AuthTokenStore
): boolean {
  const isValid = authTokenStore.isTokenValid(serviceName);
  
  if (!isValid) {
    logError(`Token expired for ${serviceName}`, {
      serviceName,
      category: ErrorCategory.AUTHENTICATION
    });
    return true;
  }
  
  return false;
}

/**
 * Create a re-authentication handler
 */
export function createReAuthHandler(
  serviceName: string,
  authCallback: () => Promise<void>
): () => Promise<void> {
  return async () => {
    try {
      await authCallback();
    } catch (error) {
      logError(`Re-authentication failed for ${serviceName}`, {
        error: error as Error,
        serviceName
      });
      throw error;
    }
  };
}

/**
 * Wrap an API call with authentication error handling
 */
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  serviceName: string,
  authTokenStore: AuthTokenStore
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (isAuthError(error)) {
      throw handleAuthError(error, serviceName, authTokenStore);
    }
    throw error;
  }
}
