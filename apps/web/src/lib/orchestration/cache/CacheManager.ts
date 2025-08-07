/**
 * Cache Manager with Redis support
 * Handles both in-memory and Redis caching with fallback
 */

import Redis from 'ioredis';
import { Logger } from '../utils/Logger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean; // Compress large values
  prefix?: string; // Key prefix for namespacing
}

export class CacheManager {
  private redis?: Redis;
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();
  private logger: Logger;
  private prefix: string;
  private defaultTTL: number;
  private compressionThreshold: number = 1024; // 1KB

  constructor(
    redisUrl?: string,
    logger?: Logger,
    options: CacheOptions = {}
  ) {
    this.logger = logger || new Logger('CacheManager');
    this.prefix = options.prefix || 'onboardr:';
    this.defaultTTL = options.ttl || 60000; // 1 minute default

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          }
        });

        this.redis.on('connect', () => {
          this.logger.info('Connected to Redis');
        });

        this.redis.on('error', (err) => {
          this.logger.error('Redis error:', err);
        });
      } catch (error) {
        this.logger.warn('Failed to connect to Redis, using memory cache only:', error);
      }
    } else {
      this.logger.info('No Redis URL provided, using memory cache only');
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;

    // Try Redis first
    if (this.redis) {
      try {
        const value = await this.redis.get(fullKey);
        if (value) {
          return this.deserialize(value);
        }
      } catch (error) {
        this.logger.error(`Redis get error for key ${key}:`, error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(fullKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Clean up expired entry
    if (cached) {
      this.memoryCache.delete(fullKey);
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.prefix + key;
    const expiry = ttl || this.defaultTTL;
    const expiryTime = Date.now() + expiry;

    // Store in memory cache
    this.memoryCache.set(fullKey, { data: value, expiry: expiryTime });

    // Store in Redis if available
    if (this.redis) {
      try {
        const serialized = this.serialize(value);
        await this.redis.setex(fullKey, Math.floor(expiry / 1000), serialized);
      } catch (error) {
        this.logger.error(`Redis set error for key ${key}:`, error);
      }
    }

    // Clean up old entries periodically
    this.cleanupMemoryCache();
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    
    // Delete from memory
    this.memoryCache.delete(fullKey);

    // Delete from Redis
    if (this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch (error) {
        this.logger.error(`Redis delete error for key ${key}:`, error);
      }
    }
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(this.prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        this.logger.error('Redis clear error:', error);
      }
    }
  }

  /**
   * Get multiple values at once
   */
  async getMany<T = any>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    // Batch get from Redis if available
    if (this.redis && keys.length > 0) {
      try {
        const fullKeys = keys.map(k => this.prefix + k);
        const values = await this.redis.mget(...fullKeys);
        
        keys.forEach((key, index) => {
          const value = values[index];
          if (value) {
            results.set(key, this.deserialize(value));
          }
        });
      } catch (error) {
        this.logger.error('Redis mget error:', error);
      }
    }

    // Fill missing values from memory cache
    for (const key of keys) {
      if (!results.has(key)) {
        const value = await this.get<T>(key);
        if (value !== null) {
          results.set(key, value);
        }
      }
    }

    return results;
  }

  /**
   * Set multiple values at once
   */
  async setMany(entries: Map<string, any>, ttl?: number): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [key, value] of entries) {
      promises.push(this.set(key, value, ttl));
    }

    await Promise.all(promises);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryEntries: this.memoryCache.size,
      memorySize: this.estimateMemorySize(),
      redisConnected: this.redis?.status === 'ready'
    };
  }

  /**
   * Serialize value for storage
   */
  private serialize(value: any): string {
    const json = JSON.stringify(value);
    
    // Consider compression for large values
    if (json.length > this.compressionThreshold) {
      // In production, you might want to use zlib compression
      // For now, just return the JSON
      return json;
    }
    
    return json;
  }

  /**
   * Deserialize value from storage
   */
  private deserialize(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('Failed to deserialize cache value:', error);
      return null;
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired entries from memory cache`);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemorySize(): number {
    let size = 0;
    
    for (const entry of this.memoryCache.values()) {
      const json = JSON.stringify(entry.data);
      size += json.length * 2; // Rough estimate (2 bytes per character)
    }
    
    return size;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryCache.clear();
  }
}