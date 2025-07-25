import { BaseAgent, AgentContext, AgentPlan, AgentReport } from './base';
import { WalletAgent } from './walletAgent';
import { TradeAgent } from './tradeAgent';

export interface MasterTask {
  type: 'orchestrate' | 'delegate' | 'monitor' | 'coordinate';
  subTasks?: string[];
  targetAgent?: string;
  userIntent?: string;
  priority?: 'low' | 'medium' | 'high';
}

export class MasterAgent extends BaseAgent {
  private subAgents: Map<string, BaseAgent> = new Map();
  private activeOperations: Map<string, AgentReport[]> = new Map();

  constructor() {
    super(
      'master-agent',
      'Master Orchestrator Agent',
      ['orchestrate', 'delegate', 'coordinate', 'monitor', 'manage']
    );
    
    // Initialize sub-agents
    this.initializeSubAgents();
  }

  private initializeSubAgents(): void {
    const walletAgent = new WalletAgent();
    const tradeAgent = new TradeAgent();
    
    this.subAgents.set('wallet', walletAgent);
    this.subAgents.set('trade', tradeAgent);
    
    // Activate all agents
    this.subAgents.forEach(agent => agent.setActive(true));
  }

  async plan(task: string, context: AgentContext): Promise<AgentPlan> {
    const taskLower = task.toLowerCase();
    let steps: string[] = [];
    let dependencies: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let estimatedDuration = 3000;

    // Analyze task and determine which sub-agents are needed
    const requiredAgents = this.analyzeTaskRequirements(task);
    
    if (taskLower.includes('swap') || taskLower.includes('trade')) {
      steps = [
        'Validate wallet connection',
        'Calculate trade quote',
        'Prepare transaction',
        'Present for user approval',
        'Submit signed transaction',
        'Monitor completion'
      ];
      dependencies = ['wallet', 'trade', 'stellar-network'];
      riskLevel = 'high';
      estimatedDuration = 15000;
    } else if (taskLower.includes('connect') || taskLower.includes('wallet')) {
      steps = [
        'Validate wallet parameters',
        'Check network connection',
        'Verify account status',
        'Return connection result'
      ];
      dependencies = ['wallet', 'stellar-network'];
      riskLevel = 'medium';
      estimatedDuration = 5000;
    } else if (taskLower.includes('quote') || taskLower.includes('price')) {
      steps = [
        'Analyze token pair',
        'Check liquidity',
        'Calculate optimal route',
        'Return price quote'
      ];
      dependencies = ['trade'];
      riskLevel = 'low';
      estimatedDuration = 3000;
    } else {
      // Generic orchestration
      steps = [
        'Analyze user intent',
        'Delegate to appropriate agents',
        'Coordinate sub-agent activities',
        'Aggregate results',
        'Provide unified response'
      ];
      dependencies = requiredAgents;
      estimatedDuration = 8000;
    }

    return {
      agentId: this.agentId,
      task,
      steps,
      estimatedDuration,
      dependencies,
      riskLevel,
    };
  }

