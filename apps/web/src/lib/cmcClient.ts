/**
 * CoinMarketCap API client with caching and retry logic
 */

import { validateCoinMarketCapEnvironment } from './envValidation';
import { shouldUseFallback, generateMockOHLCVData, generateMockQuotesData } from './cmcFallback';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { data, expiresAt });
  }
}

// Global cache instance
const cache = new LRUCache<any>(200);

export class CMCClientError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'CMCClientError';
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Centralized fetch function for CoinMarketCap API with caching and retry logic
 */
export async function cmcFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
  ttlSeconds = 30
): Promise<T> {
  // Check if we should use fallback data
  if (shouldUseFallback()) {
    console.warn('CMC_API_KEY not configured, using fallback data');
    
    // Return appropriate fallback data based on endpoint
    if (endpoint.includes('/ohlcv/')) {
      return generateMockOHLCVData() as T;
    } else if (endpoint.includes('/quotes/')) {
      return generateMockQuotesData() as T;
    }
    
    // For other endpoints, return empty data
    return { status: { notice: "Using fallback data" }, data: {} } as T;
  }
  
  // Validate environment
  const validation = validateCoinMarketCapEnvironment();
  if (!validation.isValid) {
    throw new CMCClientError(
      `Environment validation failed: ${validation.errors.join(', ')}`
    );
  }

  const apiKey = process.env.CMC_API_KEY!;
  
  // Build URL
  const url = new URL(`https://pro-api.coinmarketcap.com${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const cacheKey = url.toString();
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Retry configuration
  const maxRetries = 3;
  const baseDelay = 200; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json',
          'Accept-Encoding': 'deflate, gzip',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new CMCClientError(
            `CMC API error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        
        // Retry on server errors (5xx)
        if (attempt === maxRetries) {
          throw new CMCClientError(
            `CMC API error after ${maxRetries} attempts: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        
        // Wait before retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }

      const data = await response.json();

      // Cache successful response
      cache.set(cacheKey, data, ttlSeconds);
      
      return data;

    } catch (error) {
      if (error instanceof CMCClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt === maxRetries) {
          throw new CMCClientError('Request timeout after 3 seconds');
        }
      } else if (attempt === maxRetries) {
        throw new CMCClientError(
          `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Wait before retry
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw new CMCClientError('Max retries exceeded');
}