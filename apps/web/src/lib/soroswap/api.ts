import { Pool, TokenPair } from '@/types/pools';

const SOROSWAP_API_URL = process.env.NEXT_PUBLIC_SOROSWAP_API_URL || 'https://api.soroswap.finance';
const SOROSWAP_ROUTER_URL = process.env.SOROSWAP_ROUTER_URL || 'https://api.soroswap.finance';

export interface SoroswapPool {
  id: string;
  token0: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  tvlUSD: number;
  apr: number;
}

export interface SoroswapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
}

// Fetch all pools from Soroswap
export async function fetchSoroswapPools(): Promise<Pool[]> {
  try {
    const response = await fetch(`${SOROSWAP_API_URL}/pools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pools: ${response.statusText}`);
    }

    const data: SoroswapPool[] = await response.json();
    
    return data.map(pool => ({
      id: pool.id,
      pair: `${pool.token0.symbol}/${pool.token1.symbol}` as TokenPair,
      token0: pool.token0.symbol,
      token1: pool.token1.symbol,
      tvl: pool.tvlUSD,
      volume24h: pool.volume24h,
      volume7d: pool.volume7d,
      fees24h: pool.fees24h,
      apr: pool.apr,
      token0Price: 0, // Will be calculated from reserves
      token1Price: 0, // Will be calculated from reserves
      priceChange24h: 0, // Would need historical data
      isFavorite: false,
    }));
  } catch (error) {
    console.error('Error fetching Soroswap pools:', error);
    // Return empty array on error - let the UI handle showing error state
    return [];
  }
}

// Fetch specific pool by ID
export async function fetchPoolById(poolId: string): Promise<Pool | null> {
  try {
    const response = await fetch(`${SOROSWAP_API_URL}/pools/${poolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pool: ${response.statusText}`);
    }

    const pool: SoroswapPool = await response.json();
    
    return {
      id: pool.id,
      pair: `${pool.token0.symbol}/${pool.token1.symbol}` as TokenPair,
      token0: pool.token0.symbol,
      token1: pool.token1.symbol,
      tvl: pool.tvlUSD,
      volume24h: pool.volume24h,
      volume7d: pool.volume7d,
      fees24h: pool.fees24h,
      apr: pool.apr,
      token0Price: 0,
      token1Price: 0,
      priceChange24h: 0,
      isFavorite: false,
    };
  } catch (error) {
    console.error('Error fetching pool by ID:', error);
    return null;
  }
}

// Fetch all tokens
export async function fetchSoroswapTokens(): Promise<SoroswapToken[]> {
  try {
    const response = await fetch(`${SOROSWAP_API_URL}/tokens`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    const data: SoroswapToken[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Soroswap tokens:', error);
    return [];
  }
}

// Get swap quote
export async function getSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  slippage: number = 0.5
) {
  try {
    const response = await fetch(`${SOROSWAP_ROUTER_URL}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenIn,
        tokenOut,
        amountIn: amount,
        slippageTolerance: slippage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get quote: ${response.statusText}`);
    }

    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error;
  }
}

// Execute swap
export async function executeSwap(
  tokenIn: string,
  tokenOut: string,
  amount: string,
  userAddress: string,
  slippage: number = 0.5
) {
  try {
    const response = await fetch(`${SOROSWAP_ROUTER_URL}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenIn,
        tokenOut,
        amountIn: amount,
        userAddress,
        slippageTolerance: slippage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute swap: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error executing swap:', error);
    throw error;
  }
}

// Fetch TVL data for analytics
export async function fetchTVLHistory(days: number = 30) {
  try {
    const response = await fetch(`${SOROSWAP_API_URL}/analytics/tvl?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch TVL history: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching TVL history:', error);
    return [];
  }
}

// Fetch volume data for analytics
export async function fetchVolumeHistory(days: number = 30) {
  try {
    const response = await fetch(`${SOROSWAP_API_URL}/analytics/volume?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch volume history: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching volume history:', error);
    return [];
  }
}