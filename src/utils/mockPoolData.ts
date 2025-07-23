export interface Pool {
  symbol: string;
  name: string;
  tvl: number;
  apr: number;
  volume: number;
  change24h: number; // 24h change percentage
  priceHistory: number[];
  type: 'soroswap' | 'defindex';
  lastUpdated: Date;
}

export const mockPools: Pool[] = [
  {
    symbol: 'SORO / USDC',
    name: 'Soroswap Pool',
    tvl: 24500000, // $24.5M TVL
    apr: 0.1245, // 12.45% APR
    volume: 1900000, // $1.9M 24h volume
    change24h: 1.2, // +1.2% 24h change
    priceHistory: generatePoolHistory(30, 1.25, 0.15, 1.2),
    type: 'soroswap',
    lastUpdated: new Date()
  },
  {
    symbol: 'DFX / USDT',
    name: 'Defindex Pool',
    tvl: 18750000, // $18.75M TVL
    apr: 0.0892, // 8.92% APR
    volume: 2300000, // $2.3M 24h volume
    change24h: -0.8, // -0.8% 24h change
    priceHistory: generatePoolHistory(30, 0.85, 0.12, -0.8),
    type: 'defindex',
    lastUpdated: new Date()
  },
  {
    symbol: 'xUSDL / ETH',
    name: 'Defindex Lending Pool',
    tvl: 32500000, // $32.5M TVL
    apr: 0.1567, // 15.67% APR
    volume: 3100000, // $3.1M 24h volume
    change24h: 1.5, // +1.5% 24h change
    priceHistory: generatePoolHistory(30, 2.15, 0.18, 1.5),
    type: 'defindex',
    lastUpdated: new Date()
  },
  {
    symbol: 'SORO / ETH',
    name: 'Soroswap ETH Pool',
    tvl: 15600000, // $15.6M TVL
    apr: 0.1108, // 11.08% APR
    volume: 1000000, // $1.0M 24h volume
    change24h: 0.5, // +0.5% 24h change
    priceHistory: generatePoolHistory(30, 0.95, 0.14, 0.5),
    type: 'soroswap',
    lastUpdated: new Date()
  }
];

// Generate realistic pool history data with trend based on 24h change
function generatePoolHistory(days: number = 30, startValue: number = 1.0, volatility: number = 0.1, change24h: number = 0): number[] {
  const values: number[] = [startValue];
  
  for (let i = 1; i < days; i++) {
    // Add trend based on 24h change (positive change = upward trend, negative = downward)
    const trendDirection = change24h > 0 ? 1 : change24h < 0 ? -1 : 0;
    const trendStrength = Math.abs(change24h) / 100; // Convert percentage to decimal
    const trend = trendDirection * trendStrength * 0.1; // Gentle trend
    
    // Add some randomness and market cycles
    const cycle = Math.sin(i * 0.2) * 0.01; // Market cycles
    const random = (Math.random() - 0.5) * volatility;
    const newValue = Math.max(values[i-1] * (1 + trend + cycle + random), 0.01);
    values.push(parseFloat(newValue.toFixed(4)));
  }
  
  return values;
}

// Utility functions for formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  } else {
    return value.toLocaleString();
  }
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHour = Math.floor(diffInMin / 60);
  
  if (diffInSec < 60) {
    return 'Just now';
  } else if (diffInMin < 60) {
    return `${diffInMin}m ago`;
  } else if (diffInHour < 24) {
    return `${diffInHour}h ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Hook for real-time pool data updates
import { useState, useEffect } from 'react';

export function usePoolData(initialData: Pool[], updateInterval = 5000) {
  const [pools, setPools] = useState<Pool[]>(initialData);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setPools(prevPools => 
        prevPools.map(pool => {
          // Simulate TVL changes
          const tvlChange = (Math.random() - 0.5) * (pool.tvl * 0.02);
          const newTvl = Math.max(pool.tvl + tvlChange, 100000);
          
          // Simulate APR changes
          const aprChange = (Math.random() - 0.5) * 0.01;
          const newApr = Math.max(pool.apr + aprChange, 0.001);
          
          // Simulate volume changes
          const volumeChange = (Math.random() - 0.5) * (pool.volume * 0.1);
          const newVolume = Math.max(pool.volume + volumeChange, 10000);
          
          // Simulate 24h change
          const change24hVariation = (Math.random() - 0.5) * 0.5; // ±0.25% variation
          const newChange24h = Math.max(Math.min(pool.change24h + change24hVariation, 5), -5); // Clamp between -5% and +5%
          
          // Update price history
          const lastPrice = pool.priceHistory[pool.priceHistory.length - 1];
          const priceChange = (Math.random() - 0.5) * 0.05;
          const newPrice = Math.max(lastPrice * (1 + priceChange), 0.01);
          const newPriceHistory = [...pool.priceHistory.slice(1), parseFloat(newPrice.toFixed(4))];
          
          return {
            ...pool,
            tvl: parseFloat(newTvl.toFixed(0)),
            apr: parseFloat(newApr.toFixed(4)),
            volume: parseFloat(newVolume.toFixed(0)),
            change24h: parseFloat(newChange24h.toFixed(1)),
            priceHistory: newPriceHistory,
            lastUpdated: new Date()
          };
        })
      );
    }, updateInterval);
    
    return () => clearInterval(intervalId);
  }, [initialData, updateInterval]);
  
  return pools;
} 