import { Router, Request, Response } from 'express';
import { LRUCache } from 'lru-cache';
import { getLatestResult } from '../utils/dune';

const router: Router = Router();

// Typed response interfaces
export interface SoroswapTVLResponse {
  tvl_usd: number;
  volume_24h: number;
  last_updated: string;
}

export interface PoolData {
  pair: string;
  tvl_usd: number;
  volume_24h: number;
  apr: number;
  fees_24h: number;
  liquidity_providers: number;
}

export interface TopPoolsResponse {
  pools: PoolData[];
  total_pools: number;
  last_updated: string;
}

// Configure LRU cache with 5-minute TTL for TVL data
const tvlCache = new LRUCache<string, SoroswapTVLResponse>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
});

// Configure LRU cache with 5-minute TTL for pools data
const poolsCache = new LRUCache<string, TopPoolsResponse>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
});

// Use actual Dune query ID for Soroswap TVL/Volume from .env
const SOROSWAP_QUERY_ID = parseInt(process.env.SOROSWAP_TVL_QUERY_ID || '4303932');

/**
 * GET /api/soroswap/tvl
 * Returns Soroswap TVL and 24h volume data with caching
 */
router.get('/tvl', async (req: Request, res: Response) => {
  const cacheKey = 'soroswap-tvl';
  const usePerformanceTier = req.query.performance === 'large';
  
  try {
    // Check cache first
    const cachedResult = tvlCache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        ...cachedResult,
        cached: true,
        cache_hit: true,
      });
    }

    // Execute Dune query if not cached or expired
    console.log(`Fetching fresh data from Dune query ${SOROSWAP_QUERY_ID}${usePerformanceTier ? ' (large performance tier)' : ''}`);
    
    // Check if DUNE_API_KEY is available
    if (!process.env.DUNE_API_KEY) {
      // Return mock data for development/testing
      const mockData: SoroswapTVLResponse = {
        tvl_usd: 1250000, // $1.25M mock TVL
        volume_24h: 450000, // $450K mock 24h volume
        last_updated: new Date().toISOString(),
      };
      
      // Cache the mock result
      tvlCache.set(cacheKey, mockData);
      
      return res.json({
        ...mockData,
        cached: false,
        cache_hit: false,
        mock: true,
        note: 'Using mock data - set DUNE_API_KEY for real data',
      });
    }
    
    const result = await getLatestResult(SOROSWAP_QUERY_ID, usePerformanceTier ? { performance: 'large' } : undefined);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'No data available from Dune query',
        query_id: SOROSWAP_QUERY_ID,
      });
    }

    // Extract first row data
    const firstRow = result.rows[0];
    
    // Map Dune query columns to response format
    // Note: Column names may vary based on actual Dune query structure
    const response: SoroswapTVLResponse = {
      tvl_usd: parseFloat(firstRow.tvl_usd || firstRow.total_value_locked || 0),
      volume_24h: parseFloat(firstRow.volume_24h || firstRow.daily_volume || 0),
      last_updated: new Date().toISOString(),
    };

    // Validate response data
    if (isNaN(response.tvl_usd) || isNaN(response.volume_24h)) {
      return res.status(500).json({
        error: 'Invalid data format from Dune query',
        raw_data: firstRow,
        columns: result.metadata.column_names,
      });
    }

    // Cache the result
    tvlCache.set(cacheKey, response);
    
    return res.json({
      ...response,
      cached: false,
      cache_hit: false,
    });

  } catch (error) {
    console.error('Error fetching Soroswap TVL data:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch Soroswap data',
      message: error instanceof Error ? error.message : 'Unknown error',
      query_id: SOROSWAP_QUERY_ID,
    });
  }
});

/**
 * GET /api/soroswap/cache
 * Cache status endpoint for development debugging
 */
router.get('/cache', (req: Request, res: Response) => {
  const cacheKey = 'soroswap-tvl';
  const cachedResult = tvlCache.get(cacheKey);
  
  res.json({
    cache_status: {
      has_data: !!cachedResult,
      cache_hit: !!cachedResult,
      cache_size: tvlCache.size,
      cache_max: tvlCache.max,
      cache_ttl: tvlCache.ttl,
      last_updated: cachedResult?.last_updated || null,
    },
    cache_keys: Array.from(tvlCache.keys()),
    timestamp: new Date().toISOString(),
  });
});

// Pool data interface
export interface PoolData {
  pair: string;
  tvl_usd: number;
  volume_24h: number;
  apr: number;
  fees_24h: number;
  liquidity_providers: number;
}

