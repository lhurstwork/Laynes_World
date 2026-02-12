/**
 * LocalStorageService provides a type-safe wrapper around browser localStorage
 * with error handling for quota exceeded and JSON serialization.
 */
export class LocalStorageService {
  /**
   * Save a value to localStorage with JSON serialization
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @throws Error if quota exceeded or serialization fails
   */
  save<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error(`Storage quota exceeded while saving key: ${key}`);
      }
      throw new Error(`Failed to save to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a value from localStorage with JSON deserialization
   * @param key - Storage key
   * @returns Deserialized value or null if key doesn't exist
   * @throws Error if deserialization fails
   */
  load<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as T;
    } catch (error) {
      throw new Error(`Failed to load from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a key from localStorage
   * @param key - Storage key to remove
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all data from localStorage
   */
  clear(): void {
    localStorage.clear();
  }
}
