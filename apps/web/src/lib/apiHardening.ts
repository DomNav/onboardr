
// Types and interfaces
interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  statusCode?: number;
  retryCount: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterMs: 100,
};

const DEFAULT_CACHE_CONFIG = {
  defaultTtlMs: 30000, // 30 seconds
  maxCacheSize: 1000,
  quoteTtlMs: 10000, // 10 seconds for quotes
  marketDataTtlMs: 60000, // 1 minute for market data
};

const DEFAULT_RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 60,
  burstLimit: 10,
};

// Global instances
const requestMetrics: RequestMetrics[] = [];
const cache = new Map<string, CacheEntry<any>>();
const rateLimitMap = new Map<string, RateLimitEntry>();

// Utility functions
function generateCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
  }
  
  // HTTP status codes that should be retried
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as any).status;
    return status >= 500 || status === 429 || status === 408;
  }
  
  return false;
}

function calculateDelay(attempt: number, config = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * config.jitterMs;
  return delay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limiting
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + 60000, // Reset in 1 minute
    });
    return true;
  }
  
  // Reset if time window has passed
  if (now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + 60000,
    });
    return true;
  }
  
  // Check if within limits
  if (entry.count < DEFAULT_RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    entry.count++;
    return true;
  }
  
  return false;
}

// Caching layer
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.timestamp + entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttlMs = DEFAULT_CACHE_CONFIG.defaultTtlMs): void {
  // Prevent cache from growing too large
  if (cache.size >= DEFAULT_CACHE_CONFIG.maxCacheSize) {
    // Remove oldest entries
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10%
    const toRemove = Math.floor(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

export function clearCache(): void {
  cache.clear();
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config = DEFAULT_RETRY_CONFIG,
  identifier = 'unknown'
): Promise<T> {
  const startTime = Date.now();
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Record successful metrics
      const endTime = Date.now();
      requestMetrics.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        retryCount: attempt,
      });
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      console.warn(`Attempt ${attempt + 1} failed for ${identifier}, retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }
  
  // Record failed metrics
  const endTime = Date.now();
  requestMetrics.push({
    startTime,
    endTime,
    duration: endTime - startTime,
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    retryCount: config.maxRetries,
  });
  
  throw lastError;
}

// Enhanced fetch with caching and retry
export async function hardenedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTtlMs?: number
): Promise<T> {
  const identifier = new URL(url).hostname;
  
  // Check rate limit
  if (!checkRateLimit(identifier)) {
    throw new Error(`Rate limit exceeded for ${identifier}`);
  }
  
  // Check cache if cacheKey provided
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Perform request with retry logic
  const result = await withRetry(
    async () => {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      const data = await response.json();
      return data as T;
    },
    DEFAULT_RETRY_CONFIG,
    identifier
  );
  
  // Cache result if cacheKey provided
  if (cacheKey) {
    setCache(cacheKey, result, cacheTtlMs);
  }
  
  return result;
}

// Monitoring and metrics
export function getMetrics() {
  const now = Date.now();
  const last5Minutes = requestMetrics.filter(m => now - m.startTime < 300000);
  
  if (last5Minutes.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageLatency: 0,
      errorRate: 0,
      retryRate: 0,
    };
  }
  
  const successful = last5Minutes.filter(m => m.success);
  const withRetries = last5Minutes.filter(m => m.retryCount > 0);
  const totalLatency = last5Minutes.reduce((sum, m) => sum + (m.duration || 0), 0);
  
  return {
    totalRequests: last5Minutes.length,
    successRate: (successful.length / last5Minutes.length) * 100,
    averageLatency: totalLatency / last5Minutes.length,
    errorRate: ((last5Minutes.length - successful.length) / last5Minutes.length) * 100,
    retryRate: (withRetries.length / last5Minutes.length) * 100,
  };
}

export function clearMetrics(): void {
  requestMetrics.length = 0;
}

// Health check endpoint data
export function getHealthStatus() {
  const metrics = getMetrics();
  const cacheSize = cache.size;
  const rateLimitEntries = rateLimitMap.size;
  
  return {
    status: metrics.successRate > 95 ? 'healthy' : metrics.successRate > 80 ? 'degraded' : 'unhealthy',
    metrics,
    cache: {
      size: cacheSize,
      maxSize: DEFAULT_CACHE_CONFIG.maxCacheSize,
      utilization: (cacheSize / DEFAULT_CACHE_CONFIG.maxCacheSize) * 100,
    },
    rateLimit: {
      activeWindows: rateLimitEntries,
    },
    timestamp: new Date().toISOString(),
  };
}