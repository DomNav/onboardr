import { NextRequest, NextResponse } from 'next/server';
import { defindexClient } from '@/lib/defindex/client';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'snapshot';

    // Return different data based on type
    switch (type) {
      case 'snapshot':
        const snapshot = await defindexClient.getProtocolSnapshot();
        return NextResponse.json(snapshot);
      
      case 'vaults':
        const vaults = await defindexClient.getVaultMetrics();
        return NextResponse.json({ vaults });
      
      case 'comparison':
        const comparison = await defindexClient.getComparison();
        return NextResponse.json(comparison);
      
      default:
        // Return combined data by default
        const [protocolSnapshot, vaultMetrics] = await Promise.all([
          defindexClient.getProtocolSnapshot(),
          defindexClient.getVaultMetrics(),
        ]);
        
        return NextResponse.json({
          protocol: protocolSnapshot,
          vaults: vaultMetrics,
        });
    }
  } catch (error) {
    console.error('Defindex metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Defindex metrics' },
      { status: 500 }
    );
  }
}

// Add CORS headers for API access
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}