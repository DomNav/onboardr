// Base Agent interface following the plan() → act() → report() pattern

export interface AgentContext {
  userId?: string;
  sessionId?: string;
  timestamp: number;
  environment: 'development' | 'production' | 'testnet';
}

export interface AgentPlan {
  agentId: string;
  task: string;
  steps: string[];
  estimatedDuration: number;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AgentAction {
  planId: string;
  stepIndex: number;
  action: string;
  payload: any;
  timestamp: number;
}

export interface AgentReport {
  planId: string;
  success: boolean;
  results: any;
  errors: string[];
  duration: number;
  nextActions?: string[];
  recommendations?: string[];
}

export abstract class BaseAgent {
  protected agentId: string;
  protected name: string;
  protected capabilities: string[];
  protected isActive: boolean = false;

  constructor(agentId: string, name: string, capabilities: string[]) {
    this.agentId = agentId;
    this.name = name;
    this.capabilities = capabilities;
  }

  /**
   * Plan phase - analyze task and create execution plan
   */
  abstract plan(task: string, context: AgentContext): Promise<AgentPlan>;

  /**
   * Act phase - execute the planned actions
   */
  abstract act(plan: AgentPlan, context: AgentContext): Promise<AgentReport>;

  /**
   * Report phase - summarize results and provide recommendations
   */
  abstract report(results: any, context: AgentContext): AgentReport;

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Check if agent can handle a specific task
   */
  canHandle(task: string): boolean {
    return this.capabilities.some(capability => 
      task.toLowerCase().includes(capability.toLowerCase())
    );
  }

  /**
   * Activate/deactivate agent
   */
  setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Get agent status
   */
  getStatus(): { id: string; name: string; active: boolean; capabilities: string[] } {
    return {
      id: this.agentId,
      name: this.name,
      active: this.isActive,
      capabilities: this.capabilities,
    };
  }
}