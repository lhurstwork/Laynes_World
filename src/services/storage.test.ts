import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageService } from './LocalStorageService';
import { AuthTokenStore } from './AuthTokenStore';

describe('LocalStorageService Edge Cases', () => {
  let storage: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageService();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Storage quota exceeded handling', () => {
    it('should throw error when storage quota is exceeded', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      expect(() => storage.save('test-key', { data: 'test' }))
        .toThrow('Storage quota exceeded while saving key: test-key');
    });

    it('should handle quota exceeded with large data', () => {
      const largeData = { content: 'x'.repeat(10000000) }; // 10MB string
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      expect(() => storage.save('large-key', largeData))
        .toThrow('Storage quota exceeded while saving key: large-key');
    });
  });

  describe('Invalid JSON handling', () => {
    it('should throw error when loading invalid JSON', () => {
      // Manually set invalid JSON in localStorage
      localStorage.setItem('invalid-json', '{invalid json}');

      expect(() => storage.load('invalid-json'))
        .toThrow('Failed to load from localStorage');
    });

    it('should throw error when loading malformed JSON', () => {
      localStorage.setItem('malformed', '{"key": "value"');

      expect(() => storage.load('malformed'))
        .toThrow('Failed to load from localStorage');
    });

    it('should throw error when loading non-JSON string', () => {
      localStorage.setItem('not-json', 'just a plain string');

      expect(() => storage.load('not-json'))
        .toThrow('Failed to load from localStorage');
    });
  });

  describe('Missing key handling', () => {
    it('should return null when loading non-existent key', () => {
      const result = storage.load('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return null after removing a key', () => {
      storage.save('temp-key', { data: 'test' });
      storage.remove('temp-key');
      
      const result = storage.load('temp-key');
      expect(result).toBeNull();
    });

    it('should return null after clearing storage', () => {
      storage.save('key1', { data: 'test1' });
      storage.save('key2', { data: 'test2' });
      storage.clear();
      
      expect(storage.load('key1')).toBeNull();
      expect(storage.load('key2')).toBeNull();
    });

    it('should handle loading empty string key', () => {
      const result = storage.load('');
      expect(result).toBeNull();
    });
  });
});

describe('AuthTokenStore Edge Cases', () => {
  let storage: LocalStorageService;
  let authStore: AuthTokenStore;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageService();
    authStore = new AuthTokenStore(storage);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Storage quota exceeded handling', () => {
    it('should throw error when token storage quota is exceeded', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      expect(() => authStore.saveToken('google', 'test-token'))
        .toThrow('Storage quota exceeded');
    });
  });

  describe('Invalid JSON handling', () => {
    it('should throw error when token data is corrupted', () => {
      localStorage.setItem('auth_token_google', '{invalid}');

      expect(() => authStore.getToken('google'))
        .toThrow('Failed to load from localStorage');
    });

    it('should handle malformed token data gracefully', () => {
      localStorage.setItem('auth_token_outlook', '{"token": "abc"');

      expect(() => authStore.getToken('outlook'))
        .toThrow('Failed to load from localStorage');
    });
  });

  describe('Missing key handling', () => {
    it('should return null for non-existent service token', () => {
      const token = authStore.getToken('non-existent-service');
      expect(token).toBeNull();
    });

    it('should return false for isTokenValid with missing token', () => {
      const isValid = authStore.isTokenValid('missing-service');
      expect(isValid).toBe(false);
    });

    it('should return null after removing token', () => {
      authStore.saveToken('github', 'test-token');
      authStore.removeToken('github');
      
      const token = authStore.getToken('github');
      expect(token).toBeNull();
    });

    it('should handle empty service name', () => {
      authStore.saveToken('', 'test-token');
      const token = authStore.getToken('');
      expect(token).toBe('test-token');
    });
  });
});
