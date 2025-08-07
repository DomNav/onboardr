import { renderHook, waitFor } from '@testing-library/react';
import { useCMCQuotes, useCMCQuote } from './useCMCQuotes';
import { getTokenId } from '@/types/cmc';

// Mock SWR
jest.mock('swr');
import useSWR from 'swr';
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

// Mock the token ID utility
jest.mock('@/types/cmc', () => ({
  getTokenId: jest.fn()
}));
const mockGetTokenId = getTokenId as jest.MockedFunction<typeof getTokenId>;

// Mock fetch globally
global.fetch = jest.fn();

describe('useCMCQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenId.mockImplementation((symbol: string) => {
      const map: Record<string, number> = {
        'BTC': 1,
        'ETH': 1027,
        'XLM': 512
      };
      return map[symbol.toUpperCase()];
    });
  });

  describe('useCMCQuotes', () => {
    it('should handle numeric token IDs', () => {
      const mockSwrReturn = {
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      renderHook(() => useCMCQuotes([1, 1027], 'USD'));

      expect(mockUseSWR).toHaveBeenCalledWith(
        ['cmc', '1,1027', 'USD'],
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should convert symbol strings to IDs', () => {
      const mockSwrReturn = {
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      renderHook(() => useCMCQuotes(['BTC', 'ETH'], 'USD'));

      expect(mockGetTokenId).toHaveBeenCalledWith('BTC');
      expect(mockGetTokenId).toHaveBeenCalledWith('ETH');
      expect(mockUseSWR).toHaveBeenCalledWith(
        ['cmc', '1,1027', 'USD'],
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should filter out unknown symbols', () => {
      mockGetTokenId.mockImplementation((symbol: string) => {
        if (symbol === 'UNKNOWN') return undefined;
        return symbol === 'BTC' ? 1 : undefined;
      });

      const mockSwrReturn = {
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      renderHook(() => useCMCQuotes(['BTC', 'UNKNOWN'], 'USD'));

      expect(consoleSpy).toHaveBeenCalledWith('No CMC token ID found for symbol: UNKNOWN');
      expect(mockUseSWR).toHaveBeenCalledWith(
        ['cmc', '1', 'USD'],
        expect.any(Function),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should return null key when no valid IDs', () => {
      mockGetTokenId.mockReturnValue(undefined);

      const mockSwrReturn = {
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      renderHook(() => useCMCQuotes(['UNKNOWN'], 'USD'));

      expect(mockUseSWR).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should configure SWR with correct options', () => {
      const mockSwrReturn = {
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      renderHook(() => useCMCQuotes([1], 'USD', {
        refreshInterval: 60000,
        revalidateOnFocus: false
      }));

      expect(mockUseSWR).toHaveBeenCalledWith(
        ['cmc', '1', 'USD'],
        expect.any(Function),
        expect.objectContaining({
          refreshInterval: 60000,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          errorRetryCount: 3,
          errorRetryInterval: 5000
        })
      );
    });

    it('should handle fetch errors gracefully', () => {
      const mockError = new Error('Network error');
      const mockSwrReturn = {
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const { result } = renderHook(() => useCMCQuotes([1], 'USD'));

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should return successful data', () => {
      const mockData = {
        '1': {
          id: 1,
          symbol: 'BTC',
          price: 45000,
          percentChange24h: 2.5,
          marketCap: 850000000000,
          volume24h: 25000000000,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      };

      const mockSwrReturn = {
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const { result } = renderHook(() => useCMCQuotes([1], 'USD'));

      expect(result.current.data).toBe(mockData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('useCMCQuote (single token)', () => {
    it('should return single token data', () => {
      const mockData = {
        '1': {
          id: 1,
          symbol: 'BTC',
          price: 45000,
          percentChange24h: 2.5,
          marketCap: 850000000000,
          volume24h: 25000000000,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      };

      const mockSwrReturn = {
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const { result } = renderHook(() => useCMCQuote(1, 'USD'));

      expect(result.current.data).toEqual(mockData['1']);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle empty data gracefully', () => {
      const mockSwrReturn = {
        data: {},
        error: undefined,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const { result } = renderHook(() => useCMCQuote(1, 'USD'));

      expect(result.current.data).toBeUndefined();
    });

    it('should work with string token symbols', () => {
      const mockData = {
        '1': {
          id: 1,
          symbol: 'BTC',
          price: 45000,
          percentChange24h: 2.5,
          marketCap: 850000000000,
          volume24h: 25000000000,
          lastUpdated: '2024-01-01T00:00:00Z'
        }
      };

      const mockSwrReturn = {
        data: mockData,
        error: undefined,
        isLoading: false,
        mutate: jest.fn()
      };
      mockUseSWR.mockReturnValue(mockSwrReturn);

      const { result } = renderHook(() => useCMCQuote('BTC', 'USD'));

      expect(mockGetTokenId).toHaveBeenCalledWith('BTC');
      expect(result.current.data).toEqual(mockData['1']);
    });
  });

  describe('fetcher function', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it('should call the correct API endpoint', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      // Get the fetcher function from the SWR call
      renderHook(() => useCMCQuotes([1], 'USD'));
      const fetcherFn = mockUseSWR.mock.calls[0][1];

      await fetcherFn();

      expect(fetch).toHaveBeenCalledWith('/api/cmc/quotes?ids=1&convert=USD');
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.resolve({
          status: 'error',
          message: 'Server error'
        })
      });

      renderHook(() => useCMCQuotes([1], 'USD'));
      const fetcherFn = mockUseSWR.mock.calls[0][1];

      await expect(fetcherFn()).rejects.toThrow('Server error');
    });
  });
});