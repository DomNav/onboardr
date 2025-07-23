import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, BarChart3Icon } from 'lucide-react';
import { Pool, formatCurrency, formatPercentage, formatNumber, formatDate } from '@/utils/mockPoolData';
import { Sparkline } from '@/components/stocks/Sparkline';
import { cn } from '@/lib/utils';

interface PoolCardProps {
  pool: Pool;
  className?: string;
  onClick?: () => void;
}

export function PoolCard({ pool, className, onClick }: PoolCardProps) {
  // Calculate if the pool is performing well (simple heuristic based on APR)
  const isHighPerforming = pool.apr > 0.1; // 10%+ APR is considered high performing
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md bg-card/50 backdrop-blur-sm",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold leading-none">{pool.symbol}</CardTitle>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{pool.name}</p>
        </div>
        <div className="flex items-center space-x-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            pool.type === 'soroswap' ? "bg-blue-500" : "bg-green-500"
          )} />
          <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-white">{formatPercentage(pool.apr)}</div>
            <div className="flex items-center text-xs">
              <span className={cn(
                "inline-flex items-center",
                isHighPerforming ? "text-success" : "text-muted-foreground"
              )}>
                {isHighPerforming ? 
                  <ArrowUpIcon className="h-3 w-3 mr-1" /> : 
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                }
                {isHighPerforming ? "High Yield" : "Standard"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-muted-foreground">TVL:</div>
              <div className="text-right">{formatCurrency(pool.tvl)}</div>
              <div className="text-muted-foreground">24h Vol:</div>
              <div className="text-right">{formatNumber(pool.volume)}</div>
              <div className="text-muted-foreground">24h Change:</div>
              <div className={cn(
                "text-right",
                pool.change24h >= 0 ? "text-success" : "text-danger"
              )}>
                {pool.change24h >= 0 ? '+' : ''}{pool.change24h.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Updated:</div>
              <div className="text-right">{formatDate(pool.lastUpdated)}</div>
            </div>
          </div>
          <div className="h-24">
            {pool.priceHistory && pool.priceHistory.length > 0 && (
              <Sparkline 
                data={pool.priceHistory} 
                color={isHighPerforming ? 'rgb(var(--success))' : 'rgb(var(--primary))'}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 