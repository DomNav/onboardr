import { NextResponse } from 'next/server';
import type { DataPoint, TokenPair, PieChartData, MetricsApiResponse } from '@/types/metrics';

// Helper function to generate mock data (only used in development)
const generateMockData = (points: number = 24): DataPoint[] => {
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
};

// Mock token pairs data
const mockTokenPairs: TokenPair[] = [
  { pair: 'XLM/USDC', volume: '$2.1M', change: 12.5, color: 'var(--soro-chart-volume)' },
  { pair: 'yXLM/XLM', volume: '$1.8M', change: -3.1, color: 'var(--soro-chart-tvl)' },
  { pair: 'AQUA/XLM', volume: '$890K', change: 8.7, color: 'var(--soro-chart-fees)' },
  { pair: 'BTC/XLM', volume: '$654K', change: 15.2, color: 'var(--soro-primary)' }
];

// Mock pie chart data
const mockPieData: PieChartData[] = [
  { name: 'XLM/USDC', value: 35, color: 'var(--soro-chart-volume)' },
  { name: 'yXLM/XLM', value: 28, color: 'var(--soro-chart-tvl)' },
  { name: 'AQUA/XLM', value: 20, color: 'var(--soro-chart-fees)' },
  { name: 'Others', value: 17, color: 'var(--soro-primary)' }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get('timeframe') || '24h') as '24h' | '7d' | '30d';
  
  // Only return mock data in development
  if (process.env.NODE_ENV !== 'production') {
    const points = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const baseData = generateMockData(points);
    
    const response: MetricsApiResponse = {
      timeframe,
      data: {
        volume: baseData,
        tvl: baseData.map(d => ({ ...d, value: d.value * 10 })),
        fees: baseData.map(d => ({ ...d, value: d.value * 0.1 }))
      },
      topPairs: mockTokenPairs,
      distribution: mockPieData,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  }
  
  // In production, return empty data or connect to real API
  return NextResponse.json({
    timeframe,
    data: { volume: [], tvl: [], fees: [] },
    topPairs: [],
    distribution: [],
    lastUpdated: new Date().toISOString()
  });
}