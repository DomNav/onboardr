/**
 * Development-only mock data for MetricsCard
 * This file should be tree-shaken out in production builds
 */

import type { DataPoint, TokenPair, PieChartData } from '@/types/metrics';

// Re-export formatting utilities from the proper location
export { calculatePercentageChange, formatLargeNumber } from '@/lib/formatters';

// Re-export types
export type { DataPoint, TokenPair, PieChartData, MetricsApiResponse } from '@/types/metrics';

// Only provide mock data in development
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generates mock hourly data for the last N hours
 */
export const generateMockData = isDevelopment ? (points: number = 24): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseValue = Math.random() * 100 + 50;
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: baseValue,
      volume: baseValue * 0.8 + Math.random() * 20,
      fees: baseValue * 0.1 + Math.random() * 5
    });
  }
  
  return data;
} : () => [];

/**
 * Generates mock weekly data for the last 7 days
 */
export const generateWeeklyData = isDevelopment ? (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseValue = Math.random() * 150 + 75;
    
    data.push({
      time: time.toLocaleDateString([], { weekday: 'short' }),
      value: baseValue,
      volume: baseValue * 0.8 + Math.random() * 30,
      fees: baseValue * 0.1 + Math.random() * 7
    });
  }
  
  return data;
} : () => [];

/**
 * Generates mock monthly data for the last 30 days
 */
export const generateMonthlyData = isDevelopment ? (): DataPoint[] => {
  const data: DataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const baseValue = Math.random() * 200 + 100;
    
    data.push({
      time: time.toLocaleDateString([], { day: 'numeric', month: 'short' }),
      value: baseValue,
      volume: baseValue * 0.8 + Math.random() * 40,
      fees: baseValue * 0.1 + Math.random() * 10
    });
  }
  
  return data;
} : () => [];

/**
 * Mock top token pairs - only in development
 */
export const topTokenPairs: TokenPair[] = isDevelopment ? [
  { pair: 'XLM/USDC', volume: '$2.1M', change: 12.5, color: 'var(--soro-chart-volume)' },
  { pair: 'yXLM/XLM', volume: '$1.8M', change: -3.1, color: 'var(--soro-chart-tvl)' },
  { pair: 'AQUA/XLM', volume: '$890K', change: 8.7, color: 'var(--soro-chart-fees)' },
  { pair: 'BTC/XLM', volume: '$654K', change: 15.2, color: 'var(--soro-primary)' }
] : [];

/**
 * Mock pie chart data - only in development
 */
export const pieData: PieChartData[] = isDevelopment ? [
  { name: 'XLM/USDC', value: 35, color: 'var(--soro-chart-volume)' },
  { name: 'yXLM/XLM', value: 28, color: 'var(--soro-chart-tvl)' },
  { name: 'AQUA/XLM', value: 20, color: 'var(--soro-chart-fees)' },
  { name: 'Others', value: 17, color: 'var(--soro-primary)' }
] : [];