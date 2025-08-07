'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CMCOhlcvCandle } from '@/types/cmc';
import { formatPrice } from '@/lib/formatPrice';
import useSWR from 'swr';

interface CandlestickChartProps {
  tokenId: number;
  interval?: string;
  range?: string;
  convert?: string;
  className?: string;
}


const fetcher = async (url: string): Promise<CMCOhlcvCandle[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OHLCV data: ${response.statusText}`);
  }
  return await response.json();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">{data.date}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-mono">${data.open.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">High:</span>
            <span className="font-mono text-green-500">${data.high.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-mono text-red-500">${data.low.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Close:</span>
            <span className="font-mono">${data.close.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono text-xs">${(data.volume / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CandlestickChart({ 
  tokenId, 
  interval = 'daily', 
  range = '30d', 
  convert = 'USD',
  className = ''
}: CandlestickChartProps) {
  const { data, error, isLoading } = useSWR(
    `/api/cmc/ohlcv?id=${tokenId}&interval=${interval}&range=${range}&convert=${convert}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false,
    }
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((candle) => {
      const isGreen = candle.close >= candle.open;
      
      return {
        ...candle,
        date: new Date(candle.timeOpen).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        // For candlestick bars: we'll use stacked bars for body and wicks
        wickLow: candle.low,
        wickHigh: candle.high,
        bodyLow: Math.min(candle.open, candle.close),
        bodyHigh: Math.max(candle.open, candle.close),
        isGreen,
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    console.error('Candlestick chart error:', error);
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <div className="text-muted-foreground text-center">
          <p className="mb-2">Unable to load chart data</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-muted-foreground">No chart data available</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Simplified candlestick using line for price movement */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          
          {/* Volume bars at the bottom */}
          <Bar
            dataKey="volume"
            fill="hsl(var(--muted))"
            fillOpacity={0.3}
            yAxisId="volume"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Dynamic import version for better performance
export default function CandlestickChartLazy(props: CandlestickChartProps) {
  return <CandlestickChart {...props} />;
}