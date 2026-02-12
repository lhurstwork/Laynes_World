import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { LocalStorageService } from './LocalStorageService';
import { AuthTokenStore } from './AuthTokenStore';
import type { Task } from '../types';

describe('Storage Property Tests', () => {
  let storage: LocalStorageService;
  let authStore: AuthTokenStore;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalStorageService();
    authStore = new AuthTokenStore(storage);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Property 6: Task persistence round-trip', () => {
    // Feature: laynes-world, Property 6: Task persistence round-trip
    // Validates: Requirements 2.6, 6.1, 6.3
    it('should preserve task data through save and load cycle', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            isComplete: fc.boolean(),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (task: Task) => {
            const key = `task_${task.id}`;
            
            // Save task to storage
            storage.save(key, task);
            
            // Load task from storage
            const loadedTask = storage.load<Task>(key);
            
            // Verify task was loaded
            expect(loadedTask).not.toBeNull();
            
            if (loadedTask) {
              // Verify all properties match
              expect(loadedTask.id).toBe(task.id);
              expect(loadedTask.description).toBe(task.description);
              expect(loadedTask.isComplete).toBe(task.isComplete);
              expect(new Date(loadedTask.createdAt).getTime()).toBe(task.createdAt.getTime());
              expect(new Date(loadedTask.updatedAt).getTime()).toBe(task.updatedAt.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Authentication token storage round-trip', () => {
    // Feature: laynes-world, Property 19: Authentication token storage round-trip
    // Validates: Requirements 6.2
    it('should preserve token through save and retrieve cycle', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // service name
          fc.string({ minLength: 10, maxLength: 200 }), // token
          fc.integer({ min: 60, max: 7200 }), // expiresInSeconds (1 min to 2 hours)
          (service, token, expiresInSeconds) => {
            // Save token
            authStore.saveToken(service, token, expiresInSeconds);
            
            // Retrieve token
            const retrievedToken = authStore.getToken(service);
            
            // Verify token matches
            expect(retrievedToken).toBe(token);
            
            // Verify token is valid
            expect(authStore.isTokenValid(service)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
