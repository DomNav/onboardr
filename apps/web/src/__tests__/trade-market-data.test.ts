import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';
import useMarketData from '../hooks/useMarketData';
import useSoroswapTvl from '../hooks/useSoroswapTvl';

describe('Market Data Hooks with MSW', () => {
  describe('useMarketData', () => {
    it('fetches TVL and volume data successfully from Dune API', async () => {
      const { result } = renderHook(() => useMarketData());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.tvlUsd).toBe(0);
      expect(result.current.volume24hUsd).toBe(0);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify successful data fetch
      expect(result.current.tvlUsd).toBe(1234567.89);
      expect(result.current.volume24hUsd).toBe(98765.43);
      expect(result.current.updatedAt).toBeInstanceOf(Date);
      expect(result.current.error).toBeNull();
    });

    it('falls back to The Graph when Dune API fails', async () => {
      // Mock Dune API failure
      server.use(
        http.get('https://api.dune.com/api/v1/query/:queryId/results', () => {
          return HttpResponse.json(
            { error: 'Dune API unavailable' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useMarketData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still get data from The Graph fallback
      expect(result.current.tvlUsd).toBe(1234567.89);
      expect(result.current.volume24hUsd).toBe(98765.43);
      expect(result.current.error).toBeNull();
    });

    it('returns zero values when both APIs fail', async () => {
      // Mock both APIs failing
      server.use(
        http.get('https://api.dune.com/api/v1/query/:queryId/results', () => {
          return HttpResponse.json(
            { error: 'Dune API unavailable' },
            { status: 500 }
          );
        }),
        http.post('https://api.thegraph.com/subgraphs/name/soroswap/soroswap-subgraph', () => {
          return HttpResponse.json(
            { error: 'The Graph unavailable' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useMarketData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return fallback values
      expect(result.current.tvlUsd).toBe(0);
      expect(result.current.volume24hUsd).toBe(0);
      expect(result.current.error).toContain('API error');
    });

    it('validates DUNE_API_KEY environment variable', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.DUNE_API_KEY;
      delete process.env.DUNE_API_KEY;

      const { result } = renderHook(() => useMarketData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle missing API key gracefully
      expect(result.current.error).toContain('DUNE_API_KEY');
      
      // Restore the API key
      process.env.DUNE_API_KEY = originalKey;
    });
  });

  describe('useSoroswapTvl', () => {
    it('returns TVL data from useMarketData hook', async () => {
      const { result } = renderHook(() => useSoroswapTvl());

      await waitFor(() => {
        expect(result.current.tvlUsd).toBe(1234567.89);
      });

      expect(result.current.updatedAt).toBeInstanceOf(Date);
    });

    it('handles null values when market data is unavailable', async () => {
      // Mock complete API failure
      server.use(
        http.get('https://api.dune.com/api/v1/query/:queryId/results', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        }),
        http.post('https://api.thegraph.com/subgraphs/name/soroswap/soroswap-subgraph', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      const { result } = renderHook(() => useSoroswapTvl());

      await waitFor(() => {
        expect(result.current.tvlUsd).toBe(0);
      });

      expect(result.current.updatedAt).toBeNull();
    });
  });
});