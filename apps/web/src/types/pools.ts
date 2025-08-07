export type TokenPair = 
  | 'XLM/USDC'
  | 'BTC/XLM'
  | 'ETH/USDC'
  | 'USDC/USDT'
  | 'SOL/USDC'
  | 'XRP/XLM'
  | 'DOGE/USDC'
  | 'ADA/XLM'
  | 'MATIC/USDC'
  | 'LINK/XLM';

export interface Pool {
  id: string;
  pair: TokenPair;
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  volume7d: number;
  fees24h: number;
  apr: number;
  token0Price: number;
  token1Price: number;
  priceChange24h: number;
  isFavorite: boolean;
}

export interface PoolStats {
  totalTVL: number;
  totalVolume24h: number;
  totalFees24h: number;
  poolCount: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface LiquidityPosition {
  id: string;
  poolId: string;
  owner: string;
  token0Amount: number;
  token1Amount: number;
  shareOfPool: number;
  value: number;
}