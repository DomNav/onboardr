/**
 * @jest-environment node
 */

import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock environment variables
const mockEnv = {
  OPENAI_API_KEY: 'test-key',
  NODE_ENV: 'test'
};

Object.assign(process.env, mockEnv);

// Mock NextRequest
function createMockRequest(url: string, options: { ip?: string } = {}) {
  const request = {
    url,
    ip: options.ip || '127.0.0.1',
    headers: new Map([
      ['x-forwarded-for', options.ip || '127.0.0.1']
    ])
  } as any;

  request.headers.get = (key: string) => {
    return request.headers.has(key) ? request.headers.get(key) : null;
  };

  return request as NextRequest;
}

describe('/api/analytics', () => {
  beforeEach(() => {
    // Reset rate limiting between tests
    jest.clearAllMocks();
  });

  describe('GET /api/analytics', () => {
    it('should return 200 with valid mock data for default timeframe', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data).toBeDefined();
      expect(data.data.volumeChart).toBeInstanceOf(Array);
      expect(data.data.tvlChart).toBeInstanceOf(Array);
      expect(data.data.feesChart).toBeInstanceOf(Array);
      expect(data.data.tokenPrices).toBeInstanceOf(Array);
      expect(data.data.pairVolumes).toBeInstanceOf(Array);
      expect(data.data.lastUpdated).toBeDefined();
    });

    it('should return 200 with valid mock data for 7d timeframe', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics?tf=7d');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data.volumeChart).toHaveLength(7); // 7 days
    });

    it('should return 200 with valid mock data for 30d timeframe', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics?tf=30d');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.data.volumeChart).toHaveLength(30); // 30 days
    });

    it('should return 400 for invalid timeframe', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics?tf=invalid');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('error');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should have proper cache headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe(
        'public, s-maxage=30, stale-while-revalidate=60'
      );
    });

    it('should validate token prices structure', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);
      const data = await response.json();

      const tokenPrices = data.data.tokenPrices;
      expect(tokenPrices).toBeInstanceOf(Array);
      expect(tokenPrices.length).toBeGreaterThan(0);

      const firstToken = tokenPrices[0];
      expect(firstToken).toHaveProperty('symbol');
      expect(firstToken).toHaveProperty('name');
      expect(firstToken).toHaveProperty('price');
      expect(firstToken).toHaveProperty('change24h');
      expect(firstToken).toHaveProperty('change7d');
      expect(firstToken).toHaveProperty('volume24h');
      expect(firstToken).toHaveProperty('marketCap');

      expect(typeof firstToken.symbol).toBe('string');
      expect(typeof firstToken.name).toBe('string');
      expect(typeof firstToken.price).toBe('number');
      expect(typeof firstToken.change24h).toBe('number');
      expect(typeof firstToken.change7d).toBe('number');
      expect(typeof firstToken.volume24h).toBe('number');
      expect(typeof firstToken.marketCap).toBe('number');
    });

    it('should validate pair volumes structure', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);
      const data = await response.json();

      const pairVolumes = data.data.pairVolumes;
      expect(pairVolumes).toBeInstanceOf(Array);
      expect(pairVolumes.length).toBeGreaterThan(0);

      const firstPair = pairVolumes[0];
      expect(firstPair).toHaveProperty('pair');
      expect(firstPair).toHaveProperty('volume');
      expect(firstPair).toHaveProperty('percentage');
      expect(firstPair).toHaveProperty('color');

      expect(typeof firstPair.pair).toBe('string');
      expect(typeof firstPair.volume).toBe('number');
      expect(typeof firstPair.percentage).toBe('number');
      expect(typeof firstPair.color).toBe('string');
      expect(firstPair.volume).toBeGreaterThanOrEqual(0);
      expect(firstPair.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should validate chart data structure', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics?tf=24h');
      
      const response = await GET(request);
      const data = await response.json();

      const { volumeChart, tvlChart, feesChart } = data.data;

      [volumeChart, tvlChart, feesChart].forEach((chart, index) => {
        const chartName = ['volume', 'tvl', 'fees'][index];
        
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24); // 24 hours
        
        chart.forEach((point: any) => {
          expect(point).toHaveProperty('time');
          expect(point).toHaveProperty('value');
          expect(typeof point.time).toBe('string');
          expect(typeof point.value).toBe('number');
          expect(point.value).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics', { ip: '1.2.3.4' });
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    // Note: Rate limiting test with multiple requests would require
    // a more sophisticated test setup to avoid flakiness
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables', async () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const request = createMockRequest('http://localhost:3000/api/analytics');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.code).toBe('CONFIG_ERROR');

      // Restore environment
      process.env.OPENAI_API_KEY = originalEnv;
    });
  });
});