  async act(plan: AgentPlan, context: AgentContext): Promise<AgentReport> {
    const startTime = Date.now();
    const results: any = {};
    const errors: string[] = [];
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const taskData = this.parseTask(plan.task);
      
      switch (taskData.type) {
        case 'orchestrate':
          const orchestrationResult = await this.orchestrateWorkflow(plan.task, context);
          results.orchestration = orchestrationResult;
          break;

        case 'delegate':
          if (taskData.targetAgent && taskData.subTasks) {
            const delegationResult = await this.delegateToAgent(
              taskData.targetAgent,
              taskData.subTasks[0],
              context
            );
            results.delegation = delegationResult;
          }
          break;

        case 'monitor':
          const monitoringResult = this.getOperationStatus(operationId);
          results.monitoring = monitoringResult;
          break;

        case 'coordinate':
          const coordinationResult = await this.coordinateMultiAgentTask(plan.task, context);
          results.coordination = coordinationResult;
          break;

        default:
          // Default to orchestration
          const defaultResult = await this.orchestrateWorkflow(plan.task, context);
          results.default = defaultResult;
      }

      // Store operation results
      this.activeOperations.set(operationId, []);

    } catch (error) {
      errors.push(`Master agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    return this.report(results, context, {
      planId: plan.agentId,
      success,
      results,
      errors,
      duration,
      nextActions: success ? ['operation-complete'] : ['retry-with-fallback'],
      recommendations: this.generateRecommendations(results, errors),
    });
  }

  report(results: any, context: AgentContext, baseReport?: Partial<AgentReport>): AgentReport {
    return {
      planId: baseReport?.planId || 'default',
      success: baseReport?.success || false,
      results: baseReport?.results || results,
      errors: baseReport?.errors || [],
      duration: baseReport?.duration || 0,
      nextActions: baseReport?.nextActions || [],
      recommendations: baseReport?.recommendations || [],
    };
  }

  /**
   * Orchestrate a complex workflow involving multiple agents
   */
  private async orchestrateWorkflow(task: string, context: AgentContext): Promise<any> {
    const workflow = {
      task,
      startTime: Date.now(),
      steps: [],
      results: {},
    };

    // Determine workflow type based on task
    if (task.toLowerCase().includes('swap') || task.toLowerCase().includes('trade')) {
      return await this.executeTradeWorkflow(task, context, workflow);
    } else if (task.toLowerCase().includes('connect')) {
      return await this.executeConnectionWorkflow(task, context, workflow);
    } else {
      return await this.executeGenericWorkflow(task, context, workflow);
    }
  }

  /**
   * Execute trade workflow: wallet → quote → prepare → submit
   */
  private async executeTradeWorkflow(task: string, context: AgentContext, workflow: any): Promise<any> {
    const walletAgent = this.subAgents.get('wallet');
    const tradeAgent = this.subAgents.get('trade');

    if (!walletAgent || !tradeAgent) {
      throw new Error('Required agents not available');
    }

    // Step 1: Validate wallet
    const walletPlan = await walletAgent.plan('validate wallet connection', context);
    const walletResult = await walletAgent.act(walletPlan, context);
    workflow.steps.push({ agent: 'wallet', action: 'validate', result: walletResult });

    if (!walletResult.success) {
      throw new Error('Wallet validation failed');
    }

    // Step 2: Get quote
    const quotePlan = await tradeAgent.plan('calculate trade quote', context);
    const quoteResult = await tradeAgent.act(quotePlan, context);
    workflow.steps.push({ agent: 'trade', action: 'quote', result: quoteResult });

    if (!quoteResult.success) {
      throw new Error('Quote calculation failed');
    }

    // Step 3: Prepare trade (if user approves quote)
    const preparePlan = await tradeAgent.plan('prepare trade transaction', context);
    const prepareResult = await tradeAgent.act(preparePlan, context);
    workflow.steps.push({ agent: 'trade', action: 'prepare', result: prepareResult });

    workflow.results = {
      walletStatus: walletResult.results,
      quote: quoteResult.results,
      preparedTrade: prepareResult.results,
    };

    return workflow;
  }

  /**
   * Execute connection workflow: validate → connect → status
   */
  private async executeConnectionWorkflow(task: string, context: AgentContext, workflow: any): Promise<any> {
    const walletAgent = this.subAgents.get('wallet');

    if (!walletAgent) {
      throw new Error('Wallet agent not available');
    }

    const plan = await walletAgent.plan(task, context);
    const result = await walletAgent.act(plan, context);
    workflow.steps.push({ agent: 'wallet', action: 'connect', result });
    workflow.results = result.results;

    return workflow;
  }

  /**
   * Execute generic workflow: analyze → delegate → aggregate
   */
  private async executeGenericWorkflow(task: string, context: AgentContext, workflow: any): Promise<any> {
    const requiredAgents = this.analyzeTaskRequirements(task);
    const results: any = {};

    for (const agentName of requiredAgents) {
      const agent = this.subAgents.get(agentName);
      if (agent && agent.canHandle(task)) {
        try {
          const plan = await agent.plan(task, context);
          const result = await agent.act(plan, context);
          workflow.steps.push({ agent: agentName, action: 'execute', result });
          results[agentName] = result.results;
        } catch (error) {
          workflow.steps.push({ 
            agent: agentName, 
            action: 'error', 
            result: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
      }
    }

    workflow.results = results;
    return workflow;
  }

  /**
   * Delegate task to specific agent
   */
  private async delegateToAgent(agentName: string, task: string, context: AgentContext): Promise<AgentReport> {
    const agent = this.subAgents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const plan = await agent.plan(task, context);
    return await agent.act(plan, context);
  }

  /**
   * Coordinate multi-agent task execution
   */
  private async coordinateMultiAgentTask(task: string, context: AgentContext): Promise<any> {
    // Implementation for coordinating multiple agents simultaneously
    return { message: 'Multi-agent coordination not yet implemented' };
  }

  /**
   * Analyze task to determine required agents
   */
  private analyzeTaskRequirements(task: string): string[] {
    const taskLower = task.toLowerCase();
    const requiredAgents: string[] = [];

    if (taskLower.includes('wallet') || taskLower.includes('connect') || taskLower.includes('balance')) {
      requiredAgents.push('wallet');
    }

    if (taskLower.includes('trade') || taskLower.includes('swap') || taskLower.includes('quote')) {
      requiredAgents.push('trade');
    }

    // Default to wallet if no specific agents identified
    if (requiredAgents.length === 0) {
      requiredAgents.push('wallet');
    }

    return requiredAgents;
  }

  private parseTask(task: string): MasterTask {
    const taskLower = task.toLowerCase();

    if (taskLower.includes('orchestrate') || taskLower.includes('workflow')) {
      return { type: 'orchestrate' };
    } else if (taskLower.includes('delegate')) {
      return { type: 'delegate' };
    } else if (taskLower.includes('monitor')) {
      return { type: 'monitor' };
    } else if (taskLower.includes('coordinate')) {
      return { type: 'coordinate' };
    } else {
      return { type: 'orchestrate' }; // Default to orchestration
    }
  }

  private getOperationStatus(operationId: string): any {
    return {
      operationId,
      status: this.activeOperations.has(operationId) ? 'active' : 'not_found',
      reports: this.activeOperations.get(operationId) || [],
    };
  }

  private generateRecommendations(results: any, errors: string[]): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Review error logs and retry failed operations');
    }

    if (results.orchestration) {
      recommendations.push('Workflow orchestration completed');
    }

    if (results.delegation) {
      recommendations.push('Task delegation successful');
    }

    return recommendations;
  }

  /**
   * Get status of all sub-agents
   */
  getAgentStatuses(): Array<{ id: string; name: string; active: boolean; capabilities: string[] }> {
    const statuses: Array<{ id: string; name: string; active: boolean; capabilities: string[] }> = [];
    
    this.subAgents.forEach(agent => {
      statuses.push(agent.getStatus());
    });

    return statuses;
  }

  /**
   * Get specific agent by name
   */
  getAgent(name: string): BaseAgent | undefined {
    return this.subAgents.get(name);
  }
}