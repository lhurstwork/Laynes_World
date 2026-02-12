// Error categories for classification
export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'validation'
  | 'widget'
  | 'storage'
  | 'unknown';

export const ErrorCategory = {
  NETWORK: 'network' as ErrorCategory,
  AUTHENTICATION: 'authentication' as ErrorCategory,
  VALIDATION: 'validation' as ErrorCategory,
  WIDGET: 'widget' as ErrorCategory,
  STORAGE: 'storage' as ErrorCategory,
  UNKNOWN: 'unknown' as ErrorCategory
};

// Error log entry structure
export interface ErrorLogEntry {
  category: ErrorCategory;
  message: string;
  timestamp: Date;
  context: ErrorContext;
  stackTrace?: string;
}

// Context information for errors
export interface ErrorContext {
  widgetId?: string;
  widgetTitle?: string;
  userId?: string;
  url?: string;
  [key: string]: any;
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /token[s]?[:\s=]+[^\s&]+/gi,
  /password[s]?[:\s=]+[^\s&]+/gi,
  /api[_-]?key[s]?[:\s=]+[^\s&]+/gi,
  /secret[s]?[:\s=]+[^\s&]+/gi,
  /authorization[:\s=]+[^\s&]+/gi,
  /bearer\s+[^\s&]+/gi,
  /access[_-]?token[:\s=]+[^\s&]+/gi,
  /refresh[_-]?token[:\s=]+[^\s&]+/gi,
  /client[_-]?secret[:\s=]+[^\s&]+/gi,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
  /\b\d{16}\b/g // Credit card pattern
];

// Redact sensitive data from strings
function redactSensitiveData(data: any): any {
  if (typeof data === 'string') {
    let redacted = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });
    return redacted;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  if (data && typeof data === 'object') {
    const redacted: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Redact entire value if key name suggests sensitive data
        if (isSensitiveKey(key)) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = redactSensitiveData(data[key]);
        }
      }
    }
    return redacted;
  }

  return data;
}

// Check if a key name suggests sensitive data
function isSensitiveKey(key: string): boolean {
  const sensitiveKeys = [
    'token',
    'password',
    'secret',
    'apikey',
    'api_key',
    'authorization',
    'auth',
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'clientsecret',
    'client_secret',
    'ssn',
    'creditcard',
    'credit_card',
    'cvv',
    'pin'
  ];

  const lowerKey = key.toLowerCase().replace(/[-_\s]/g, '');
  return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
}

// Categorize error based on error message and type
function categorizeError(error: Error, context?: ErrorContext): ErrorCategory {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }

  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ErrorCategory.VALIDATION;
  }

  if (message.includes('storage') || message.includes('quota') || message.includes('localstorage')) {
    return ErrorCategory.STORAGE;
  }

  if (context?.widgetId) {
    return ErrorCategory.WIDGET;
  }

  return ErrorCategory.UNKNOWN;
}

// Main error logging function
export function logError(
  message: string,
  context?: ErrorContext & { error?: Error; errorInfo?: any }
): void {
  const { error, errorInfo, ...cleanContext } = context || {};
  
  // Redact sensitive data from context
  const redactedContext = redactSensitiveData(cleanContext);

  // Create error log entry
  const logEntry: ErrorLogEntry = {
    category: error ? categorizeError(error, cleanContext) : ErrorCategory.UNKNOWN,
    message: redactSensitiveData(message),
    timestamp: new Date(),
    context: redactedContext,
    stackTrace: error?.stack ? redactSensitiveData(error.stack) : undefined
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Log]', logEntry);
    if (errorInfo) {
      console.error('[Component Stack]', errorInfo.componentStack);
    }
  }

  // In production, you would send this to a logging service
  // Example: sendToLoggingService(logEntry);

  // Store recent errors in memory for debugging (limit to last 50)
  storeErrorInMemory(logEntry);
}

// In-memory error storage for debugging
const errorHistory: ErrorLogEntry[] = [];
const MAX_ERROR_HISTORY = 50;

function storeErrorInMemory(logEntry: ErrorLogEntry): void {
  errorHistory.push(logEntry);
  if (errorHistory.length > MAX_ERROR_HISTORY) {
    errorHistory.shift();
  }
}

// Get recent errors for debugging
export function getRecentErrors(): ErrorLogEntry[] {
  return [...errorHistory];
}

// Clear error history
export function clearErrorHistory(): void {
  errorHistory.length = 0;
}

// Export for testing
export { redactSensitiveData, categorizeError, isSensitiveKey };
