import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock environment variables for testing
process.env.STELLAR_NETWORK = 'testnet';
process.env.PROFILE_NFT_CONTRACT_ADDRESS = 'CDTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
process.env.SPONSOR_SECRET_KEY = 'STEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890AB';
process.env.OPENAI_API_KEY = 'sk-test1234567890';
process.env.SOROSWAP_ROUTER_URL = 'https://api.soroswap.finance';
process.env.DUNE_API_KEY = 'test-dune-key';

// MSW Request Handlers
export const handlers = [
  // Mock Soroswap Router quote endpoint
  http.get('https://api.soroswap.finance/quote', ({ request }) => {
    const url = new URL(request.url);
    const sellToken = url.searchParams.get('sellToken');
    const buyToken = url.searchParams.get('buyToken');
    const sellAmount = url.searchParams.get('sellAmount');
    
    // Simulate different scenarios based on params
    if (sellToken === 'ERROR_TOKEN') {
      return HttpResponse.json(
        { error: 'Token not found' },
        { status: 500 }
      );
    }
    
    return HttpResponse.json({
      buyAmount: '950000000', // Mock output amount (with slippage)
      sources: [
        { name: sellToken || 'XLM' },
        { name: buyToken || 'USDC' }
      ],
      estimatedGas: '100000',
      sellAmount: sellAmount || '1000000000'
    });
  }),

  // Mock Stellar Horizon transactions endpoint
  http.get('https://horizon-testnet.stellar.org/transactions/:hash', ({ params }) => {
    const { hash } = params;
    
    if (hash === 'failed-tx-hash') {
      return HttpResponse.json(
        { status: 'FAILED', result_xdr: 'failed-result' },
        { status: 200 }
      );
    }
    
    return HttpResponse.json({
      id: hash,
      hash: hash,
      ledger: 12345,
      successful: true,
      operation_count: 2,
      result_xdr: 'success-result',
      envelope_xdr: 'envelope-xdr'
    });
  }),

  // Mock Dune API
  http.get('https://api.dune.com/api/v1/query/:queryId/results', () => {
    return HttpResponse.json({
      result: {
        rows: [{
          tvl_usd: 1234567.89,
          volume_24h_usd: 98765.43
        }]
      }
    });
  }),

  // Mock The Graph fallback
  http.post('https://api.thegraph.com/subgraphs/name/soroswap/soroswap-subgraph', () => {
    return HttpResponse.json({
      data: {
        protocol: {
          totalValueLockedUSD: '1234567.89',
          totalVolumeUSD: '98765.43'
        }
      }
    });
  })
];

// Setup MSW server
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Mock window.freighterApi
Object.defineProperty(window, 'freighterApi', {
  value: {
    signTransaction: vi.fn(),
    getPublicKey: vi.fn().mockResolvedValue('GTEST123ABCDEF'),
    isConnected: vi.fn().mockResolvedValue(true),
    signAndSubmitXDR: vi.fn().mockResolvedValue({
      hash: 'mock-tx-hash-12345'
    })
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}; 