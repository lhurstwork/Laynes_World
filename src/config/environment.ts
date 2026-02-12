/**
 * Environment Configuration
 * Centralizes access to environment variables with type safety and validation
 */

interface EnvironmentConfig {
  // API Base URLs
  newsApiUrl: string;
  youtubeApiUrl: string;
  dealsApiUrl: string;
  googleCalendarApiUrl: string;
  outlookCalendarApiUrl: string;

  // API Keys
  newsApiKey: string;
  youtubeApiKey: string;
  dealsApiKey: string;

  // OAuth Configuration
  googleClientId: string;
  outlookClientId: string;
  googleRedirectUri: string;
  outlookRedirectUri: string;

  // Application Settings
  appEnv: 'development' | 'production';
  useMockData: boolean;
  apiTimeout: number;
  maxRetries: number;
  retryBaseDelay: number;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined || value === null) return defaultValue;
  return value === 'true' || value === true;
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Environment configuration object
 */
export const config: EnvironmentConfig = {
  // API Base URLs
  newsApiUrl: getEnvVar('VITE_NEWS_API_URL', 'http://localhost:5173/api/mock/news'),
  youtubeApiUrl: getEnvVar('VITE_YOUTUBE_API_URL', 'https://www.googleapis.com/youtube/v3'),
  dealsApiUrl: getEnvVar('VITE_DEALS_API_URL', 'http://localhost:5173/api/mock/deals'),
  googleCalendarApiUrl: getEnvVar('VITE_GOOGLE_CALENDAR_API_URL', 'https://www.googleapis.com/calendar/v3'),
  outlookCalendarApiUrl: getEnvVar('VITE_OUTLOOK_CALENDAR_API_URL', 'https://graph.microsoft.com/v1.0'),

  // API Keys
  newsApiKey: getEnvVar('VITE_NEWS_API_KEY', 'dev_news_api_key'),
  youtubeApiKey: getEnvVar('VITE_YOUTUBE_API_KEY', 'dev_youtube_api_key'),
  dealsApiKey: getEnvVar('VITE_DEALS_API_KEY', 'dev_deals_api_key'),

  // OAuth Configuration
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', 'dev_google_client_id'),
  outlookClientId: getEnvVar('VITE_OUTLOOK_CLIENT_ID', 'dev_outlook_client_id'),
  googleRedirectUri: getEnvVar('VITE_GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback'),
  outlookRedirectUri: getEnvVar('VITE_OUTLOOK_REDIRECT_URI', 'http://localhost:5173/auth/outlook/callback'),

  // Application Settings
  appEnv: (getEnvVar('VITE_APP_ENV', 'development') as 'development' | 'production'),
  useMockData: getBooleanEnvVar('VITE_USE_MOCK_DATA', false), // Changed to false to use real RSS data by default
  apiTimeout: getNumberEnvVar('VITE_API_TIMEOUT', 10000),
  maxRetries: getNumberEnvVar('VITE_MAX_RETRIES', 3),
  retryBaseDelay: getNumberEnvVar('VITE_RETRY_BASE_DELAY', 1000),
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return config.appEnv === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return config.appEnv === 'production';
};

/**
 * Validate required environment variables
 */
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // In production, ensure real API keys are provided
  if (isProduction()) {
    if (config.newsApiKey === 'dev_news_api_key') {
      errors.push('VITE_NEWS_API_KEY must be set in production');
    }
    if (config.youtubeApiKey === 'dev_youtube_api_key') {
      errors.push('VITE_YOUTUBE_API_KEY must be set in production');
    }
    if (config.dealsApiKey === 'dev_deals_api_key') {
      errors.push('VITE_DEALS_API_KEY must be set in production');
    }
    if (config.googleClientId === 'dev_google_client_id') {
      errors.push('VITE_GOOGLE_CLIENT_ID must be set in production');
    }
    if (config.outlookClientId === 'dev_outlook_client_id') {
      errors.push('VITE_OUTLOOK_CLIENT_ID must be set in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default config;
