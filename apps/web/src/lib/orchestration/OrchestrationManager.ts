/**
 * Orchestration Manager
 * Central coordinator for all agents and system components
 */

import { EventEmitter } from 'events';
import { Agent, AgentPriority } from './core/Agent';
import { DataPreloadAgent } from './agents/DataPreloadAgent';
import { TradingAgent } from './agents/TradingAgent';
import { AnalyticsAgent } from './agents/AnalyticsAgent';
import { AlertAgent } from './agents/AlertAgent';
import { CacheManager } from './cache/CacheManager';
import { WebSocketManager } from './websocket/WebSocketManager';
import { MetricsCollector } from './metrics/MetricsCollector';
import { Logger } from './utils/Logger';

export interface OrchestrationConfig {
  redisUrl?: string;
  websocketUrl?: string;
  maxConcurrentAgents?: number;
  enableMetrics?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface OrchestrationStatus {
  agents: Map<string, any>;
  activeAgents: number;
  totalRuns: number;
  errors: number;
  uptime: number;
  connected: boolean;
}

export class OrchestrationManager extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private cache: CacheManager;
  private websocket?: WebSocketManager;
  private metrics: MetricsCollector;
  private logger: Logger;
  private config: OrchestrationConfig;
  private startTime: Date;
  private isRunning: boolean = false;
  private runningAgents: Set<string> = new Set();
  private maxConcurrent: number;

  private static instance: OrchestrationManager;

  private constructor(config: OrchestrationConfig = {}) {
    super();
    this.config = config;
    this.maxConcurrent = config.maxConcurrentAgents || 5;
    this.startTime = new Date();
    
    // Initialize components
    this.logger = new Logger('OrchestrationManager', config.logLevel);
    this.cache = new CacheManager(config.redisUrl, this.logger);
    this.metrics = new MetricsCollector(config.enableMetrics);
    
    // Initialize WebSocket if URL provided
    if (config.websocketUrl) {
      this.websocket = new WebSocketManager(config.websocketUrl, this.logger);
    }
    
    // Setup error handling
    this.setupErrorHandling();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: OrchestrationConfig): OrchestrationManager {
    if (!OrchestrationManager.instance) {
      OrchestrationManager.instance = new OrchestrationManager(config);
    }
    return OrchestrationManager.instance;
  }

  /**
   * Initialize and start all agents
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Orchestration already running');
      return;
    }

    this.logger.info('Starting orchestration system...');
    this.isRunning = true;

    try {
      // Initialize WebSocket connection
      if (this.websocket) {
        await this.websocket.connect();
        this.setupWebSocketHandlers();
      }

      // Initialize agents
      await this.initializeAgents();

      // Start agents based on priority
      await this.startAgentsByPriority();

      this.logger.info('Orchestration system started successfully');
      this.emit('started');

    } catch (error) {
      this.logger.error('Failed to start orchestration:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop all agents and cleanup
   */
  public async stop(): Promise<void> {
    this.logger.info('Stopping orchestration system...');
    
    // Stop all agents
    for (const agent of this.agents.values()) {
      agent.stop();
    }

    // Close connections
    if (this.websocket) {
      await this.websocket.disconnect();
    }
    
    await this.cache.close();
    
    this.isRunning = false;
    this.logger.info('Orchestration system stopped');
    this.emit('stopped');
  }

  /**
   * Initialize all agents
   */
  private async initializeAgents(): Promise<void> {
    const context = {
      cache: this.cache,
      metrics: this.metrics,
      logger: this.logger
    };

    // Create agents
    const agents = [
      new DataPreloadAgent(context),
      new TradingAgent(context),
      new AnalyticsAgent(context),
      new AlertAgent(context)
    ];

    // Register agents
    for (const agent of agents) {
      this.registerAgent(agent);
    }

    this.logger.info(`Initialized ${agents.length} agents`);
  }

  /**
   * Register an agent
   */
  public registerAgent(agent: Agent): void {
    const status = agent.getStatus();
    this.agents.set(status.id, agent);
    
    // Setup agent event listeners
    agent.on('success', (data) => {
      this.handleAgentSuccess(status.id, data);
    });
    
    agent.on('error', (error) => {
      this.handleAgentError(status.id, error);
    });

    this.logger.debug(`Registered agent: ${status.name}`);
  }

  /**
   * Start agents by priority
   */
  private async startAgentsByPriority(): Promise<void> {
    const priorityOrder: AgentPriority[] = ['critical', 'high', 'medium', 'low'];
    
    for (const priority of priorityOrder) {
      const agentsToStart = Array.from(this.agents.values())
        .filter(agent => agent.getStatus().priority === priority);
      
      // Start agents with rate limiting
      for (const agent of agentsToStart) {
        await this.startAgentWithLimit(agent);
      }
    }
  }

