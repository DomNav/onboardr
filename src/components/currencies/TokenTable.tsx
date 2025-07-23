import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Token, formatPrice, formatPercentage, formatCurrency, getTokenTypeColor } from '@/utils/tokenData';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { cn } from '@/lib/utils';

interface TokenTableProps {
  tokens: Token[];
  className?: string;
}

export function TokenTable({ tokens, className }: TokenTableProps) {
  const { isTokenWatched, toggleWatchlistToken } = useWatchlistStore();
  return (
    <div className={cn("rounded-md border", className)}>
      {/* Table Header */}
      <div className="grid grid-cols-9 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
        <div className="w-12"></div>
        <div>Token</div>
        <div className="text-right">Price</div>
        <div className="text-right">24h Change</div>
        <div className="text-right">Market Cap</div>
        <div className="text-right">Volume (24h)</div>
        <div>Type</div>
        <div>Platform</div>
        <div className="text-right">Last Updated</div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y">
        {tokens.map((token) => {
          const isWatched = isTokenWatched(token.symbol);
          const isPositive = token.changePercent24h >= 0;
          
          return (
            <div key={token.symbol} className="grid grid-cols-9 gap-4 p-4 hover:bg-muted/50 transition-colors">
              <div>
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
                            "h-4 w-4 transition-colors",
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
              
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{token.symbol}</div>
                  {isWatched && (
                    <Badge variant="star" className="px-1.5 py-0.5">
                      ★
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{token.name}</div>
              </div>
              
              <div className="text-right">
                <div className="font-medium">{formatPrice(token.price)}</div>
              </div>
              
              <div className="text-right">
                <div className={cn(
                  "flex items-center justify-end font-medium",
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
                <div className="font-medium">{formatCurrency(token.marketCap)}</div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{formatCurrency(token.volume24h)}</div>
              </div>
              
              <div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getTokenTypeColor(token.tokenType))}
                >
                  {token.tokenType}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm">
                  {token.platform === 'Both' ? (
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">Soroswap</Badge>
                      <Badge variant="secondary" className="text-xs">DeFindex</Badge>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{token.platform}</Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {token.lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 