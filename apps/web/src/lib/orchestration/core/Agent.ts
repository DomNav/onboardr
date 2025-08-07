/**
 * Core Agent System for Orchestration
 * Implements the base agent pattern with scheduling and priority management
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { CacheManager } from '../cache/CacheManager';
import { MetricsCollector } from '../metrics/MetricsCollector';

export type AgentType = 'data' | 'trading' | 'analytics' | 'portfolio' | 'alert';
export type AgentPriority = 'critical' | 'high' | 'medium' | 'low';
export type AgentStatus = 'idle' | 'running' | 'error' | 'paused';

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  priority: AgentPriority;
  interval?: number; // milliseconds
  retryAttempts?: number;
  timeout?: number;
  enabled?: boolean;
}

export interface AgentContext {
  cache: CacheManager;
  metrics: MetricsCollector;
  logger: Logger;
  data?: any;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: Error;
  timestamp: number;
  duration: number;
}

export abstract class Agent extends EventEmitter {
  protected config: AgentConfig;
  protected context: AgentContext;
  protected status: AgentStatus = 'idle';
  protected lastRun?: Date;
  protected nextRun?: Date;
  protected runCount = 0;
  protected errorCount = 0;
  private intervalId?: NodeJS.Timeout;

  constructor(config: AgentConfig, context: AgentContext) {
    super();
    this.config = {
      retryAttempts: 3,
      timeout: 30000,
      enabled: true,
      ...config
    };
    this.context = context;
  }

  /**
   * Abstract method to be implemented by specific agents
   */
  protected abstract execute(): Promise<any>;

  /**
   * Start the agent with automatic scheduling
   */
  public async start(): Promise<void> {
    if (!this.config.enabled) {
      this.context.logger.info(`Agent ${this.config.name} is disabled`);
      return;
    }

    this.context.logger.info(`Starting agent: ${this.config.name}`);
    
    // Run immediately
    await this.run();

    // Schedule if interval is specified
    if (this.config.interval) {
      this.intervalId = setInterval(() => {
        this.run().catch(err => {
          this.context.logger.error(`Agent ${this.config.name} scheduled run failed:`, err);
        });
      }, this.config.interval);
    }
  }

  /**
   * Stop the agent
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.status = 'paused';
    this.context.logger.info(`Stopped agent: ${this.config.name}`);
  }

  /**
   * Run the agent once
   */
  public async run(): Promise<AgentResult> {
    if (this.status === 'running') {
      this.context.logger.warn(`Agent ${this.config.name} is already running`);
      return {
        success: false,
        error: new Error('Agent is already running'),
        timestamp: Date.now(),
        duration: 0
      };
    }

    const startTime = Date.now();
    this.status = 'running';
    this.lastRun = new Date();
    this.runCount++;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout();
      
      // Cache the result if successful
      if (result) {
        await this.cacheResult(result);
      }

      // Update metrics
      this.context.metrics.recordAgentRun(this.config.id, true, Date.now() - startTime);

      // Emit success event
      this.emit('success', result);

      this.status = 'idle';
      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.errorCount++;
      this.status = 'error';
      
      this.context.logger.error(`Agent ${this.config.name} failed:`, error);
      this.context.metrics.recordAgentRun(this.config.id, false, Date.now() - startTime);
      
      // Emit error event
      this.emit('error', error);

      // Retry if configured
      if (this.config.retryAttempts && this.errorCount <= this.config.retryAttempts) {
        this.context.logger.info(`Retrying agent ${this.config.name} (${this.errorCount}/${this.config.retryAttempts})`);
        await this.delay(this.getRetryDelay());
        return this.run();
      }

      this.status = 'idle';
      return {
        success: false,
        error: error as Error,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Agent ${this.config.name} timed out after ${this.config.timeout}ms`));
      }, this.config.timeout!);

      try {
        const result = await this.execute();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Cache the agent result
   */
  private async cacheResult(data: any): Promise<void> {
    const cacheKey = `agent:${this.config.id}:result`;
    const ttl = this.config.interval || 60000; // Use interval as TTL or default to 1 minute
    await this.context.cache.set(cacheKey, data, ttl);
  }

  /**
   * Get cached result
   */
  public async getCachedResult(): Promise<any> {
    const cacheKey = `agent:${this.config.id}:result`;
    return this.context.cache.get(cacheKey);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(): number {
    return Math.min(1000 * Math.pow(2, this.errorCount - 1), 30000);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get agent status and metadata
   */
  public getStatus() {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      priority: this.config.priority,
      status: this.status,
      enabled: this.config.enabled,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      runCount: this.runCount,
      errorCount: this.errorCount
    };
  }

  /**
   * Update agent configuration
   */
  public updateConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart if interval changed
    if (config.interval !== undefined && this.intervalId) {
      this.stop();
      this.start();
    }
  }
}