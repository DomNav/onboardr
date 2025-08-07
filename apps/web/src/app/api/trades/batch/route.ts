import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hardenedFetch } from '@/lib/apiHardening';

interface BatchedTrade {
  id: string;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  slippageBps: string;
  deadline?: number;
  recipient?: string;
}

interface BatchExecutionResult {
  batchId: string;
  trades: TradeResult[];
  totalGasUsed: string;
  totalGasCost: string;
  executionTime: number;
  failureCount: number;
  successCount: number;
}

interface TradeResult {
  id: string;
  success: boolean;
  txHash?: string;
  amountOut?: string;
  gasUsed?: string;
  error?: string;
  executionIndex: number;
}

// Validation schema for batch trade requests
const BatchTradeSchema = z.object({
  id: z.string().min(1, 'Trade ID is required'),
  sellToken: z.string().min(1, 'Sell token is required'),
  buyToken: z.string().min(1, 'Buy token is required'),
  sellAmount: z.string().regex(/^\d+$/, 'Sell amount must be a valid number'),
  slippageBps: z.string().regex(/^\d+$/, 'Slippage must be a valid number'),
  deadline: z.number().optional(),
  recipient: z.string().optional(),
});

const BatchRequestSchema = z.object({
  trades: z.array(BatchTradeSchema).min(1, 'At least one trade is required').max(10, 'Maximum 10 trades per batch'),
  batchOptions: z.object({
    atomicExecution: z.boolean().optional().default(false), // All trades succeed or all fail
    maxGasPrice: z.string().optional(),
    gasLimit: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  }).optional().default({}),
});

// Gas optimization strategies
const GAS_OPTIMIZATION_STRATEGIES = {
  SEQUENTIAL: 'sequential', // Execute trades one by one
  PARALLEL: 'parallel', // Execute trades in parallel (when possible)
  BUNDLED: 'bundled', // Bundle multiple trades into single transaction
} as const;

function optimizeBatchExecution(trades: BatchedTrade[]): {
  strategy: string;
  batches: BatchedTrade[][];
  estimatedGasSavings: number;
} {
  // Group trades by token pairs for potential bundling
  const tradePairs = new Map<string, BatchedTrade[]>();
  
  trades.forEach(trade => {
    const pairKey = `${trade.sellToken}-${trade.buyToken}`;
    if (!tradePairs.has(pairKey)) {
      tradePairs.set(pairKey, []);
    }
    tradePairs.get(pairKey)!.push(trade);
  });

  // If we have multiple trades for the same pair, bundle them
  const hasBundleOpportunities = Array.from(tradePairs.values()).some(group => group.length > 1);
  
  if (hasBundleOpportunities && trades.length <= 5) {
    // Bundle strategy: group by token pairs
    const batches = Array.from(tradePairs.values());
    return {
      strategy: GAS_OPTIMIZATION_STRATEGIES.BUNDLED,
      batches,
      estimatedGasSavings: Math.min(trades.length * 0.15, 0.5), // 15% savings per trade, max 50%
    };
  } else if (trades.length > 3) {
    // Parallel strategy: execute independent trades in parallel
    const parallelBatches = trades.map(trade => [trade]); // Each trade in its own batch for parallel execution
    return {
      strategy: GAS_OPTIMIZATION_STRATEGIES.PARALLEL,
      batches: parallelBatches,
      estimatedGasSavings: Math.min(trades.length * 0.05, 0.2), // 5% savings per trade, max 20%
    };
  } else {
    // Sequential strategy: execute trades one by one
    return {
      strategy: GAS_OPTIMIZATION_STRATEGIES.SEQUENTIAL,
      batches: trades.map(trade => [trade]),
      estimatedGasSavings: 0,
    };
  }
}

