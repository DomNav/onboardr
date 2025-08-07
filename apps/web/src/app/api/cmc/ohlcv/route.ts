import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cmcFetch } from '@/lib/cmcClient';

const ohlcvSchema = z.object({
  id: z.string().min(1, 'id parameter is required'),
  interval: z.enum(['daily', '1d', '7d', '30d']).optional().default('daily'),
  range: z.string().optional().default('30d'),
  convert: z.string().optional().default('USD'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = ohlcvSchema.parse({
      id: searchParams.get('id'),
      interval: searchParams.get('interval'),
      range: searchParams.get('range'),
      convert: searchParams.get('convert'),
    });

    // Calculate count based on range
    let count = '30';
    if (params.range === '7d') count = '7';
    else if (params.range === '30d') count = '30';
    else if (params.range === '90d') count = '90';

    const response = await cmcFetch<any>(
      '/v1/cryptocurrency/ohlcv/historical',
      {
        id: params.id,
        time_period: params.interval,
        count,
        convert: params.convert,
      },
      300 // 5 minute cache for OHLCV data
    );

    // Transform response to simplified format
    const candles = [];
    
    if (response.data && response.data.quotes) {
      for (const quote of response.data.quotes) {
        const ohlcv = quote.quote[params.convert];
        candles.push({
          timeOpen: quote.time_open,
          timeClose: quote.time_close,
          open: ohlcv.open,
          high: ohlcv.high,
          low: ohlcv.low,
          close: ohlcv.close,
          volume: ohlcv.volume,
        });
      }
    }

    const responseObj = NextResponse.json(candles);
    
    // Set cache headers - longer cache for historical data
    responseObj.headers.set(
      'Cache-Control', 
      'public, s-maxage=300, stale-while-revalidate=600'
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

    console.error('CMC OHLCV API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to fetch OHLCV data from CoinMarketCap' 
      },
      { status: 502 }
    );
  }
}