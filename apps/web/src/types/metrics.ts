/**
 * Type definitions for metrics and analytics
 */

export interface DataPoint {
  time: string;
  value: number;
  volume: number;
  fees: number;
}

export interface TokenPair {
  pair: string;
  volume: string;
  change: number;
  color: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface MetricsApiResponse {
  timeframe: '24h' | '7d' | '30d';
  data: {
    volume: DataPoint[];
    tvl: DataPoint[];
    fees: DataPoint[];
  };
  topPairs: TokenPair[];
  distribution: PieChartData[];
  lastUpdated: string;
}