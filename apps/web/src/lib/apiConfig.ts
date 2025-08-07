/**
 * Centralized API configuration for consistent behavior
 */

export const API_CONFIG = {
  // Timeout settings (in milliseconds)
  TIMEOUTS: {
    DEFAULT: 5000,          // 5 seconds for most API calls
    BALANCE_CHECK: 5000,    // 5 seconds for balance checks
    NFT_CHECK: 3000,        // 3 seconds for NFT ownership check
    TRANSACTION: 10000,     // 10 seconds for transaction submission
    IPFS_UPLOAD: 8000,      // 8 seconds for IPFS uploads
  },
  
  // Polling intervals (in milliseconds)
  POLLING: {
    BALANCE: 30000,         // 30 seconds for balance updates (was 10s)
    PRICES: 60000,          // 60 seconds for price updates
    TRADES: 15000,          // 15 seconds for trade updates
  },
  
  // Cache durations (in milliseconds)
  CACHE: {
    NFT_OWNERSHIP: 30000,   // 30 seconds
    BALANCE: 10000,         // 10 seconds
    PRICES: 60000,          // 60 seconds
  },
  
  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,            // 1 second between retries
    BACKOFF_MULTIPLIER: 2,  // Double delay on each retry
  }
};

/**
 * Helper function to create a fetch with timeout
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = API_CONFIG.TIMEOUTS.DEFAULT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Helper function for retrying failed requests
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxAttempts: number = API_CONFIG.RETRY.MAX_ATTEMPTS,
  delay: number = API_CONFIG.RETRY.DELAY
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // If response is ok or it's a client error (4xx), return it
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // For server errors (5xx), throw to trigger retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors or abort errors
      if (error.message?.includes('Request timed out') && attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retrying (with exponential backoff)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= API_CONFIG.RETRY.BACKOFF_MULTIPLIER;
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}