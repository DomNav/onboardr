/**
 * Alert Agent
 * Monitors conditions and triggers alerts
 */

import { Agent, AgentConfig, AgentContext } from '../core/Agent';

export interface Alert {
  id: string;
  type: 'price' | 'tvl' | 'volume' | 'apy' | 'gas';
  condition: 'above' | 'below' | 'change';
  threshold: number;
  token?: string;
  pool?: string;
  message: string;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export class AlertAgent extends Agent {
  private alerts: Alert[] = [];
  private triggeredAlerts: Alert[] = [];

  constructor(context: AgentContext) {
    const config: AgentConfig = {
      id: 'alerts',
      name: 'Alert Agent',
      type: 'alert',
      priority: 'high',
      interval: 10000, // Check every 10 seconds
      retryAttempts: 1,
      timeout: 10000
    };
    super(config, context);
  }

  protected async execute(): Promise<any> {
    const activeAlerts = this.alerts.filter(a => !a.triggered);
    
    if (activeAlerts.length === 0) {
      return { checked: 0, triggered: 0 };
    }

    const triggered = [];
    
    for (const alert of activeAlerts) {
      const shouldTrigger = await this.checkAlert(alert);
      
      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = new Date();
        this.triggeredAlerts.push(alert);
        triggered.push(alert);
        
        // Emit alert event
        this.emit('alert:triggered', alert);
        
        // Cache triggered alert
        await this.context.cache.set(`alert:${alert.id}:triggered`, alert, 3600000);
      }
    }

    return {
      checked: activeAlerts.length,
      triggered: triggered.length,
      alerts: triggered
    };
  }

  private async checkAlert(alert: Alert): Promise<boolean> {
    try {
      switch (alert.type) {
        case 'price':
          return await this.checkPriceAlert(alert);
        case 'tvl':
          return await this.checkTVLAlert(alert);
        case 'volume':
          return await this.checkVolumeAlert(alert);
        case 'apy':
          return await this.checkAPYAlert(alert);
        case 'gas':
          return await this.checkGasAlert(alert);
        default:
          return false;
      }
    } catch (error) {
      this.context.logger.error(`Failed to check alert ${alert.id}:`, error);
      return false;
    }
  }

  private async checkPriceAlert(alert: Alert): Promise<boolean> {
    if (!alert.token) return false;
    
    const tokens = await this.context.cache.get('data:tokens') || [];
    const token = tokens.find(t => t.symbol === alert.token);
    
    if (!token || !token.price) return false;
    
    switch (alert.condition) {
      case 'above':
        return token.price > alert.threshold;
      case 'below':
        return token.price < alert.threshold;
      case 'change':
        return Math.abs(token.priceChange24h || 0) > alert.threshold;
      default:
        return false;
    }
  }

  private async checkTVLAlert(alert: Alert): Promise<boolean> {
    const metrics = await this.context.cache.get('data:metrics');
    if (!metrics) return false;
    
    const tvl = metrics.tvl || 0;
    
    switch (alert.condition) {
      case 'above':
        return tvl > alert.threshold;
      case 'below':
        return tvl < alert.threshold;
      default:
        return false;
    }
  }

  private async checkVolumeAlert(alert: Alert): Promise<boolean> {
    const metrics = await this.context.cache.get('data:metrics');
    if (!metrics) return false;
    
    const volume = metrics.volume24h || 0;
    
    switch (alert.condition) {
      case 'above':
        return volume > alert.threshold;
      case 'below':
        return volume < alert.threshold;
      default:
        return false;
    }
  }

  private async checkAPYAlert(alert: Alert): Promise<boolean> {
    if (!alert.pool) return false;
    
    const pools = await this.context.cache.get('data:pools') || [];
    const pool = pools.find(p => p.pair === alert.pool);
    
    if (!pool || !pool.apr) return false;
    
    switch (alert.condition) {
      case 'above':
        return pool.apr > alert.threshold;
      case 'below':
        return pool.apr < alert.threshold;
      default:
        return false;
    }
  }

  private async checkGasAlert(alert: Alert): Promise<boolean> {
    const networkStats = await this.context.cache.get('analytics:network');
    if (!networkStats) return false;
    
    const gasPrice = networkStats.gasPrice || 0;
    
    switch (alert.condition) {
      case 'above':
        return gasPrice > alert.threshold;
      case 'below':
        return gasPrice < alert.threshold;
      default:
        return false;
    }
  }

  public addAlert(alert: Omit<Alert, 'id' | 'triggered' | 'createdAt'>): string {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggered: false,
      createdAt: new Date()
    };

    this.alerts.push(newAlert);
    
    // Wake up the agent
    if (this.getStatus().status === 'idle') {
      this.run();
    }

    return newAlert.id;
  }

  public removeAlert(alertId: string): boolean {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      this.alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public getTriggeredAlerts(): Alert[] {
    return [...this.triggeredAlerts];
  }

  public clearTriggeredAlerts(): void {
    this.triggeredAlerts = [];
  }
}