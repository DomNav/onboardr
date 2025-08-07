import useSWR from 'swr';
import { CMCQuoteResponse, CMCErrorResponse, getTokenId } from '@/types/cmc';

interface UseCMCQuotesOptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  fallbackToContext?: boolean;
}

interface UseCMCQuotesReturn {
  data?: CMCQuoteResponse;
  isLoading: boolean;
  error?: Error;
  mutate: () => void;
}

const fetcher = async (url: string): Promise<CMCQuoteResponse> => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData: CMCErrorResponse = await response.json();
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
};

/**
 * Hook to fetch cryptocurrency quotes from CoinMarketCap
 * @param tokenIds Array of CMC token IDs or symbols
 * @param convert Currency to convert to (default: 'USD')
 * @param options Additional SWR options
 */
export function useCMCQuotes(
  tokenIds: (number | string)[],
  convert: string = 'USD',
  options: UseCMCQuotesOptions = {}
): UseCMCQuotesReturn {
  const {
    refreshInterval = 30000, // 30 seconds
    revalidateOnFocus = true,
    fallbackToContext = true,
  } = options;

  // Convert symbols to IDs if needed
  const resolvedIds = tokenIds
    .map(id => {
      if (typeof id === 'string') {
        const tokenId = getTokenId(id);
        if (!tokenId) {
          console.warn(`No CMC token ID found for symbol: ${id}`);
          return null;
        }
        return tokenId;
      }
      return id;
    })
    .filter((id): id is number => id !== null);

  // Create SWR key
  const key = resolvedIds.length > 0 
    ? ['cmc', resolvedIds.sort().join(','), convert]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => {
      const idsParam = resolvedIds.join(',');
      const url = `/api/cmc/quotes?ids=${idsParam}&convert=${convert}`;
      return fetcher(url);
    },
    {
      refreshInterval,
      revalidateOnFocus,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (error) => {
        console.error('CMC quotes fetch error:', error);
        
        // TODO: If fallbackToContext is enabled, we could fall back to
        // existing price providers here via context
        if (fallbackToContext) {
          // This would integrate with existing price providers
          console.info('Falling back to existing price providers');
        }
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

/**
 * Hook to fetch a single token's quote
 */
export function useCMCQuote(
  tokenId: number | string,
  convert: string = 'USD',
  options: UseCMCQuotesOptions = {}
) {
  const { data, isLoading, error, mutate } = useCMCQuotes([tokenId], convert, options);
  
  const tokenData = data ? Object.values(data)[0] : undefined;
  
  return {
    data: tokenData,
    isLoading,
    error,
    mutate,
  };
}