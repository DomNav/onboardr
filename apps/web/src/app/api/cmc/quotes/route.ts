import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cmcFetch } from '@/lib/cmcClient';

const quotesSchema = z.object({
  ids: z.string().min(1, 'ids parameter is required'),
  convert: z.string().optional().default('USD'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = quotesSchema.parse({
      ids: searchParams.get('ids'),
      convert: searchParams.get('convert'),
    });

    const response = await cmcFetch<any>(
      '/v1/cryptocurrency/quotes/latest',
      {
        id: params.ids,
        convert: params.convert,
      },
      30 // 30 second cache
    );

    // Transform response to our simplified format
    const transformed: Record<string, any> = {};
    
    if (response.data) {
      Object.values(response.data).forEach((coin: any) => {
        const quote = coin.quote[params.convert];
        transformed[coin.id] = {
          id: coin.id,
          symbol: coin.symbol,
          price: quote.price,
          percentChange24h: quote.percent_change_24h,
          marketCap: quote.market_cap,
          volume24h: quote.volume_24h,
          lastUpdated: quote.last_updated,
        };
      });
    }

    const responseObj = NextResponse.json(transformed);
    
    // Set cache headers
    responseObj.headers.set(
      'Cache-Control', 
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return responseObj;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Invalid parameters',
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    console.error('CMC quotes API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to fetch quotes from CoinMarketCap' 
      },
      { status: 502 }
    );
  }
}