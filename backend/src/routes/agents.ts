import { Router, Request, Response } from 'express';
import { MasterAgent } from '../agents/masterAgent';
import { AgentContext } from '../agents/base';

const router: Router = Router();
const masterAgent = new MasterAgent();

/**
 * POST /api/agents/execute
 * Execute a task using the agent framework
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { task, userId, sessionId } = req.body;

    if (!task) {
      return res.status(400).json({
        error: 'Missing required field: task',
      });
    }

    const context: AgentContext = {
      userId,
      sessionId,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'testnet',
    };

    console.log(`🤖 Agent executing task: "${task}"`);

    // Plan the task
    const plan = await masterAgent.plan(task, context);
    console.log(`📋 Plan created with ${plan.steps.length} steps`);

    // Execute the plan
    const report = await masterAgent.act(plan, context);
    console.log(`✅ Task completed in ${report.duration}ms`);

    res.json({
      success: report.success,
      task,
      plan: {
        agentId: plan.agentId,
        steps: plan.steps,
        estimatedDuration: plan.estimatedDuration,
        riskLevel: plan.riskLevel,
      },
      results: report.results,
      duration: report.duration,
      nextActions: report.nextActions,
      recommendations: report.recommendations,
      errors: report.errors,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({
      error: 'Agent execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/agents/plan
 * Create an execution plan without executing
 */
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const { task, userId, sessionId } = req.body;

    if (!task) {
      return res.status(400).json({
        error: 'Missing required field: task',
      });
    }

    const context: AgentContext = {
      userId,
      sessionId,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'testnet',
    };

    const plan = await masterAgent.plan(task, context);

    res.json({
      success: true,
      task,
      plan: {
        agentId: plan.agentId,
        steps: plan.steps,
        estimatedDuration: plan.estimatedDuration,
        dependencies: plan.dependencies,
        riskLevel: plan.riskLevel,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent planning error:', error);
    res.status(500).json({
      error: 'Agent planning failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agents/status
 * Get status of all agents
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const agentStatuses = masterAgent.getAgentStatuses();
    const masterStatus = masterAgent.getStatus();

    res.json({
      master: masterStatus,
      subAgents: agentStatuses,
      totalAgents: agentStatuses.length + 1,
      activeAgents: agentStatuses.filter(agent => agent.active).length + (masterStatus.active ? 1 : 0),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent status error:', error);
    res.status(500).json({
      error: 'Failed to get agent status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agents/capabilities
 * Get all agent capabilities
 */
router.get('/capabilities', (req: Request, res: Response) => {
  try {
    const agentStatuses = masterAgent.getAgentStatuses();
    const masterStatus = masterAgent.getStatus();

    const allCapabilities = new Set<string>();
    
    // Add master agent capabilities
    masterStatus.capabilities.forEach(cap => allCapabilities.add(cap));
    
    // Add sub-agent capabilities
    agentStatuses.forEach(agent => {
      agent.capabilities.forEach(cap => allCapabilities.add(cap));
    });

    const capabilityMap = {
      master: masterStatus.capabilities,
      subAgents: agentStatuses.reduce((acc, agent) => {
        acc[agent.id] = agent.capabilities;
        return acc;
      }, {} as Record<string, string[]>),
    };

    res.json({
      allCapabilities: Array.from(allCapabilities).sort(),
      byAgent: capabilityMap,
      totalCapabilities: allCapabilities.size,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent capabilities error:', error);
    res.status(500).json({
      error: 'Failed to get agent capabilities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/agents/health
 * Health check for agent system
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const agentStatuses = masterAgent.getAgentStatuses();
    const allHealthy = agentStatuses.every(agent => agent.active);

    res.json({
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'agent-framework',
      masterAgent: masterAgent.getStatus(),
      subAgents: agentStatuses.length,
      activeAgents: agentStatuses.filter(agent => agent.active).length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Agent health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };