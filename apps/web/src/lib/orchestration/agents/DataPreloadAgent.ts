/**
 * Data Preloading Agent
 * Fetches and caches DeFi data proactively
 */

import { Agent, AgentConfig, AgentContext } from '../core/Agent';
import { fetchSoroswapPools, fetchSoroswapTokens } from '../../soroswap/api';
import { defindexClient } from '../../defindex/client';

export interface PreloadedData {
  pools: any[];
  tokens: any[];
  vaults: any[];
  tvl: number;
  volume24h: number;
  topPairs: any[];
  timestamp: number;
}

export class DataPreloadAgent extends Agent {
  private dataSubscribers = new Set<(data: PreloadedData) => void>();

  constructor(context: AgentContext) {
    const config: AgentConfig = {
      id: 'data-preload',
      name: 'Data Preload Agent',
      type: 'data',
      priority: 'critical',
      interval: 30000, // 30 seconds
      retryAttempts: 3,
      timeout: 15000
    };
    super(config, context);
  }

  protected async execute(): Promise<PreloadedData> {
    this.context.logger.debug('Starting data preload...');
    
    try {
      // Fetch all data in parallel for optimal performance
      const [pools, tokens, vaultMetrics, protocolSnapshot] = await Promise.all([
        this.fetchPoolsWithRetry(),
        this.fetchTokensWithRetry(),
        defindexClient.getVaultMetrics(),
        defindexClient.getProtocolSnapshot()
      ]);

      // Calculate aggregated metrics
      const tvl = this.calculateTotalTVL(pools, vaultMetrics);
      const volume24h = this.calculateTotalVolume(pools);
      const topPairs = this.getTopTradingPairs(pools);

      const data: PreloadedData = {
        pools,
        tokens,
        vaults: vaultMetrics,
        tvl,
        volume24h,
        topPairs,
        timestamp: Date.now()
      };

      // Notify all subscribers
      this.notifySubscribers(data);

      // Store in different cache keys for granular access
      await this.cacheGranularData(data);

      this.context.logger.info('Data preload completed successfully', {
        poolsCount: pools.length,
        tokensCount: tokens.length,
        vaultsCount: vaultMetrics.length,
        tvl,
        volume24h
      });

      return data;
    } catch (error) {
      this.context.logger.error('Data preload failed:', error);
      
      // Try to return cached data if available
      const cachedData = await this.getCachedResult();
      if (cachedData) {
        this.context.logger.info('Returning cached data due to fetch failure');
        return cachedData;
      }
      
      throw error;
    }
  }

  private async fetchPoolsWithRetry(retries = 3): Promise<any[]> {
    for (let i = 0; i < retries; i++) {
      try {
        const pools = await fetchSoroswapPools();
        if (pools && pools.length > 0) {
          return pools;
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1)); // Exponential backoff
      }
    }
    return [];
  }

  private async fetchTokensWithRetry(retries = 3): Promise<any[]> {
    for (let i = 0; i < retries; i++) {
      try {
        const tokens = await fetchSoroswapTokens();
        if (tokens && tokens.length > 0) {
          return tokens;
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1));
      }
    }
    return [];
  }

  private calculateTotalTVL(pools: any[], vaults: any[]): number {
    const poolsTVL = pools.reduce((sum, pool) => sum + (pool.tvl || 0), 0);
    const vaultsTVL = vaults.reduce((sum, vault) => sum + (vault.tvl || 0), 0);
    return poolsTVL + vaultsTVL;
  }

  private calculateTotalVolume(pools: any[]): number {
    return pools.reduce((sum, pool) => sum + (pool.volume24h || 0), 0);
  }

  private getTopTradingPairs(pools: any[], limit = 10): any[] {
    return pools
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, limit)
      .map(pool => ({
        pair: pool.pair,
        volume24h: pool.volume24h,
        tvl: pool.tvl,
        apr: pool.apr,
        fees24h: pool.fees24h
      }));
  }

  private async cacheGranularData(data: PreloadedData): Promise<void> {
    const cachePromises = [
      this.context.cache.set('data:pools', data.pools, 60000),
      this.context.cache.set('data:tokens', data.tokens, 60000),
      this.context.cache.set('data:vaults', data.vaults, 60000),
      this.context.cache.set('data:metrics', {
        tvl: data.tvl,
        volume24h: data.volume24h,
        timestamp: data.timestamp
      }, 30000),
      this.context.cache.set('data:topPairs', data.topPairs, 30000)
    ];

    await Promise.all(cachePromises);
  }

  public subscribe(callback: (data: PreloadedData) => void): () => void {
    this.dataSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.dataSubscribers.delete(callback);
    };
  }

  private notifySubscribers(data: PreloadedData): void {
    this.dataSubscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.context.logger.error('Subscriber notification failed:', error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get specific data from cache
   */
  public async getCachedPools(): Promise<any[]> {
    return await this.context.cache.get('data:pools') || [];
  }

  public async getCachedTokens(): Promise<any[]> {
    return await this.context.cache.get('data:tokens') || [];
  }

  public async getCachedVaults(): Promise<any[]> {
    return await this.context.cache.get('data:vaults') || [];
  }

  public async getCachedMetrics(): Promise<any> {
    return await this.context.cache.get('data:metrics') || {};
  }
}