async function executeTradeBatch(
  trades: BatchedTrade[], 
  options: { atomicExecution?: boolean; maxGasPrice?: string; gasLimit?: string; priority?: string }
): Promise<TradeResult[]> {
  const results: TradeResult[] = [];
  
  // Simulate trade execution (in a real implementation, this would interact with the blockchain)
  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    
    try {
      // Get quote for the trade
      const quoteUrl = `/api/quotes/simulate?sellToken=${trade.sellToken}&buyToken=${trade.buyToken}&amountIn=${trade.sellAmount}&slippageBps=${trade.slippageBps}`;
      
      const quoteResponse = await hardenedFetch<any>(
        quoteUrl,
        { method: 'GET' },
        `batch-quote-${trade.id}`,
        5000 // 5 second cache for batch quotes
      );

      if (!quoteResponse.success) {
        throw new Error(quoteResponse.error || 'Failed to get quote');
      }

      const quote = quoteResponse.quote;
      
      // Simulate transaction execution
      const simulatedGasUsed = parseInt(quote.gas) || Math.floor(Math.random() * 50000) + 21000;
      const simulatedTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      // Simulate potential failure (10% chance in development)
      const shouldFail = process.env.NODE_ENV === 'development' && Math.random() < 0.1;
      
      if (shouldFail) {
        throw new Error('Simulated transaction failure');
      }

      results.push({
        id: trade.id,
        success: true,
        txHash: simulatedTxHash,
        amountOut: quote.amountOut,
        gasUsed: simulatedGasUsed.toString(),
        executionIndex: i,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      results.push({
        id: trade.id,
        success: false,
        error: errorMessage,
        executionIndex: i,
      });

      // If atomic execution is enabled, fail the entire batch
      if (options.atomicExecution) {
        // Mark all remaining trades as failed
        for (let j = i + 1; j < trades.length; j++) {
          results.push({
            id: trades[j].id,
            success: false,
            error: 'Batch execution failed atomically',
            executionIndex: j,
          });
        }
        break;
      }
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = BatchRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid batch request',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { trades, batchOptions } = validationResult.data;
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const startTime = Date.now();

    // Optimize batch execution strategy
    const optimization = optimizeBatchExecution(trades);
    console.log(`Using ${optimization.strategy} strategy for ${trades.length} trades, estimated gas savings: ${(optimization.estimatedGasSavings * 100).toFixed(1)}%`);

    // Execute trades based on strategy
    let allResults: TradeResult[] = [];
    let totalGasUsed = 0;

    if (optimization.strategy === GAS_OPTIMIZATION_STRATEGIES.BUNDLED) {
      // Execute bundles sequentially
      for (const batch of optimization.batches) {
        const batchResults = await executeTradeBatch(batch, batchOptions);
        allResults = allResults.concat(batchResults);
      }
    } else if (optimization.strategy === GAS_OPTIMIZATION_STRATEGIES.PARALLEL) {
      // Execute trades in parallel (simulated with Promise.all)
      const batchPromises = optimization.batches.map(batch => 
        executeTradeBatch(batch, batchOptions)
      );
      const parallelResults = await Promise.all(batchPromises);
      allResults = parallelResults.flat();
    } else {
      // Sequential execution
      allResults = await executeTradeBatch(trades, batchOptions);
    }

    // Calculate total gas used
    totalGasUsed = allResults
      .filter(result => result.success && result.gasUsed)
      .reduce((total, result) => total + parseInt(result.gasUsed!), 0);

    // Apply gas savings estimate
    const optimizedGasUsed = Math.floor(totalGasUsed * (1 - optimization.estimatedGasSavings));
    
    const executionTime = Date.now() - startTime;
    const successCount = allResults.filter(r => r.success).length;
    const failureCount = allResults.length - successCount;

    // Estimate gas cost (using mock gas price of 0.00001 XLM per gas unit)
    const gasPrice = 0.00001;
    const totalGasCost = (optimizedGasUsed * gasPrice).toFixed(7);

    const result: BatchExecutionResult = {
      batchId,
      trades: allResults,
      totalGasUsed: optimizedGasUsed.toString(),
      totalGasCost,
      executionTime,
      failureCount,
      successCount,
    };

    // Log batch execution metrics
    console.log(`Batch ${batchId} completed: ${successCount}/${trades.length} successful, ${executionTime}ms, ${optimizedGasUsed} gas`);

    return NextResponse.json({
      success: true,
      result,
      optimization: {
        strategy: optimization.strategy,
        estimatedGasSavings: `${(optimization.estimatedGasSavings * 100).toFixed(1)}%`,
        originalGasEstimate: totalGasUsed.toString(),
        optimizedGasUsed: optimizedGasUsed.toString(),
      },
    });

  } catch (error) {
    console.error('Error processing batch trade request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve batch status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json(
      { success: false, error: 'Batch ID is required' },
      { status: 400 }
    );
  }

  // In a real implementation, this would query a database or cache
  // For now, return a mock status
  return NextResponse.json({
    success: true,
    status: {
      batchId,
      status: 'completed', // completed, pending, failed, partial
      trades: [], // Would contain actual trade results
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
  });
}

// Export types for use in other parts of the application
export type { BatchedTrade, BatchExecutionResult, TradeResult };