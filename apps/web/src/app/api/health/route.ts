import { NextResponse } from 'next/server';
import { getEnvironmentStatus } from '../../../lib/envValidation';
import { getHealthStatus } from '../../../lib/apiHardening';

export async function GET() {
  try {
    const envStatus = getEnvironmentStatus();
    const apiHealth = getHealthStatus();
    
    // WebSocket status - simplified for health check
    const wsStatus = {
      upstreamConnected: false, // Assume disconnected for now
      clientConnections: 0,
      cachedPairs: 0,
      lastUpdate: null,
      status: 'not_monitored'
    };
    
    // In development, be more lenient with API health status and env vars
    // Only fail if there are actual errors, not just because no requests have been made
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const apiHealthOk = isDevelopment 
      ? apiHealth.status !== 'unhealthy' || apiHealth.metrics.totalRequests === 0
      : apiHealth.status !== 'unhealthy';
    
    // In development, treat missing env vars as warnings, not failures
    const envHealthy = isDevelopment 
      ? true // Always pass env checks in development
      : envStatus.overall;
    
    const overallHealthy = envHealthy && apiHealthOk;
    
    const status = {
      healthy: overallHealthy,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && !envStatus.overall && {
        devMode: true,
        message: 'Development mode: environment validation issues treated as warnings'
      }),
      api: {
        status: apiHealth.status,
        metrics: apiHealth.metrics,
        cache: apiHealth.cache,
        rateLimit: apiHealth.rateLimit,
      },
      websocket: {
        upstreamConnected: wsStatus.upstreamConnected,
        clientConnections: wsStatus.clientConnections,
        cachedPairs: wsStatus.cachedPairs,
        lastUpdate: wsStatus.lastUpdate ? new Date(wsStatus.lastUpdate).toISOString() : null,
        status: wsStatus.upstreamConnected ? 'healthy' : 'disconnected',
      },
      services: {
        sacNft: {
          configured: envStatus.sacNft.isValid,
          issues: [
            ...envStatus.sacNft.missingVars.map(v => `Missing: ${v}`),
            ...envStatus.sacNft.errors
          ]
        },
        supabase: {
          configured: envStatus.supabase.isValid,
          issues: [
            ...envStatus.supabase.missingVars.map(v => `Missing: ${v}`),
            ...envStatus.supabase.errors
          ]
        }
      }
    };
    
    return NextResponse.json(status, {
      status: overallHealthy ? 200 : 503
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        healthy: false, 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}