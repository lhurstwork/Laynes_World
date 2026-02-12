import { config } from '../config/environment';

/**
 * Utility function to retry a failed operation with exponential backoff
 * @param request - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default from config)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default from config)
 * @returns Promise resolving to the result of the request
 * @throws Error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
  request: () => Promise<T>,
  maxRetries: number = config.maxRetries,
  baseDelay: number = config.retryBaseDelay
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logError('Max retries exceeded', { attempt, maxRetries, error });
        throw error;
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      
      logError('Request failed, retrying...', {
        attempt: attempt + 1,
        maxRetries,
        nextRetryIn: `${delay}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Max retries exceeded');
}

/**
 * Sleep utility function
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Error logging utility
 * @param message - Error message
 * @param context - Additional context for the error
 */
function logError(message: string, context?: Record<string, any>): void {
  console.error(`[RetryWithBackoff] ${message}`, context || {});
}
