'use client';

import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { DataAlert } from './ui/data-alert';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useMarketData, useTokenSelector, TokenType, TOKEN_CONFIGS } from '../lib/hooks/useMarketData';
import { usePriceStream, formatStreamPrice } from '../hooks/usePriceStream';

export function MarketOverviewCard() {
  const { theme } = useTheme();
  const { selectedToken, setSelectedToken, isClient } = useTokenSelector();
  const { data, loading, config, error } = useMarketData(selectedToken);
  
  // Price streaming for live updates
  const streamingPair = useMemo(() => {
    // Map token types to trading pairs
    switch (selectedToken) {
      case 'xlm': return { base: 'XLM', quote: 'USDC' };
      case 'usdc': return { base: 'USDC', quote: 'XLM' };
      case 'btc': return { base: 'BTC', quote: 'USDC' };
      default: return { base: 'XLM', quote: 'USDC' };
    }
  }, [selectedToken]);

  const { price: livePrice, connected: streamConnected, lastUpdate } = usePriceStream(
    streamingPair.base,
    streamingPair.quote,
    { debounceMs: 3000 } // Update chart at most once per 3 seconds
  );

  const lastUpdateRef = useRef<number | null>(null);
  const [enhancedData, setEnhancedData] = React.useState(data);

  // Update chart data with live price (debounced)
  useEffect(() => {
    if (livePrice !== null && lastUpdate && lastUpdate !== lastUpdateRef.current) {
      lastUpdateRef.current = lastUpdate;
      
      const newDataPoint = {
        date: new Date(lastUpdate).toISOString().split('T')[0],
        value: livePrice
      };

      setEnhancedData(prevData => {
        const updatedData = [...prevData, newDataPoint];
        // Keep only last 30 data points for performance
        return updatedData.slice(-30);
      });
    }
  }, [livePrice, lastUpdate]);

  // Use enhanced data if we have live updates, otherwise fallback to static data
  const chartData = useMemo(() => {
    const dataToUse = enhancedData.length > data.length ? enhancedData : data;
    return dataToUse.map(point => ({
      date: point.date,
      [config.dataKey]: point.value
    }));
  }, [enhancedData, data, config.dataKey]);

  const handleTokenSelect = (token: TokenType) => {
    console.log('Token selected:', token);
    setSelectedToken(token);
  };

  const chartColors = {
    primary: config.color,
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    text: theme === 'dark' ? '#d1d5db' : '#374151'
  };

  const formatChartData = () => {
    return chartData;
  };

  if (loading || !isClient) {
    return (
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">
              Market Overview
            </CardTitle>
            <div className="flex gap-1">
              <div className="animate-pulse h-8 w-16 bg-muted rounded-md"></div>
              <div className="animate-pulse h-8 w-16 bg-muted rounded-md"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">
              Market Overview
            </CardTitle>
            <TokenSelector 
              selectedToken={selectedToken} 
              onTokenSelect={handleTokenSelect} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataAlert type="error" title="Unable to load">
            Details: {error}
          </DataAlert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">
              Market Overview
            </CardTitle>
            <TokenSelector 
              selectedToken={selectedToken} 
              onTokenSelect={handleTokenSelect} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataAlert type="info" title="No data yet">
            Try again later.
          </DataAlert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              Market Overview
            </CardTitle>
            {streamConnected && (
              <div className="flex items-center gap-1" title="Live data streaming">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">Live</span>
              </div>
            )}
            {!process.env.DUNE_API_KEY && process.env.NODE_ENV === 'development' && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-600 text-xs rounded-full border border-blue-500/30">
                🔥 Mock
              </span>
            )}
          </div>
          <TokenSelector 
            selectedToken={selectedToken} 
            onTokenSelect={handleTokenSelect} 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatChartData()}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke={chartColors.text}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartColors.text}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={config.yAxisFormatter}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: chartColors.text
                }}
                formatter={(value: any, name: string) => [
                  selectedToken === 'overview' 
                    ? `$${value.toFixed(2)}M` 
                    : `$${value.toFixed(4)}`,
                  name
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={config.dataKey}
                stroke={chartColors.primary}
                fillOpacity={1}
                fill={`url(#${config.gradientId})`}
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface TokenSelectorProps {
  selectedToken: TokenType;
  onTokenSelect: (token: TokenType) => void;
}

function TokenSelector({ selectedToken, onTokenSelect }: TokenSelectorProps) {
  return (
    <div className="flex gap-1">
      {Object.entries(TOKEN_CONFIGS).map(([token, config]) => (
        <Button
          key={token}
          variant={selectedToken === token ? "default" : "outline"}
          size="sm"
          onClick={() => {
            console.log('Button clicked for token:', token);
            onTokenSelect(token as TokenType);
          }}
          className="h-8 text-xs px-2 flex items-center gap-1"
        >
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: config.color }}
          />
          {config.label}
        </Button>
      ))}
    </div>
  );
} 