  /**
   * Start agent with concurrency limit
   */
  private async startAgentWithLimit(agent: Agent): Promise<void> {
    // Wait if too many agents running
    while (this.runningAgents.size >= this.maxConcurrent) {
      await this.delay(100);
    }

    const status = agent.getStatus();
    this.runningAgents.add(status.id);
    
    try {
      await agent.start();
    } finally {
      this.runningAgents.delete(status.id);
    }
  }

  /**
   * Handle agent success
   */
  private handleAgentSuccess(agentId: string, data: any): void {
    this.metrics.recordAgentSuccess(agentId);
    
    // Broadcast updates via WebSocket
    if (this.websocket) {
      this.websocket.broadcast('agent:success', {
        agentId,
        data,
        timestamp: Date.now()
      });
    }

    this.emit('agent:success', { agentId, data });
  }

  /**
   * Handle agent error
   */
  private handleAgentError(agentId: string, error: Error): void {
    this.logger.error(`Agent ${agentId} error:`, error);
    this.metrics.recordAgentError(agentId);
    
    // Broadcast error via WebSocket
    if (this.websocket) {
      this.websocket.broadcast('agent:error', {
        agentId,
        error: error.message,
        timestamp: Date.now()
      });
    }

    this.emit('agent:error', { agentId, error });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.websocket) return;

    this.websocket.on('client:connected', (clientId) => {
      this.logger.info(`Client connected: ${clientId}`);
      
      // Send initial data to new client
      this.sendInitialData(clientId);
    });

    this.websocket.on('client:message', async (clientId, message) => {
      await this.handleClientMessage(clientId, message);
    });
  }

  /**
   * Send initial data to newly connected client
   */
  private async sendInitialData(clientId: string): Promise<void> {
    if (!this.websocket) return;

    // Get cached data
    const metrics = await this.cache.get('data:metrics');
    const pools = await this.cache.get('data:pools');
    const vaults = await this.cache.get('data:vaults');

    this.websocket.sendToClient(clientId, 'initial:data', {
      metrics,
      pools: pools?.slice(0, 10), // Send top 10 pools
      vaults: vaults?.slice(0, 5), // Send top 5 vaults
      timestamp: Date.now()
    });
  }

  /**
   * Handle messages from clients
   */
  private async handleClientMessage(clientId: string, message: any): Promise<void> {
    const { type, payload } = message;

    switch (type) {
      case 'request:refresh':
        await this.refreshData(payload?.agentId);
        break;
      
      case 'subscribe:updates':
        this.subscribeClientToUpdates(clientId, payload?.topics);
        break;
      
      case 'execute:trade':
        await this.executeTrade(clientId, payload);
        break;
      
      default:
        this.logger.warn(`Unknown message type: ${type}`);
    }
  }

  /**
   * Refresh data for specific agent or all
   */
  public async refreshData(agentId?: string): Promise<void> {
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        await agent.run();
      }
    } else {
      // Refresh critical agents
      const dataAgent = this.agents.get('data-preload');
      if (dataAgent) {
        await dataAgent.run();
      }
    }
  }

  /**
   * Subscribe client to specific update topics
   */
  private subscribeClientToUpdates(clientId: string, topics: string[] = []): void {
    // Implementation would track subscriptions per client
    this.logger.info(`Client ${clientId} subscribed to topics:`, topics);
  }

  /**
   * Execute trade through trading agent
   */
  private async executeTrade(clientId: string, tradeData: any): Promise<void> {
    const tradingAgent = this.agents.get('trading');
    if (!tradingAgent) {
      this.logger.error('Trading agent not found');
      return;
    }

    try {
      const result = await tradingAgent.run();
      
      if (this.websocket) {
        this.websocket.sendToClient(clientId, 'trade:result', result);
      }
    } catch (error) {
      if (this.websocket) {
        this.websocket.sendToClient(clientId, 'trade:error', {
          error: error.message
        });
      }
    }
  }

  /**
   * Get orchestration status
   */
  public getStatus(): OrchestrationStatus {
    const agentStatuses = new Map();
    
    for (const [id, agent] of this.agents) {
      agentStatuses.set(id, agent.getStatus());
    }

    return {
      agents: agentStatuses,
      activeAgents: this.runningAgents.size,
      totalRuns: this.metrics.getTotalRuns(),
      errors: this.metrics.getTotalErrors(),
      uptime: Date.now() - this.startTime.getTime(),
      connected: this.websocket?.isConnected() || false
    };
  }

  /**
   * Get specific agent
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      this.metrics.recordError('uncaught', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection:', reason);
      this.metrics.recordError('unhandled', reason as Error);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}