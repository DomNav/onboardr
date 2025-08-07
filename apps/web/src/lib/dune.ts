export interface MarketOverviewRow {
  date: string;
  // Token prices (if that's what the query returns)
  xlm: number;
  usdc: number;
  aqua: number;
  // Likely additional fields from Soroswap market data:
  // xlm_volume?: number;
  // usdc_volume?: number;
  // aqua_volume?: number;
  // total_volume?: number;
  // total_tvl?: number;
  // active_pairs?: number;
  // Add any other token columns returned by Dune query 4341139
}

export async function fetchMarketOverview(): Promise<MarketOverviewRow[]> {
  const apiKey = process.env.DUNE_API_KEY;
  
  if (!apiKey) {
    throw new Error('DUNE_API_KEY environment variable is not set');
  }

  const res = await fetch(
    `https://api.dune.com/api/v1/query/4341139/results?api_key=${apiKey}`,
    { 
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Dune query failed: ${res.status} ${res.statusText}`);
  }

  const { result } = await res.json();
  
  // Debug: Log the actual structure returned by Dune
  if (result.rows && result.rows.length > 0) {
    console.log('🔍 Dune query 4341139 sample data structure:');
    console.log('📊 First row:', result.rows[0]);
    console.log('🏷️ Available columns:', Object.keys(result.rows[0]));
  }
  
  return result.rows as MarketOverviewRow[];
}