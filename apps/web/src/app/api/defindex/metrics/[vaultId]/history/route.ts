import { NextRequest, NextResponse } from 'next/server';
import { defindexClient } from '@/lib/defindex/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { vaultId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    
    // Validate range parameter
    if (!['7d', '30d', '90d'].includes(range)) {
      return NextResponse.json(
        { error: 'Invalid range. Use 7d, 30d, or 90d' },
        { status: 400 }
      );
    }
    
    const history = await defindexClient.getVaultHistory(params.vaultId, range);
    
    return NextResponse.json({
      vaultId: params.vaultId,
      range,
      data: history,
    });
  } catch (error) {
    console.error('Vault history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault history' },
      { status: 500 }
    );
  }
}

// Add CORS headers
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