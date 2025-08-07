/**
 * Analytics Dashboard TypeScript interfaces
 */

export interface DataPoint {
  time: string;
  value: number;
}

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
}

export interface PairVolume {
  pair: string;
  volume: number;
  percentage: number;
  color: string;
}

export interface DashboardData {
  volumeChart: DataPoint[];
  tvlChart: DataPoint[];
  feesChart: DataPoint[];
  tokenPrices: TokenPrice[];
  pairVolumes: PairVolume[];
  lastUpdated: string;
}

export interface DashboardApiResponse {
  data: DashboardData;
  status: 'success';
}

export interface DashboardApiError {
  status: 'error';
  message: string;
  code?: string;
}

export type TimeFrame = "24h" | "7d" | "30d";
export type Metric = "volume" | "tvl" | "fees";