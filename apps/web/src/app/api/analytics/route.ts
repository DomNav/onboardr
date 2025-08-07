import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DashboardData, DashboardApiResponse, TimeFrame } from '@/types/analytics';

// Environment validation (Security & Environment rule)
function validateEnvironment() {
  const requiredEnvVars = ['OPENAI_API_KEY', 'NODE_ENV'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', { missing, contextId: 'analytics-api' });
    return false;
  }
  
  return true;
}

// Validation schema
const querySchema = z.object({
  tf: z.enum(['24h', '7d', '30d']).default('24h'),
});

// Rate limiting - simple in-memory store (production should use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Mock data generators
function generateMockChart(timeFrame: TimeFrame, baseValue: number, volatility: number) {
  const points = timeFrame === '24h' ? 24 : timeFrame === '7d' ? 7 : 30;
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * volatility;
    const value = Math.max(0, baseValue + variation);
    
    let time: string;
    if (timeFrame === '24h') {
      time = `${String(i).padStart(2, '0')}:00`;
    } else if (timeFrame === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      time = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      time = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    data.push({ time, value });
  }
  
  return data;
}

function generateMockTokenPrices() {
  const tokens = [
    { symbol: 'XLM', name: 'Stellar Lumens' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'yXLM', name: 'Yield Stellar' },
    { symbol: 'AQUA', name: 'Aquarius' },
    { symbol: 'SRT', name: 'Soroban Token' },
  ];
  
  return tokens.map(token => ({
    ...token,
    price: Math.random() * 10 + 0.1,
    change24h: (Math.random() - 0.5) * 20,
    change7d: (Math.random() - 0.5) * 40,
    volume24h: Math.random() * 1000000,
    marketCap: Math.random() * 100000000,
  }));
}

function generateMockPairVolumes() {
  const pairs = [
    { pair: 'XLM/USDC', color: '#00d4ff' },
    { pair: 'yXLM/XLM', color: '#7c3aed' },
    { pair: 'AQUA/XLM', color: '#06b6d4' },
    { pair: 'SRT/USDC', color: '#f59e0b' },
    { pair: 'Others', color: '#6b7280' },
  ];
  
  const volumes = pairs.map(() => Math.random() * 100);
  const total = volumes.reduce((sum, vol) => sum + vol, 0);
  
  return pairs.map((pair, index) => ({
    ...pair,
    volume: volumes[index] * 1000000, // Scale to realistic numbers
    percentage: (volumes[index] / total) * 100,
  }));
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate environment at top of file (Security & Environment rule)
    if (!validateEnvironment()) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Server configuration error',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      // Never log sensitive data; use contextual id only
      console.warn('Rate limit exceeded', { contextId: 'analytics-api', timestamp: Date.now() });
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // Request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      // Validate query parameters
      const { searchParams } = new URL(request.url);
      const { tf } = querySchema.parse({
        tf: searchParams.get('tf'),
      });

      // Generate mock data (in production, this would fetch from database/external APIs)
      const dashboardData: DashboardData = {
        volumeChart: generateMockChart(tf, 50000, 20000),
        tvlChart: generateMockChart(tf, 2000000, 500000),
        feesChart: generateMockChart(tf, 1000, 300),
        tokenPrices: generateMockTokenPrices(),
        pairVolumes: generateMockPairVolumes(),
        lastUpdated: new Date().toISOString(),
      };

      clearTimeout(timeoutId);

      const response: DashboardApiResponse = {
        status: 'success',
        data: dashboardData,
      };

      const responseObj = NextResponse.json(response);
      
      // Cache headers
      responseObj.headers.set(
        'Cache-Control',
        'public, s-maxage=30, stale-while-revalidate=60'
      );

      // Performance monitoring
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn('Slow analytics API response', { 
          duration, 
          timeframe: tf, 
          contextId: 'analytics-api-performance' 
        });
      }

      return responseObj;

    } catch (processingError) {
      clearTimeout(timeoutId);
      throw processingError;
    }

  } catch (error) {
    // Never log sensitive data; use contextual id only
    console.error('Analytics API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      contextId: 'analytics-api-error'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid parameters',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Request timeout',
          code: 'TIMEOUT'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}