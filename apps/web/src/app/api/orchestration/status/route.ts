/**
 * API Route to check orchestration status
 * GET /api/orchestration/status
 */

import { NextResponse } from 'next/server';
import { OrchestrationManager } from '@/lib/orchestration/OrchestrationManager';

export async function GET() {
  try {
    const orchestrator = OrchestrationManager.getInstance();
    const status = orchestrator.getStatus();

    return NextResponse.json({
      running: status.connected,
      agents: Array.from(status.agents.entries()).map(([id, agent]) => ({
        id,
        ...agent
      })),
      activeAgents: status.activeAgents,
      totalRuns: status.totalRuns,
      errors: status.errors,
      uptime: status.uptime
    });
  } catch (error) {
    return NextResponse.json({
      running: false,
      error: 'Orchestration not initialized'
    });
  }
}