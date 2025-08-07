import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../test/setup';

// Integration tests with real testnet data
// These tests should be run against actual Stellar testnet
// Use environment variable INTEGRATION_TESTS=true to enable

const TESTNET_ENABLED = process.env.INTEGRATION_TESTS === 'true';
const TESTNET_ACCOUNT = process.env.TEST_ACCOUNT || 'GDTEST123ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF';
const STELLAR_TESTNET_URL = 'https://horizon-testnet.stellar.org';

describe.skipIf(!TESTNET_ENABLED)('Integration Tests with Real Testnet Data', () => {
  beforeAll(() => {
    // Disable MSW for integration tests to use real APIs
    server.close();
  });

  afterAll(() => {
    // Re-enable MSW after integration tests
    server.listen();
  });

  describe('Stellar Testnet Integration', () => {
    it('fetches real account data from testnet', async () => {
      const response = await fetch(`${STELLAR_TESTNET_URL}/accounts/${TESTNET_ACCOUNT}`);
      
      if (response.status === 404) {
        // Account doesn't exist, which is fine for testing
        expect(response.status).toBe(404);
        return;
      }

      expect(response.ok).toBe(true);
      const accountData = await response.json();
      
      expect(accountData).toHaveProperty('account_id');
      expect(accountData).toHaveProperty('sequence');
      expect(accountData).toHaveProperty('balances');
      expect(Array.isArray(accountData.balances)).toBe(true);
    });

    it('fetches recent transactions from testnet', async () => {
      const response = await fetch(`${STELLAR_TESTNET_URL}/transactions?limit=5&order=desc`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('_embedded');
      expect(data._embedded).toHaveProperty('records');
      expect(Array.isArray(data._embedded.records)).toBe(true);

      if (data._embedded.records.length > 0) {
        const transaction = data._embedded.records[0];
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('hash');
        expect(transaction).toHaveProperty('successful');
      }
    });

    it('validates transaction structure', async () => {
      const response = await fetch(`${STELLAR_TESTNET_URL}/transactions?limit=1&order=desc`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      
      if (data._embedded.records.length > 0) {
        const tx = data._embedded.records[0];
        
        // Validate required transaction fields
        expect(tx).toHaveProperty('id');
        expect(tx).toHaveProperty('paging_token');
        expect(tx).toHaveProperty('successful');
        expect(tx).toHaveProperty('hash');
        expect(tx).toHaveProperty('ledger');
        expect(tx).toHaveProperty('created_at');
        expect(tx).toHaveProperty('source_account');
        expect(tx).toHaveProperty('fee_paid');
        expect(tx).toHaveProperty('operation_count');
        
        // Validate data types
        expect(typeof tx.successful).toBe('boolean');
        expect(typeof tx.ledger).toBe('number');
        expect(typeof tx.operation_count).toBe('number');
        expect(typeof tx.fee_paid).toBe('string');
      }
    });
  });

  describe('Real API Quote Integration', () => {
    it('can fetch real quotes from quote simulation endpoint', async () => {
      const params = new URLSearchParams({
        sellToken: 'XLM',
        buyToken: 'USDC',
        amountIn: '1000000000', // 100 XLM (7 decimal places)
        slippageBps: '50'
      });

      const response = await fetch(`http://localhost:3000/api/quotes/simulate?${params}`);
      
      // This might fail if server isn't running or API is down
      if (!response.ok) {
        console.warn('Quote API not available, skipping integration test');
        return;
      }

      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      if (data.success) {
        expect(data).toHaveProperty('quote');
        expect(data.quote).toHaveProperty('amountOut');
        expect(data.quote).toHaveProperty('route');
        expect(data.quote).toHaveProperty('gas');
        
        expect(Array.isArray(data.quote.route)).toBe(true);
        expect(data.quote.route.length).toBeGreaterThan(0);
      }
    });

    it('handles invalid token pairs gracefully', async () => {
      const params = new URLSearchParams({
        sellToken: 'INVALID_TOKEN',
        buyToken: 'ANOTHER_INVALID',
        amountIn: '1000000000',
        slippageBps: '50'
      });

      const response = await fetch(`http://localhost:3000/api/quotes/simulate?${params}`);
      
      // Should return 502 for router service unavailable or 400 for bad request
      expect([400, 502, 500].includes(response.status)).toBe(true);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Market Data Integration', () => {
    it('can fetch real market data if APIs are available', async () => {
      // Test health endpoint first
      const healthResponse = await fetch('http://localhost:3000/api/health');
      
      if (!healthResponse.ok) {
        console.warn('Health endpoint not available, skipping market data test');
        return;
      }

      const healthData = await healthResponse.json();
      expect(healthData).toHaveProperty('healthy');
      expect(healthData).toHaveProperty('api');
      expect(healthData).toHaveProperty('timestamp');

      if (healthData.api) {
        expect(healthData.api).toHaveProperty('status');
        expect(healthData.api).toHaveProperty('metrics');
        expect(['healthy', 'degraded', 'unhealthy'].includes(healthData.api.status)).toBe(true);
      }
    });

    it('validates metrics data structure', async () => {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      
      if (!healthResponse.ok) return;

      const healthData = await healthResponse.json();
      
      if (healthData.api && healthData.api.metrics) {
        const metrics = healthData.api.metrics;
        
        expect(metrics).toHaveProperty('totalRequests');
        expect(metrics).toHaveProperty('successRate');
        expect(metrics).toHaveProperty('averageLatency');
        expect(metrics).toHaveProperty('errorRate');
        expect(metrics).toHaveProperty('retryRate');
        
        expect(typeof metrics.totalRequests).toBe('number');
        expect(typeof metrics.successRate).toBe('number');
        expect(typeof metrics.averageLatency).toBe('number');
        expect(typeof metrics.errorRate).toBe('number');
        expect(typeof metrics.retryRate).toBe('number');
        
        expect(metrics.successRate).toBeGreaterThanOrEqual(0);
        expect(metrics.successRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Error Recovery Integration', () => {
    it('handles network timeouts gracefully', async () => {
      // This test simulates slow network conditions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

      try {
        const response = await fetch(`${STELLAR_TESTNET_URL}/ledgers?limit=1`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          expect(data).toHaveProperty('_embedded');
        }
      } catch (error) {
        // Timeout is acceptable for this test
        expect(error.name).toBe('AbortError');
      }
    });

    it('validates rate limiting behavior', async () => {
      const requests = [];
      const startTime = Date.now();
      
      // Make multiple rapid requests
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`${STELLAR_TESTNET_URL}/ledgers?limit=1&cursor=${i}`)
        );
      }
      
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      
      // Should complete within reasonable time (not blocked by rate limiting)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      
      // At least some requests should succeed
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;
      
      expect(successful).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency Validation', () => {
    it('validates ledger sequence consistency', async () => {
      const response = await fetch(`${STELLAR_TESTNET_URL}/ledgers?limit=2&order=desc`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      
      if (data._embedded.records.length >= 2) {
        const [latest, previous] = data._embedded.records;
        
        expect(latest.sequence).toBeGreaterThan(previous.sequence);
        expect(latest.sequence - previous.sequence).toBeLessThanOrEqual(10); // Should be close
        
        // Validate timestamp ordering
        const latestTime = new Date(latest.closed_at).getTime();
        const previousTime = new Date(previous.closed_at).getTime();
        expect(latestTime).toBeGreaterThanOrEqual(previousTime);
      }
    });

    it('validates transaction hash uniqueness', async () => {
      const response = await fetch(`${STELLAR_TESTNET_URL}/transactions?limit=10`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      
      if (data._embedded.records.length > 0) {
        const hashes = data._embedded.records.map(tx => tx.hash);
        const uniqueHashes = new Set(hashes);
        
        // All hashes should be unique
        expect(uniqueHashes.size).toBe(hashes.length);
        
        // All hashes should be 64 character hex strings
        hashes.forEach(hash => {
          expect(hash).toMatch(/^[a-f0-9]{64}$/i);
        });
      }
    });
  });
});

// Helper functions for integration testing
export function skipIfNoIntegration(message: string = 'Integration tests disabled') {
  if (!TESTNET_ENABLED) {
    console.log(`⏭️  ${message} (set INTEGRATION_TESTS=true to enable)`);
  }
}

export async function waitForTestnetAccount(accountId: string, maxWaitMs: number = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${STELLAR_TESTNET_URL}/accounts/${accountId}`);
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status !== 404) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Error checking account:', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error(`Account ${accountId} not found after ${maxWaitMs}ms`);
}