import { NextResponse } from 'next/server';
import { hardenedFetch } from '@/lib/apiHardening';

interface TvlResponse {
  tvlUsd: number;
  volume24hUsd: number;
}

const DUNE_BASE_URL = 'https://api.dune.com/api/v1';
const GRAPH_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/soroswap/soroswap-subgraph';

const validateDuneApiKey = (): string => {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    throw new Error('DUNE_API_KEY environment variable is required');
  }
  return apiKey;
};

const fetchDuneData = async (): Promise<TvlResponse> => {
  const apiKey = validateDuneApiKey();
  
  // Query for Soroswap TVL and volume data
  // This is a placeholder query ID - replace with actual Soroswap query
  const queryId = 'soroswap-tvl-volume';
  const url = `${DUNE_BASE_URL}/query/${queryId}/results`;
  
  const data = await hardenedFetch<any>(
    url,
    {
      method: 'GET',
      headers: {
        'X-Dune-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    },
    `dune-${queryId}`, // Cache key
    60000 // 1 minute cache TTL for market data
  );
  
  // Extract TVL and volume from Dune response
  // Adjust this based on actual Dune query structure
  const result = data.result?.rows?.[0];
  if (!result) {
    throw new Error('No data returned from Dune query');
  }

  return {
    tvlUsd: result.tvl_usd || 0,
    volume24hUsd: result.volume_24h_usd || 0,
  };
};

const fetchGraphData = async (): Promise<TvlResponse> => {
  const query = `
    query {
      protocol(id: "1") {
        totalValueLockedUSD
        totalVolumeUSD
      }
    }
  `;

  const data = await hardenedFetch<any>(
    GRAPH_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
    'graph-protocol-data', // Cache key
    60000 // 1 minute cache TTL
  );

  const protocol = data.data?.protocol;
  
  if (!protocol) {
    throw new Error('No protocol data returned from The Graph');
  }

  return {
    tvlUsd: parseFloat(protocol.totalValueLockedUSD) || 0,
    volume24hUsd: parseFloat(protocol.totalVolumeUSD) || 0,
  };
};

export async function GET() {
  try {
    let data: TvlResponse;
    
    try {
      // Try Dune first
      data = await fetchDuneData();
    } catch (duneError) {
      console.error('Failed to fetch from Dune API:', duneError);
      
      // Fallback to The Graph if Dune fails
      try {
        data = await fetchGraphData();
      } catch (graphError) {
        console.error('Fallback to The Graph also failed:', graphError);
        
        // In development, return zeroed data with 200 status for graceful degradation
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Development mode: returning zeroed market data due to API failures');
          return NextResponse.json({
            tvlUsd: 0,
            volume24hUsd: 0,
            updatedAt: new Date().toISOString(),
            devMode: true,
            message: 'Using stub data - external APIs unavailable'
          });
        }
        
        // Return error response if both fail in production
        return NextResponse.json(
          { 
            error: 'Both Dune and Graph APIs failed',
            tvlUsd: 0,
            volume24hUsd: 0,
            updatedAt: new Date().toISOString()
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Market data API error:', error);
    
    // In development, return zeroed data with 200 status for graceful degradation
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Development mode: returning zeroed market data due to API error');
      return NextResponse.json({
        tvlUsd: 0,
        volume24hUsd: 0,
        updatedAt: new Date().toISOString(),
        devMode: true,
        message: 'Using stub data - API error occurred'
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        tvlUsd: 0,
        volume24hUsd: 0,
        updatedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}