export interface TopPoolsResponse {
  pools: PoolData[];
  total_pools: number;
  last_updated: string;
}

// TODO: Replace with actual Dune query ID for top pools data
const SOROSWAP_TOP_POOLS_QUERY_ID = parseInt(process.env.SOROSWAP_TOP_POOLS_QUERY_ID || '123457');

/**
 * GET /api/soroswap/pools
 * Returns top Soroswap pools data with analytics
 */
router.get('/pools', async (req: Request, res: Response) => {
  const cacheKey = 'soroswap-top-pools';
  const usePerformanceTier = req.query.performance === 'large';
  const limit = parseInt(req.query.limit as string) || 10;
  
  try {
    // Check cache first
    const cachedResult = poolsCache.get(cacheKey);
    if (cachedResult) {
      return res.json({
        ...cachedResult,
        cached: true,
        cache_hit: true,
      });
    }

    // Check if DUNE_API_KEY is available
    if (!process.env.DUNE_API_KEY) {
      // Return mock data for development/testing
      const mockPools: PoolData[] = [
        {
          pair: 'SORO/USDC',
          tvl_usd: 5200000,
          volume_24h: 850000,
          apr: 12.8,
          fees_24h: 2550,
          liquidity_providers: 234
        },
        {
          pair: 'DFX/USDT', 
          tvl_usd: 3100000,
          volume_24h: 420000,
          apr: 8.4,
          fees_24h: 1260,
          liquidity_providers: 156
        },
        {
          pair: 'ETH/USDC',
          tvl_usd: 8900000,
          volume_24h: 1200000,
          apr: 6.2,
          fees_24h: 3600,
          liquidity_providers: 445
        },
        {
          pair: 'xUSDL/SORO',
          tvl_usd: 2400000,
          volume_24h: 680000,
          apr: 15.1,
          fees_24h: 2040,
          liquidity_providers: 89
        },
        {
          pair: 'XLM/USDC',
          tvl_usd: 4500000,
          volume_24h: 920000,
          apr: 9.3,
          fees_24h: 2760,
          liquidity_providers: 312
        }
      ];

      const mockData: TopPoolsResponse = {
        pools: mockPools.slice(0, limit),
        total_pools: mockPools.length,
        last_updated: new Date().toISOString(),
      };
      
      // Cache the mock result
      poolsCache.set(cacheKey, mockData);
      
      return res.json({
        ...mockData,
        cached: false,
        cache_hit: false,
        mock: true,
        note: 'Using mock data - set DUNE_API_KEY for real data',
      });
    }
    
    // Execute Dune query if not cached or expired
    console.log(`Fetching fresh pools data from Dune query ${SOROSWAP_TOP_POOLS_QUERY_ID}${usePerformanceTier ? ' (large performance tier)' : ''}`);
    
    const result = await getLatestResult(SOROSWAP_TOP_POOLS_QUERY_ID, usePerformanceTier ? { performance: 'large' } : undefined);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'No pools data available from Dune query',
        query_id: SOROSWAP_TOP_POOLS_QUERY_ID,
      });
    }

    // Map Dune query results to pool data format
    const pools: PoolData[] = result.rows.slice(0, limit).map((row: any) => ({
      pair: row.pair || row.pool_name || 'Unknown',
      tvl_usd: parseFloat(row.tvl_usd || row.total_value_locked || 0),
      volume_24h: parseFloat(row.volume_24h || row.daily_volume || 0),
      apr: parseFloat(row.apr || row.annual_percentage_rate || 0),
      fees_24h: parseFloat(row.fees_24h || row.daily_fees || 0),
      liquidity_providers: parseInt(row.liquidity_providers || row.lp_count || 0),
    }));

    const response: TopPoolsResponse = {
      pools,
      total_pools: result.rows.length,
      last_updated: new Date().toISOString(),
    };

    // Cache the result
    poolsCache.set(cacheKey, response);
    
    return res.json({
      ...response,
      cached: false,
      cache_hit: false,
    });

  } catch (error) {
    console.error('Error fetching Soroswap pools data:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch Soroswap pools data',
      message: error instanceof Error ? error.message : 'Unknown error',
      query_id: SOROSWAP_TOP_POOLS_QUERY_ID,
    });
  }
});

/**
 * GET /api/soroswap/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'soroswap-api',
    timestamp: new Date().toISOString(),
    cache_size: tvlCache.size,
  });
});

export { router };