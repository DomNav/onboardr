import { cmcFetch, CMCClientError } from './cmcClient';

// Mock environment validation
jest.mock('./envValidation', () => ({
  validateCoinMarketCapEnvironment: jest.fn(() => ({
    isValid: true,
    missingVars: [],
    errors: []
  }))
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock setTimeout for sleep function
jest.useFakeTimers();

describe('cmcClient', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllTimers();
    process.env.CMC_API_KEY = 'test-api-key-12345678901234567890123456';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('cmcFetch', () => {
    it('should make successful API call with correct headers', async () => {
      const mockResponse = { data: { 1: { id: 1, symbol: 'BTC' } } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await cmcFetch('/v1/cryptocurrency/quotes/latest', { id: '1' });

      expect(fetch).toHaveBeenCalledWith(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-CMC_PRO_API_KEY': 'test-api-key-12345678901234567890123456',
            'Accept': 'application/json',
            'Accept-Encoding': 'deflate, gzip'
          }),
          signal: expect.any(AbortSignal)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle environment validation errors', async () => {
      const { validateCoinMarketCapEnvironment } = require('./envValidation');
      validateCoinMarketCapEnvironment.mockReturnValueOnce({
        isValid: false,
        missingVars: ['CMC_API_KEY'],
        errors: ['CMC_API_KEY is missing']
      });

      await expect(cmcFetch('/v1/test')).rejects.toThrow(CMCClientError);
      await expect(cmcFetch('/v1/test')).rejects.toThrow('Environment validation failed');
    });

    it('should cache successful responses', async () => {
      const mockResponse = { data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      // First call
      const result1 = await cmcFetch('/v1/test', {}, 60);
      
      // Second call - should use cache
      const result2 = await cmcFetch('/v1/test', {}, 60);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
    });

    it('should retry on server errors (5xx)', async () => {
      jest.useRealTimers();
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway'
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        });

      const result = await cmcFetch('/v1/test');

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should not retry on client errors (4xx)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(cmcFetch('/v1/test')).rejects.toThrow(CMCClientError);
      await expect(cmcFetch('/v1/test')).rejects.toThrow('CMC API error: 400 Bad Request');
      
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network timeouts', async () => {
      const mockAbortError = new Error('The operation was aborted');
      mockAbortError.name = 'AbortError';
      
      (fetch as jest.Mock)
        .mockRejectedValueOnce(mockAbortError)
        .mockRejectedValueOnce(mockAbortError)
        .mockRejectedValueOnce(mockAbortError);

      await expect(cmcFetch('/v1/test')).rejects.toThrow('Request timeout after 3 seconds');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should build URL with query parameters correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      await cmcFetch('/v1/cryptocurrency/quotes/latest', {
        id: '1,1027',
        convert: 'USD',
        aux: 'num_market_pairs'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=1%2C1027&convert=USD&aux=num_market_pairs',
        expect.any(Object)
      );
    });

    it('should skip empty query parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      await cmcFetch('/v1/test', {
        id: '1',
        convert: '',
        aux: undefined as any
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://pro-api.coinmarketcap.com/v1/test?id=1',
        expect.any(Object)
      );
    });

    it('should handle JSON parsing errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(cmcFetch('/v1/test')).rejects.toThrow(CMCClientError);
    });
  });
});