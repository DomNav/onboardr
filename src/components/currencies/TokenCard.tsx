import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Token, formatPrice, formatPercentage, formatCurrency, getTokenTypeColor } from '@/utils/tokenData';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { cn } from '@/lib/utils';

interface TokenCardProps {
  token: Token;
  className?: string;
}

export function TokenCard({ token, className }: TokenCardProps) {
  const { isTokenWatched, toggleWatchlistToken } = useWatchlistStore();
  const isWatched = isTokenWatched(token.symbol);
  const isPositive = token.changePercent24h >= 0;
  
  return (
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{token.symbol}</h3>
              {isWatched && (
                <Badge variant="star" className="px-1.5 py-0.5">
                  ★
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn("text-xs px-2 py-0.5", getTokenTypeColor(token.tokenType))}
              >
                {token.tokenType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{token.name}</p>
            
            <div className="flex items-center gap-4 mb-3">
              <div>
                <div className="text-xl font-bold">{formatPrice(token.price)}</div>
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {formatPercentage(token.changePercent24h)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Market Cap</div>
                <div className="font-medium">{formatCurrency(token.marketCap)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated {token.lastUpdated.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Vol: {formatCurrency(token.volume24h)}</span>
              </div>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  onClick={() => toggleWatchlistToken(token.symbol)}
                >
                  <Star 
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isWatched 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground hover:text-yellow-400"
                    )} 
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Sparkline Chart */}
        {token.sparklineData && (
          <div className="mt-3 h-12 w-full">
            <SparklineChart data={token.sparklineData} isPositive={isPositive} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
}

function SparklineChart({ data, isPositive }: SparklineChartProps) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? 100 - ((value - min) / range) * 100 : 50;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <polyline
        fill="none"
        stroke={isPositive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
} 