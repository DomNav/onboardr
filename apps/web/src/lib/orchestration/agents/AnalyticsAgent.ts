/**
 * Analytics Agent
 * Processes and aggregates analytics data
 */

import { Agent, AgentConfig, AgentContext } from '../core/Agent';

export interface AnalyticsData {
  tvlHistory: Array<{ timestamp: number; value: number }>;
  volumeHistory: Array<{ timestamp: number; value: number }>;
  topGainers: Array<{ token: string; change: number }>;
  topLosers: Array<{ token: string; change: number }>;
  gasPrice: number;
  activeUsers: number;
  totalTransactions: number;
}

export class AnalyticsAgent extends Agent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      id: 'analytics',
      name: 'Analytics Agent',
      type: 'analytics',
      priority: 'medium',
      interval: 60000, // Every minute
      retryAttempts: 2,
      timeout: 20000
    };
    super(config, context);
  }

  protected async execute(): Promise<AnalyticsData> {
    const [tvlHistory, volumeHistory, priceMovers, networkStats] = await Promise.all([
      this.fetchTVLHistory(),
      this.fetchVolumeHistory(),
      this.calculatePriceMovers(),
      this.fetchNetworkStats()
    ]);

    const analyticsData: AnalyticsData = {
      tvlHistory,
      volumeHistory,
      topGainers: priceMovers.gainers,
      topLosers: priceMovers.losers,
      gasPrice: networkStats.gasPrice,
      activeUsers: networkStats.activeUsers,
      totalTransactions: networkStats.transactions
    };

    // Cache aggregated analytics
    await this.context.cache.set('analytics:summary', analyticsData, 60000);
    
    // Cache individual metrics for granular access
    await this.cacheIndividualMetrics(analyticsData);

    return analyticsData;
  }

  private async fetchTVLHistory(): Promise<Array<{ timestamp: number; value: number }>> {
    // Get cached pools data
    const pools = await this.context.cache.get('data:pools') || [];
    const vaults = await this.context.cache.get('data:vaults') || [];
    
    const totalTVL = [...pools, ...vaults].reduce((sum, item) => sum + (item.tvl || 0), 0);
    
    // Generate history (mock for now)
    const history = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      history.push({
        timestamp: now - (i * 3600000), // Hourly data
        value: totalTVL * (0.95 + Math.random() * 0.1) // ±5% variation
      });
    }
    
    return history;
  }

  private async fetchVolumeHistory(): Promise<Array<{ timestamp: number; value: number }>> {
    const pools = await this.context.cache.get('data:pools') || [];
    const totalVolume = pools.reduce((sum, pool) => sum + (pool.volume24h || 0), 0);
    
    const history = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      history.push({
        timestamp: now - (i * 3600000),
        value: totalVolume * (0.8 + Math.random() * 0.4) // More variation
      });
    }
    
    return history;
  }

  private async calculatePriceMovers(): Promise<{ gainers: any[]; losers: any[] }> {
    const tokens = await this.context.cache.get('data:tokens') || [];
    
    // Calculate price changes (mock)
    const withChanges = tokens.map(token => ({
      token: token.symbol,
      change: -10 + Math.random() * 20 // -10% to +10%
    }));
    
    const sorted = withChanges.sort((a, b) => b.change - a.change);
    
    return {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse()
    };
  }

  private async fetchNetworkStats(): Promise<any> {
    // Mock network statistics
    return {
      gasPrice: 0.0001 + Math.random() * 0.0002,
      activeUsers: Math.floor(1000 + Math.random() * 500),
      transactions: Math.floor(10000 + Math.random() * 5000)
    };
  }

  private async cacheIndividualMetrics(data: AnalyticsData): Promise<void> {
    await Promise.all([
      this.context.cache.set('analytics:tvl:history', data.tvlHistory, 300000),
      this.context.cache.set('analytics:volume:history', data.volumeHistory, 300000),
      this.context.cache.set('analytics:movers', {
        gainers: data.topGainers,
        losers: data.topLosers
      }, 60000),
      this.context.cache.set('analytics:network', {
        gasPrice: data.gasPrice,
        activeUsers: data.activeUsers,
        totalTransactions: data.totalTransactions
      }, 30000)
    ]);
  }

  public async getMetric(metric: string): Promise<any> {
    return this.context.cache.get(`analytics:${metric}`);
  }
}