import useSWR from 'swr';
import { DashboardData, DashboardApiResponse, DashboardApiError, TimeFrame } from '@/types/analytics';

interface UseDashboardDataReturn {
  data?: DashboardData;
  isLoading: boolean;
  error?: Error;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<DashboardData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData: DashboardApiError = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: DashboardApiResponse = await response.json();
    
    // Validate response structure
    if (!result.data) {
      throw new Error('Invalid response structure: missing data field');
    }

    const { data } = result;
    
    // Strict TypeScript validation
    if (!Array.isArray(data.volumeChart) || 
        !Array.isArray(data.tvlChart) || 
        !Array.isArray(data.feesChart) ||
        !Array.isArray(data.tokenPrices) ||
        !Array.isArray(data.pairVolumes)) {
      throw new Error('Invalid response structure: arrays expected');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 3 seconds');
    }
    
    throw error;
  }
};

/**
 * Hook to fetch dashboard analytics data
 * @param timeFrame The time period for analytics data
 */
export function useDashboardData(timeFrame: TimeFrame): UseDashboardDataReturn {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/analytics?tf=${timeFrame}`,
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.warn('Dashboard data fetch error:', {
          message: error.message,
          timeFrame,
          timestamp: new Date().toISOString()
        });
      },
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}