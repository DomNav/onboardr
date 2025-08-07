import { useState, useEffect } from 'react';

interface MarketData {
  tvlUsd: number;
  volume24hUsd: number;
  updatedAt: Date | null;
  isLoading: boolean;
  error: string | null;
}

export default function useMarketData(): MarketData {
  const [marketData, setMarketData] = useState<MarketData>({
    tvlUsd: 0,
    volume24hUsd: 0,
    updatedAt: null,
    isLoading: true,
    error: null,
  });

  // Always use realistic mock data for demo
  const usePlaceholderData = true; // process.env.NEXT_PUBLIC_PLACEHOLDER_DATA === 'true';

  useEffect(() => {
    const fetchMarketData = async () => {
      setMarketData(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use realistic Stellar/Soroswap data for demo mode
      if (usePlaceholderData) {
        setTimeout(() => {
          // Based on real Soroswap metrics (TVL: $8.35M, with some variation)
          const mockTvl = 8350000 + Math.random() * 500000; // $8.35M - $8.85M
          // Based on realistic daily volume for Soroswap
          const mockVolume = 1200000 + Math.random() * 300000; // $1.2M - $1.5M daily
          
          setMarketData({
            tvlUsd: mockTvl,
            volume24hUsd: mockVolume,
            updatedAt: new Date(),
            isLoading: false,
            error: null,
          });
        }, 1000);
        return;
      }
      
      try {
        const response = await fetch('/api/market-data');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch market data');
        }
        
        setMarketData({
          tvlUsd: data.tvlUsd || 0,
          volume24hUsd: data.volume24hUsd || 0,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        setMarketData({
          tvlUsd: 0,
          volume24hUsd: 0,
          updatedAt: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchMarketData();
    
    // Refresh market data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return marketData;
}