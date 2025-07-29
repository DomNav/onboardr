import { useState, useEffect } from 'react';

interface TvlData {
  tvlUsd: number | null;
  updatedAt: Date | null;
}

export default function useSoroswapTvl(): TvlData {
  const [tvlData, setTvlData] = useState<TvlData>({
    tvlUsd: null,
    updatedAt: null,
  });

  useEffect(() => {
    const fetchTvl = async () => {
      try {
        // Simulate TVL data - in real implementation this would use @soroswap/sdk
        // const client = new SoroswapSDK.client();
        // const tvl = await client.getTvl();
        
        // Mock data for demo
        const mockTvl = 1250000; // $1.25M
        
        setTvlData({
          tvlUsd: mockTvl,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to fetch TVL data:', error);
        setTvlData({
          tvlUsd: null,
          updatedAt: null,
        });
      }
    };

    fetchTvl();
    
    // Refresh TVL data every 30 seconds
    const interval = setInterval(fetchTvl, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return tvlData;
}