'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowUpDown, 
  TrendingDown, 
  TrendingUp, 
  Zap,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';
import { SwapDetails } from '@/store/transactions';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SwapDetailsCardProps {
  swapDetails: SwapDetails;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function SwapDetailsCard({ 
  swapDetails, 
  className, 
  showHeader = true, 
  compact = false 
}: SwapDetailsCardProps) {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    minAmountOut,
    maxAmountIn,
    rate,
    inverseRate,
    slippageTolerance,
    priceImpact,
    networkFee,
    tradingFee,
    pools,
    route
  } = swapDetails;

  const formatAmount = (amount: string, decimals = 6) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals 
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-600';
    if (impact < 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriceImpactIcon = (impact: number) => {
    if (impact < 1) return <TrendingDown className="h-3 w-3" />;
    if (impact < 3) return <RefreshCw className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Rate */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rate</span>
          <div className="flex items-center gap-1">
            <span className="font-mono">1 {tokenIn} ≈ {formatAmount(rate)} {tokenOut}</span>
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Slippage & Price Impact */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Slippage</span>
          <Badge variant="secondary" className="text-xs">
            {formatPercentage(slippageTolerance)}
          </Badge>
        </div>

        {/* Fees */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Est. Fees</span>
          <span className="font-mono">≈{formatAmount(networkFee)} XLM</span>
        </div>

        {/* Min Receive */}
        <div className="flex items-center justify-between text-sm border-t pt-2 font-medium">
          <span>Min. Receive</span>
          <span className="font-mono">{formatAmount(minAmountOut)} {tokenOut}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowUpDown className="h-5 w-5" />
            Swap Details
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {/* Exchange Rate */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Exchange rate</span>
            <span className="font-mono text-base">
              1 {tokenIn} = {formatAmount(rate)} {tokenOut}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p>1 {tokenOut} = {formatAmount(inverseRate)} {tokenIn}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Amounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You pay</span>
            <span className="font-mono font-semibold">
              {formatAmount(amountIn)} {tokenIn}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You receive (est.)</span>
            <span className="font-mono font-semibold">
              {formatAmount(amountOut)} {tokenOut}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Minimum received</span>
            <span className="font-mono text-red-600 font-medium">
              {formatAmount(minAmountOut)} {tokenOut}
            </span>
          </div>
        </div>

        <Separator />

        {/* Trading Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Price impact</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The impact your trade has on the market price</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className={cn("flex items-center gap-1", getPriceImpactColor(priceImpact))}>
              {getPriceImpactIcon(priceImpact)}
              <span className="font-mono text-sm">
                {formatPercentage(priceImpact)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Slippage tolerance</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum price change you're willing to accept</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatPercentage(slippageTolerance)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Network fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fee paid to Stellar network validators</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-mono text-sm">
              ≈{formatAmount(networkFee)} XLM
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Trading fee</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fee paid to liquidity providers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-mono text-sm">
              ≈{formatAmount(tradingFee)} {tokenIn}
            </span>
          </div>
        </div>

        {/* Route & Pools */}
        {pools.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Route & Pools</span>
              </div>
              
              <div className="flex items-center gap-2">
                {route.map((token, index) => (
                  <React.Fragment key={index}>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {token}
                    </Badge>
                    {index < route.length - 1 && (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground rotate-90" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="space-y-2">
                {pools.map((pool, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pool.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatPercentage(pool.fee)} fee
                      </Badge>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ExternalLink className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View pool details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Export a smaller version for use in lists
export function SwapDetailsBadge({ swapDetails }: { swapDetails: SwapDetails }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-mono">
        1 {swapDetails.tokenIn} = {parseFloat(swapDetails.rate).toFixed(4)} {swapDetails.tokenOut}
      </span>
      <Badge variant="outline" className="text-xs">
        {swapDetails.slippageTolerance.toFixed(2)}% slippage
      </Badge>
    </div>
  );
}
