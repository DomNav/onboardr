/**
 * Trading Agent
 * Handles trade execution and monitoring
 */

import { Agent, AgentConfig, AgentContext } from '../core/Agent';
import { getSwapQuote, executeSwap } from '../../soroswap/api';

export interface TradeRequest {
  id: string;
  fromToken: string;
  toToken: string;
  amount: string;
  userAddress: string;
  slippage?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

export class TradingAgent extends Agent {
  private tradeQueue: TradeRequest[] = [];
  private executingTrades: Map<string, TradeRequest> = new Map();

  constructor(context: AgentContext) {
    const config: AgentConfig = {
      id: 'trading',
      name: 'Trading Agent',
      type: 'trading',
      priority: 'high',
      interval: 5000, // Check every 5 seconds
      retryAttempts: 2,
      timeout: 30000
    };
    super(config, context);
  }

  protected async execute(): Promise<any> {
    // Process pending trades
    const pendingTrades = this.tradeQueue.filter(t => t.status === 'pending');
    
    if (pendingTrades.length === 0) {
      return { processed: 0, queue: this.tradeQueue.length };
    }

    const results = [];
    
    for (const trade of pendingTrades.slice(0, 5)) { // Process max 5 trades at once
      try {
        const result = await this.processTrade(trade);
        results.push(result);
      } catch (error) {
        this.context.logger.error(`Trade ${trade.id} failed:`, error);
        trade.status = 'failed';
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      queue: this.tradeQueue.length
    };
  }

  private async processTrade(trade: TradeRequest): Promise<any> {
    trade.status = 'executing';
    this.executingTrades.set(trade.id, trade);

    try {
      // Get quote first
      const quote = await getSwapQuote(
        trade.fromToken,
        trade.toToken,
        trade.amount,
        trade.slippage || 0.5
      );

      // Cache quote for UI
      await this.context.cache.set(`trade:${trade.id}:quote`, quote, 60000);

      // Execute swap
      const result = await executeSwap(
        trade.fromToken,
        trade.toToken,
        trade.amount,
        trade.userAddress,
        trade.slippage || 0.5
      );

      trade.status = 'completed';
      this.executingTrades.delete(trade.id);

      // Cache result
      await this.context.cache.set(`trade:${trade.id}:result`, result, 300000);

      // Emit success event
      this.emit('trade:completed', { tradeId: trade.id, result });

      return { success: true, tradeId: trade.id, result };
    } catch (error) {
      trade.status = 'failed';
      this.executingTrades.delete(trade.id);
      
      // Emit failure event
      this.emit('trade:failed', { tradeId: trade.id, error });
      
      throw error;
    }
  }

  public addTrade(trade: Omit<TradeRequest, 'id' | 'status' | 'createdAt'>): string {
    const tradeRequest: TradeRequest = {
      ...trade,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date()
    };

    this.tradeQueue.push(tradeRequest);
    
    // Wake up the agent if it's idle
    if (this.getStatus().status === 'idle') {
      this.run();
    }

    return tradeRequest.id;
  }

  public getTrade(tradeId: string): TradeRequest | undefined {
    return this.tradeQueue.find(t => t.id === tradeId) || 
           this.executingTrades.get(tradeId);
  }

  public getTradeQueue(): TradeRequest[] {
    return [...this.tradeQueue];
  }

  public cancelTrade(tradeId: string): boolean {
    const index = this.tradeQueue.findIndex(t => t.id === tradeId);
    if (index !== -1 && this.tradeQueue[index].status === 'pending') {
      this.tradeQueue.splice(index, 1);
      return true;
    }
    return false;
  }
}