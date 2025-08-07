/**
 * API Route to start orchestration
 * GET /api/orchestration/start
 */

import { NextResponse } from 'next/server';
import { OrchestrationManager } from '@/lib/orchestration/OrchestrationManager';

export async function GET() {
  try {
    // Get orchestration instance
    const orchestrator = OrchestrationManager.getInstance({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      websocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:8080',
      maxConcurrentAgents: 5,
      enableMetrics: true,
      logLevel: 'info'
    });

    // Start orchestration
    await orchestrator.start();

    // Get status
    const status = orchestrator.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Orchestration started successfully',
      status: {
        agents: Array.from(status.agents.entries()),
        activeAgents: status.activeAgents,
        connected: status.connected
      }
    });
  } catch (error) {
    console.error('Failed to start orchestration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}