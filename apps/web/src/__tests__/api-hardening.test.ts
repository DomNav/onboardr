import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  withRetry, 
  hardenedFetch, 
  checkRateLimit, 
  getCached, 
  setCache, 
  clearCache, 
  getMetrics, 
  clearMetrics, 
  getHealthStatus 
} from '../lib/apiHardening';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Hardening Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearCache();
    clearMetrics();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('succeeds on first attempt when operation is successful', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockOperation, { maxRetries: 3, baseDelayMs: 10 });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('respects maximum retry limit', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(withRetry(mockOperation, { maxRetries: 2, baseDelayMs: 10 }))
        .rejects.toThrow('Persistent error');
      
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('does not retry on non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Validation error'));
      
      await expect(withRetry(mockOperation, { maxRetries: 3, baseDelayMs: 10 }))
        .rejects.toThrow('Validation error');
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('implements exponential backoff with jitter', async () => {
      vi.useFakeTimers();
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValue('success');
      
      const config = { maxRetries: 1, baseDelayMs: 1000, backoffMultiplier: 2, jitterMs: 100 };
      const promise = withRetry(mockOperation, config);
      
      // Fast-forward time to simulate delays
      await vi.advanceTimersByTimeAsync(1200); // Base delay + jitter
      
      const result = await promise;
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('records metrics for successful operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      await withRetry(mockOperation);
      
      const metrics = getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successRate).toBe(100);
      expect(metrics.retryRate).toBe(0);
    });

    it('records metrics for failed operations', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(withRetry(mockOperation, { maxRetries: 1, baseDelayMs: 10 }))
        .rejects.toThrow('Persistent failure');
      
      const metrics = getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successRate).toBe(0);
      expect(metrics.errorRate).toBe(100);
      expect(metrics.retryRate).toBe(100);
    });
  });

  describe('Caching Layer', () => {
    it('stores and retrieves cached data', () => {
      const testData = { message: 'test data' };
      
      setCache('test-key', testData, 5000);
      const retrieved = getCached('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('returns null for expired cache entries', () => {
      vi.useFakeTimers();
      
      const testData = { message: 'test data' };
      setCache('test-key', testData, 1000); // 1 second TTL
      
      // Fast-forward time past TTL
      vi.advanceTimersByTime(1001);
      
      const retrieved = getCached('test-key');
      expect(retrieved).toBeNull();
      
      vi.useRealTimers();
    });

    it('prevents cache from growing too large', () => {
      // Add items up to the limit
      for (let i = 0; i < 1001; i++) {
        setCache(`key-${i}`, { data: i }, 60000);
      }
      
      // Cache should have automatically removed oldest entries
      expect(getCached('key-0')).toBeNull(); // Oldest should be removed
      expect(getCached('key-900')).not.toBeNull(); // Newer should remain
    });

    it('clears all cache entries', () => {
      setCache('key1', 'data1', 60000);
      setCache('key2', 'data2', 60000);
      
      clearCache();
      
      expect(getCached('key1')).toBeNull();
      expect(getCached('key2')).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('allows requests within rate limit', () => {
      const identifier = 'test-client';
      
      // Should allow first request
      expect(checkRateLimit(identifier)).toBe(true);
      
      // Should allow subsequent requests within limit
      for (let i = 0; i < 50; i++) {
        expect(checkRateLimit(identifier)).toBe(true);
      }
    });

    it('blocks requests exceeding rate limit', () => {
      const identifier = 'test-client';
      
      // Make requests up to the limit
      for (let i = 0; i < 60; i++) {
        checkRateLimit(identifier);
      }
      
      // Next request should be blocked
      expect(checkRateLimit(identifier)).toBe(false);
    });

    it('resets rate limit after time window', () => {
      vi.useFakeTimers();
      
      const identifier = 'test-client';
      
      // Exhaust rate limit
      for (let i = 0; i < 60; i++) {
        checkRateLimit(identifier);
      }
      
      expect(checkRateLimit(identifier)).toBe(false);
      
      // Fast-forward past reset time
      vi.advanceTimersByTime(61000); // 61 seconds
      
      // Should allow requests again
      expect(checkRateLimit(identifier)).toBe(true);
      
      vi.useRealTimers();
    });

    it('handles multiple clients independently', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      
      // Exhaust limit for client1
      for (let i = 0; i < 60; i++) {
        checkRateLimit(client1);
      }
      
      expect(checkRateLimit(client1)).toBe(false);
      expect(checkRateLimit(client2)).toBe(true); // client2 should still work
    });
  });

  describe('Hardened Fetch', () => {
    it('makes successful requests with caching', async () => {
      const mockResponse = { data: 'test response' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      
      const result = await hardenedFetch(
        'https://api.example.com/data',
        {},
        'test-cache-key',
        5000
      );
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      
      // Second request should use cache
      const cachedResult = await hardenedFetch(
        'https://api.example.com/data',
        {},
        'test-cache-key',
        5000
      );
      
      expect(cachedResult).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional request
    });

    it('handles HTTP errors appropriately', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details'),
      });
      
      await expect(hardenedFetch('https://api.example.com/error'))
        .rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('respects rate limiting', async () => {
      // Exhaust rate limit for the domain
      const domain = 'api.example.com';
      for (let i = 0; i < 60; i++) {
        checkRateLimit(domain);
      }
      
      await expect(hardenedFetch('https://api.example.com/data'))
        .rejects.toThrow('Rate limit exceeded for api.example.com');
    });

    it('applies timeout to requests', async () => {
      vi.useFakeTimers();
      
      // Mock a slow response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'slow response' }),
        }), 15000))
      );
      
      const promise = hardenedFetch('https://api.example.com/slow');
      
      // Fast-forward past timeout
      vi.advanceTimersByTime(11000);
      
      await expect(promise).rejects.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(() => {
      clearMetrics();
    });

    it('calculates correct success rate', async () => {
      const successOp = vi.fn().mockResolvedValue('success');
      const failOp = vi.fn().mockRejectedValue(new Error('failure'));
      
      // 3 successful, 2 failed
      await withRetry(successOp);
      await withRetry(successOp);
      await withRetry(successOp);
      
      await expect(withRetry(failOp, { maxRetries: 0 })).rejects.toThrow();
      await expect(withRetry(failOp, { maxRetries: 0 })).rejects.toThrow();
      
      const metrics = getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.successRate).toBe(60); // 3/5 = 60%
      expect(metrics.errorRate).toBe(40); // 2/5 = 40%
    });

    it('tracks retry rates', async () => {
      const retryOp = vi.fn()
        .mockRejectedValueOnce(new Error('retry error'))
        .mockResolvedValue('success');
      
      const noRetryOp = vi.fn().mockResolvedValue('success');
      
      await withRetry(retryOp, { maxRetries: 1, baseDelayMs: 10 });
      await withRetry(noRetryOp);
      
      const metrics = getMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.retryRate).toBe(50); // 1/2 = 50%
    });

    it('calculates average latency', async () => {
      vi.useFakeTimers();
      
      const fastOp = vi.fn().mockResolvedValue('fast');
      const slowOp = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow'), 100))
      );
      
      const promise1 = withRetry(fastOp);
      const promise2 = withRetry(slowOp);
      
      vi.advanceTimersByTime(100);
      
      await Promise.all([promise1, promise2]);
      
      const metrics = getMetrics();
      expect(metrics.averageLatency).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });

    it('provides health status based on metrics', async () => {
      // Generate some successful requests
      const successOp = vi.fn().mockResolvedValue('success');
      for (let i = 0; i < 10; i++) {
        await withRetry(successOp);
      }
      
      const health = getHealthStatus();
      expect(health.status).toBe('healthy');
      expect(health.metrics.successRate).toBe(100);
      expect(health.cache).toHaveProperty('size');
      expect(health.cache).toHaveProperty('utilization');
      expect(health.timestamp).toBeDefined();
    });

    it('detects degraded performance', async () => {
      // Mix of successful and failed requests
      const successOp = vi.fn().mockResolvedValue('success');
      const failOp = vi.fn().mockRejectedValue(new Error('failure'));
      
      // 85% success rate (degraded but not unhealthy)
      for (let i = 0; i < 17; i++) {
        await withRetry(successOp);
      }
      for (let i = 0; i < 3; i++) {
        await expect(withRetry(failOp, { maxRetries: 0 })).rejects.toThrow();
      }
      
      const health = getHealthStatus();
      expect(health.status).toBe('degraded');
      expect(health.metrics.successRate).toBeGreaterThan(80);
      expect(health.metrics.successRate).toBeLessThan(95);
    });

    it('detects unhealthy status', async () => {
      // Mostly failed requests
      const failOp = vi.fn().mockRejectedValue(new Error('failure'));
      
      for (let i = 0; i < 10; i++) {
        await expect(withRetry(failOp, { maxRetries: 0 })).rejects.toThrow();
      }
      
      const health = getHealthStatus();
      expect(health.status).toBe('unhealthy');
      expect(health.metrics.successRate).toBeLessThan(80);
    });
  });

  describe('Error Classification', () => {
    it('correctly identifies retryable HTTP status codes', async () => {
      const retryableStatuses = [500, 502, 503, 504, 429, 408];
      
      for (const status of retryableStatuses) {
        const mockOp = vi.fn()
          .mockRejectedValueOnce({ status })
          .mockResolvedValue('success');
        
        const result = await withRetry(mockOp, { maxRetries: 1, baseDelayMs: 10 });
        expect(result).toBe('success');
        expect(mockOp).toHaveBeenCalledTimes(2);
        
        mockOp.mockReset();
      }
    });

    it('does not retry non-retryable HTTP status codes', async () => {
      const nonRetryableStatuses = [400, 401, 403, 404, 422];
      
      for (const status of nonRetryableStatuses) {
        const mockOp = vi.fn().mockRejectedValue({ status });
        
        await expect(withRetry(mockOp, { maxRetries: 3, baseDelayMs: 10 }))
          .rejects.toEqual({ status });
        
        expect(mockOp).toHaveBeenCalledTimes(1);
        mockOp.mockReset();
      }
    });

    it('retries network-related errors', async () => {
      const networkErrors = [
        new Error('fetch failed'),
        new Error('network error'),
        new Error('Failed to fetch'),
      ];
      
      for (const error of networkErrors) {
        const mockOp = vi.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');
        
        const result = await withRetry(mockOp, { maxRetries: 1, baseDelayMs: 10 });
        expect(result).toBe('success');
        expect(mockOp).toHaveBeenCalledTimes(2);
        
        mockOp.mockReset();
      }
    });
  });
});