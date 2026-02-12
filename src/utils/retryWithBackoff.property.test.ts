import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { retryWithBackoff } from './retryWithBackoff';

describe('Retry Logic Property Tests', () => {
  describe('Property 23: Network retry with exponential backoff', () => {
    // Feature: laynes-world, Property 23: Network retry with exponential backoff
    // Validates: Requirements 8.2
    it('should retry with exponentially increasing delays', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // maxRetries (reduced for faster tests)
          fc.integer({ min: 50, max: 150 }), // baseDelay
          fc.integer({ min: 1, max: 5 }), // failureCount (reduced for faster tests)
          async (maxRetries, baseDelay, failureCount) => {
            const timestamps: number[] = [];
            let attemptCount = 0;
            
            // Create a request that fails a specific number of times
            const request = async () => {
              timestamps.push(Date.now());
              attemptCount++;
              if (attemptCount <= failureCount) {
                throw new Error(`Attempt ${attemptCount} failed`);
              }
              return 'success';
            };

            try {
              // Execute retry logic
              const result = await retryWithBackoff(request, maxRetries, baseDelay);

              // If we succeeded, verify the delays follow exponential backoff
              if (failureCount <= maxRetries) {
                expect(result).toBe('success');
                
                // Calculate actual delays between attempts
                const delays: number[] = [];
                for (let i = 1; i < timestamps.length; i++) {
                  delays.push(timestamps[i] - timestamps[i - 1]);
                }
                
                // Verify we had the right number of delays (one less than attempts)
                expect(delays.length).toBe(Math.min(failureCount, maxRetries));
                
                // Verify attempt count
                expect(attemptCount).toBe(failureCount + 1);
                
                // Verify exponential growth pattern: each delay should be roughly double the previous
                // (with tolerance for JavaScript timing imprecision)
                for (let i = 1; i < delays.length; i++) {
                  // Each delay should be approximately 2x the previous delay
                  const ratio = delays[i] / delays[i - 1];
                  // Allow ratio between 1.5 and 2.5 (accounting for timing variance)
                  expect(ratio).toBeGreaterThanOrEqual(1.5);
                  expect(ratio).toBeLessThanOrEqual(2.5);
                }
                
                // Verify first delay is at least baseDelay (may be slightly more due to overhead)
                if (delays.length > 0) {
                  expect(delays[0]).toBeGreaterThanOrEqual(baseDelay * 0.8);
                }
              }
            } catch (error) {
              // If failureCount > maxRetries, we expect failure
              if (failureCount > maxRetries) {
                expect(error).toBeDefined();
                
                // Verify we attempted maxRetries + 1 times (initial + retries)
                expect(attemptCount).toBe(maxRetries + 1);
                
                // Calculate actual delays between attempts
                const delays: number[] = [];
                for (let i = 1; i < timestamps.length; i++) {
                  delays.push(timestamps[i] - timestamps[i - 1]);
                }
                
                // Verify we had maxRetries delays
                expect(delays.length).toBe(maxRetries);
                
                // Verify exponential growth pattern
                for (let i = 1; i < delays.length; i++) {
                  const ratio = delays[i] / delays[i - 1];
                  expect(ratio).toBeGreaterThanOrEqual(1.5);
                  expect(ratio).toBeLessThanOrEqual(2.5);
                }
                
                // Verify first delay is at least baseDelay
                if (delays.length > 0) {
                  expect(delays[0]).toBeGreaterThanOrEqual(baseDelay * 0.8);
                }
              } else {
                // Unexpected failure
                throw error;
              }
            }
          }
        ),
        { numRuns: 50, timeout: 30000 } // Reduced runs and increased timeout for async delays
      );
    }, 35000); // Test timeout
  });
});
