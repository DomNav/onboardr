import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hardenedFetch } from '@/lib/apiHardening';

interface Quote {
  amountOut: string;
  route: string[];
  gas: string;
  priceImpact?: string;
  isMultiHop?: boolean;
  routeBreakdown?: RouteHop[];
}

interface RouteHop {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  exchange: string;
  poolAddress?: string;
  fee?: string;
}

// Zod schema for exhaustive query parameter validation
const QuoteParamsSchema = z.object({
  sellToken: z.string().min(1, 'sellToken is required'),
  buyToken: z.string().min(1, 'buyToken is required'),
  amountIn: z.string().min(1, 'amountIn is required').regex(/^\d+$/, 'amountIn must be a valid number'),
  slippageBps: z.string().optional().refine(
    (val) => !val || /^\d+$/.test(val),
    'slippageBps must be a valid number'
  ).transform((val) => val || '50'), // Default 0.5% slippage
  enableMultiHop: z.string().nullish().transform((val) => val === 'true'),
  maxHops: z.string().nullish().refine(
    (val) => !val || (/^\d+$/.test(val) && parseInt(val) <= 5),
    'maxHops must be a number between 1 and 5'
  ).transform((val) => val ? parseInt(val) : 3), // Default max 3 hops
});

const SOROSWAP_ROUTER_BASE_URL = process.env.SOROSWAP_ROUTER_URL || 'https://api.soroswap.finance';

async function fetchSoroswapQuote(params: {
  sellToken: string;
  buyToken: string;
  amountIn: string;
  slippageBps: string;
  enableMultiHop?: boolean;
  maxHops?: number;
}): Promise<Quote> {
  const { sellToken, buyToken, amountIn, slippageBps, enableMultiHop = true, maxHops = 3 } = params;
  
  const queryParams = new URLSearchParams({
    sellToken,
    buyToken,
    sellAmount: amountIn,
    slippagePercentage: (parseInt(slippageBps) / 100).toString(), // Convert bps to percentage
    enableMultiHop: enableMultiHop.toString(),
    maxHops: maxHops.toString(),
  });

  const url = `${SOROSWAP_ROUTER_BASE_URL}/quote?${queryParams}`;
  const cacheKey = `quote-${sellToken}-${buyToken}-${amountIn}-${slippageBps}-${enableMultiHop}-${maxHops}`;

  const data = await hardenedFetch<any>(
    url,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
    cacheKey,
    10000 // 10 second cache TTL for quotes
  );
  
  // Validate and transform the response from Soroswap Router
  if (!data.buyAmount) {
    throw new Error('Invalid response from Soroswap Router: missing buyAmount');
  }

  // Parse route breakdown for multi-hop trades
  const routeBreakdown: RouteHop[] = [];
  if (data.route && Array.isArray(data.route)) {
    for (let i = 0; i < data.route.length; i++) {
      const hop = data.route[i];
      routeBreakdown.push({
        tokenIn: hop.tokenIn || (i === 0 ? sellToken : data.route[i-1].tokenOut),
        tokenOut: hop.tokenOut || (i === data.route.length - 1 ? buyToken : data.route[i+1].tokenIn),
        amountIn: hop.amountIn?.toString() || '0',
        amountOut: hop.amountOut?.toString() || '0',
        exchange: hop.exchange || hop.dex || 'Unknown',
        poolAddress: hop.poolAddress,
        fee: hop.fee?.toString(),
      });
    }
  }

  const isMultiHop = routeBreakdown.length > 1 || (data.route && data.route.length > 1);

  return {
    amountOut: data.buyAmount.toString(),
    route: data.sources?.map((source: any) => source.name) || 
           routeBreakdown.map(hop => hop.exchange) || 
           [sellToken, buyToken],
    gas: data.estimatedGas?.toString() || '0',
    priceImpact: data.priceImpact?.toString(),
    isMultiHop,
    routeBreakdown: routeBreakdown.length > 0 ? routeBreakdown : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const rawParams = {
      sellToken: searchParams.get('sellToken'),
      buyToken: searchParams.get('buyToken'),
      amountIn: searchParams.get('amountIn'),
      slippageBps: searchParams.get('slippageBps'),
      enableMultiHop: searchParams.get('enableMultiHop'),
      maxHops: searchParams.get('maxHops'),
    };

    // Validate query parameters with Zod
    const validationResult = QuoteParamsSchema.safeParse(rawParams);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const validatedParams = validationResult.data;

    // Fetch quote from Soroswap Router
    try {
      const quote = await fetchSoroswapQuote(validatedParams);
      
      return NextResponse.json({
        success: true,
        quote,
      });
    } catch (routerError) {
      console.error('Soroswap Router error:', routerError);
      
      // Propagate router errors with 502 status
      return NextResponse.json(
        { 
          success: false, 
          error: 'Router service unavailable',
          details: routerError instanceof Error ? routerError.message : 'Unknown router error'
        },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Error processing quote request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Keep POST for backward compatibility, but redirect to GET
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromToken, toToken, amount, slippage } = body;

    // Convert POST body to query parameters and redirect to GET
    const queryParams = new URLSearchParams({
      sellToken: fromToken || '',
      buyToken: toToken || '',
      amountIn: amount?.toString() || '',
      slippageBps: slippage?.toString() || '50',
    });

    // Create a new request URL with query parameters
    const baseUrl = new URL(request.url);
    baseUrl.search = queryParams.toString();

    // Create a new GET request
    const getRequest = new NextRequest(baseUrl, {
      method: 'GET',
      headers: request.headers,
    });

    return GET(getRequest);

  } catch (error) {
    console.error('Error processing POST quote request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}