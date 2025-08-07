import { NextRequest, NextResponse } from 'next/server';

// Mock metrics data - replace with real data source
const mockMetrics = {
  tvl: '$2.4M',
  volume: '$156K', 
  fees: '$1.2K',
  trades: '342'
};

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from your data source
    // For now, return mock data with some randomization
    const randomVariation = () => (Math.random() - 0.5) * 0.1 + 1; // ±10% variation
    
    const metrics = {
      tvl: `$${(2.4 * randomVariation()).toFixed(1)}M`,
      volume: `$${Math.floor(156 * randomVariation())}K`,
      fees: `$${(1.2 * randomVariation()).toFixed(1)}K`,
      trades: Math.floor(342 * randomVariation()).toString()
    };
    
    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Metrics API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch metrics',
        data: mockMetrics // Fallback to static mock data
      },
      { status: 500 }
    );
  }
}
