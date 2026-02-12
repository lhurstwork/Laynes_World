import { LocalStorageService } from './LocalStorageService';

/**
 * Token data structure with expiration information
 */
interface TokenData {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * AuthTokenStore manages authentication tokens with expiration checking
 * and secure storage. Uses LocalStorageService for persistence.
 */
export class AuthTokenStore {
  private storage: LocalStorageService;
  private readonly TOKEN_PREFIX = 'auth_token_';

  constructor(storage?: LocalStorageService) {
    this.storage = storage || new LocalStorageService();
  }

  /**
   * Save an authentication token with expiration time
   * @param service - Service identifier (e.g., 'google', 'outlook')
   * @param token - Authentication token
   * @param expiresInSeconds - Token lifetime in seconds (default: 3600 = 1 hour)
   */
  saveToken(service: string, token: string, expiresInSeconds: number = 3600): void {
    const expiresAt = Date.now() + (expiresInSeconds * 1000);
    const tokenData: TokenData = { token, expiresAt };
    const key = this.getKey(service);
    this.storage.save(key, tokenData);
  }

  /**
   * Retrieve an authentication token if it exists and is not expired
   * @param service - Service identifier
   * @returns Token string or null if not found or expired
   */
  getToken(service: string): string | null {
    const key = this.getKey(service);
    const tokenData = this.storage.load<TokenData>(key);
    
    if (!tokenData) {
      return null;
    }

    if (this.isExpired(tokenData)) {
      this.removeToken(service);
      return null;
    }

    return tokenData.token;
  }

  /**
   * Remove an authentication token
   * @param service - Service identifier
   */
  removeToken(service: string): void {
    const key = this.getKey(service);
    this.storage.remove(key);
  }

  /**
   * Check if a token exists and is valid (not expired)
   * @param service - Service identifier
   * @returns true if token exists and is valid
   */
  isTokenValid(service: string): boolean {
    return this.getToken(service) !== null;
  }

  /**
   * Get the storage key for a service
   */
  private getKey(service: string): string {
    return `${this.TOKEN_PREFIX}${service}`;
  }

  /**
   * Check if token data is expired
   */
  private isExpired(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expiresAt;
  }
}
