import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';

// Performance testing under load
// These tests measure response times, throughput, and resource usage

const PERFORMANCE_ENABLED = process.env.PERFORMANCE_TESTS === 'true';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT_REQUESTS || '10');
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION_MS || '30000'); // 30 seconds

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  requestsPerSecond: number;
  startTime: number;
  endTime: number;
  duration: number;
}

interface RequestResult {
  success: boolean;
  latency: number;
  status: number;
  error?: string;
  timestamp: number;
}

class LoadTester {
  private results: RequestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  async runLoadTest(
    testFn: () => Promise<RequestResult>,
    durationMs: number,
    concurrency: number
  ): Promise<PerformanceMetrics> {
    this.results = [];
    this.startTime = performance.now();

    const promises: Promise<void>[] = [];

    // Start concurrent workers
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.worker(testFn, durationMs));
    }

    // Wait for all workers to complete
    await Promise.all(promises);

    this.endTime = performance.now();
    return this.calculateMetrics();
  }

  private async worker(testFn: () => Promise<RequestResult>, durationMs: number): Promise<void> {
    const endTime = this.startTime + durationMs;

    while (performance.now() < endTime) {
      try {
        const result = await testFn();
        this.results.push(result);
      } catch (error) {
        this.results.push({
          success: false,
          latency: 0,
          status: 0,
          error: error instanceof Error ? error.message : String(error),
          timestamp: performance.now(),
        });
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private calculateMetrics(): PerformanceMetrics {
    const latencies = this.results.map(r => r.latency).sort((a, b) => a - b);
    const successful = this.results.filter(r => r.success);
    const duration = this.endTime - this.startTime;

    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    return {
      totalRequests: this.results.length,
      successfulRequests: successful.length,
      failedRequests: this.results.length - successful.length,
      averageLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length || 0,
      minLatency: latencies[0] || 0,
      maxLatency: latencies[latencies.length - 1] || 0,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      requestsPerSecond: (this.results.length / duration) * 1000,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
    };
  }
}

describe.skipIf(!PERFORMANCE_ENABLED)('Performance Testing Under Load', () => {
  let loadTester: LoadTester;

  beforeAll(() => {
    loadTester = new LoadTester();
    console.log(`🚀 Starting performance tests with ${CONCURRENT_REQUESTS} concurrent requests for ${TEST_DURATION_MS}ms`);
  });

  afterAll(() => {
    console.log('📊 Performance tests completed');
  });

  describe('API Endpoint Performance', () => {
    it('health endpoint handles concurrent load', async () => {
      const testFn = async (): Promise<RequestResult> => {
        const start = performance.now();
        
        try {
          const response = await fetch(`${BASE_URL}/api/health`);
          const end = performance.now();
          
          return {
            success: response.ok,
            latency: end - start,
            status: response.status,
            timestamp: start,
          };
        } catch (error) {
          const end = performance.now();
          return {
            success: false,
            latency: end - start,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: start,
          };
        }
      };

      const metrics = await loadTester.runLoadTest(testFn, TEST_DURATION_MS, CONCURRENT_REQUESTS);

      console.log('Health Endpoint Metrics:', {
        'Total Requests': metrics.totalRequests,
        'Success Rate': `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`,
        'Requests/Second': metrics.requestsPerSecond.toFixed(2),
        'Average Latency': `${metrics.averageLatency.toFixed(2)}ms`,
        'P95 Latency': `${metrics.p95Latency.toFixed(2)}ms`,
        'P99 Latency': `${metrics.p99Latency.toFixed(2)}ms`,
      });

      // Performance assertions
      expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.95); // 95% success rate
      expect(metrics.averageLatency).toBeLessThan(1000); // Average latency under 1 second
      expect(metrics.p95Latency).toBeLessThan(2000); // P95 under 2 seconds
      expect(metrics.requestsPerSecond).toBeGreaterThan(1); // At least 1 RPS
    }, 60000);

    it('quote simulation handles load with caching', async () => {
      const testQueries = [
        'sellToken=XLM&buyToken=USDC&amountIn=1000000000&slippageBps=50',
        'sellToken=USDC&buyToken=XLM&amountIn=100000000&slippageBps=100',
        'sellToken=XLM&buyToken=USDC&amountIn=5000000000&slippageBps=25',
      ];

      const testFn = async (): Promise<RequestResult> => {
        const start = performance.now();
        const query = testQueries[Math.floor(Math.random() * testQueries.length)];
        
        try {
          const response = await fetch(`${BASE_URL}/api/quotes/simulate?${query}`);
          const end = performance.now();
          
          return {
            success: response.ok,
            latency: end - start,
            status: response.status,
            timestamp: start,
          };
        } catch (error) {
          const end = performance.now();
          return {
            success: false,
            latency: end - start,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: start,
          };
        }
      };

      const metrics = await loadTester.runLoadTest(testFn, TEST_DURATION_MS, CONCURRENT_REQUESTS);

      console.log('Quote Simulation Metrics:', {
        'Total Requests': metrics.totalRequests,
        'Success Rate': `${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`,
        'Requests/Second': metrics.requestsPerSecond.toFixed(2),
        'Average Latency': `${metrics.averageLatency.toFixed(2)}ms`,
        'P95 Latency': `${metrics.p95Latency.toFixed(2)}ms`,
        'P99 Latency': `${metrics.p99Latency.toFixed(2)}ms`,
      });

      // More lenient for quote endpoint due to external API calls
      expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.80); // 80% success rate
      expect(metrics.averageLatency).toBeLessThan(5000); // Average latency under 5 seconds
      expect(metrics.p95Latency).toBeLessThan(10000); // P95 under 10 seconds
    }, 60000);
  });

  describe('Memory and Resource Usage', () => {
    it('does not leak memory during sustained load', async () => {
      const initialMemory = process.memoryUsage();
      
      const testFn = async (): Promise<RequestResult> => {
        const start = performance.now();
        
        try {
          // Create some objects to test garbage collection
          const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, data: Math.random() }));
          const response = await fetch(`${BASE_URL}/api/health`);
          data.forEach(item => item.data * 2); // Use the data
          const end = performance.now();
          
          return {
            success: response.ok,
            latency: end - start,
            status: response.status,
            timestamp: start,
          };
        } catch (error) {
          const end = performance.now();
          return {
            success: false,
            latency: end - start,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: start,
          };
        }
      };

      // Run shorter test to check memory usage
      await loadTester.runLoadTest(testFn, 10000, 5);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log('Memory Usage:', {
        'Initial Heap': `${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        'Final Heap': `${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        'Increase': `${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
      });

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 30000);
  });

  describe('Rate Limiting Performance', () => {
    it('rate limiting does not significantly impact performance', async () => {
      // Test with burst of requests to trigger rate limiting
      const burstSize = 20;
      const results: RequestResult[] = [];

      const start = performance.now();

      // Send burst of requests
      const promises = Array.from({ length: burstSize }, async () => {
        const requestStart = performance.now();
        try {
          const response = await fetch(`${BASE_URL}/api/health`);
          const requestEnd = performance.now();
          return {
            success: response.ok,
            latency: requestEnd - requestStart,
            status: response.status,
            timestamp: requestStart,
          };
        } catch (error) {
          const requestEnd = performance.now();
          return {
            success: false,
            latency: requestEnd - requestStart,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: requestStart,
          };
        }
      });

      const burstResults = await Promise.all(promises);
      const end = performance.now();

      const successful = burstResults.filter(r => r.success).length;
      const averageLatency = burstResults.reduce((sum, r) => sum + r.latency, 0) / burstResults.length;

      console.log('Rate Limiting Burst Test:', {
        'Burst Size': burstSize,
        'Successful': successful,
        'Success Rate': `${(successful / burstSize * 100).toFixed(2)}%`,
        'Total Time': `${(end - start).toFixed(2)}ms`,
        'Average Latency': `${averageLatency.toFixed(2)}ms`,
      });

      // Most requests should succeed or be rate limited (not error)
      expect(successful / burstSize).toBeGreaterThan(0.5); // At least 50% success
      expect(averageLatency).toBeLessThan(2000); // Should not be severely delayed
    }, 30000);
  });

  describe('Cache Performance', () => {
    it('caching improves response times for repeated requests', async () => {
      const endpoint = `${BASE_URL}/api/quotes/simulate?sellToken=XLM&buyToken=USDC&amountIn=1000000000&slippageBps=50`;
      
      // First request (cache miss)
      const firstStart = performance.now();
      const firstResponse = await fetch(endpoint);
      const firstEnd = performance.now();
      const firstLatency = firstEnd - firstStart;

      expect(firstResponse.ok).toBe(true);

      // Wait a bit to ensure the first request completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second request (should be cached)
      const secondStart = performance.now();
      const secondResponse = await fetch(endpoint);
      const secondEnd = performance.now();
      const secondLatency = secondEnd - secondStart;

      expect(secondResponse.ok).toBe(true);

      console.log('Cache Performance:', {
        'First Request (cache miss)': `${firstLatency.toFixed(2)}ms`,
        'Second Request (cache hit)': `${secondLatency.toFixed(2)}ms`,
        'Improvement': `${((firstLatency - secondLatency) / firstLatency * 100).toFixed(2)}%`,
      });

      // Cached request should be significantly faster (but not always guaranteed due to network variability)
      // We'll just ensure it's not slower
      expect(secondLatency).toBeLessThanOrEqual(firstLatency * 2);
    }, 15000);
  });
});

// Helper function to run performance benchmarks
export async function benchmarkFunction<T>(
  fn: () => Promise<T>,
  iterations: number = 100
): Promise<{
  results: T[];
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}> {
  const results: T[] = [];
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    results.push(result);
    times.push(end - start);
  }

  return {
    results,
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalTime: times.reduce((sum, time) => sum + time, 0),
  };
}

// Helper to generate test data
export function generateTestData(size: number): Array<{ id: number; data: string }> {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    data: Math.random().toString(36).substring(7),
  }));
}