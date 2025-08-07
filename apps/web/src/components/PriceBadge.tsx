'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
// Note: Tooltip component not available, using title attribute for now
import { formatPrice } from '@/lib/formatPrice';

interface PriceBadgeProps {
  tokenSymbol: string;
  showPrice?: boolean;
  showChange?: boolean;
  showMarketCap?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceBadge({ 
  tokenSymbol, 
  showPrice = true, 
  showChange = true, 
  showMarketCap = false,
  size = 'md',
  className = ''
}: PriceBadgeProps) {
  const { getCMCPrice, getPercentChange24h, getMarketCap, currency } = useCurrency();

  const price = getCMCPrice(tokenSymbol);
  const percentChange24h = getPercentChange24h(tokenSymbol);
  const marketCap = getMarketCap(tokenSymbol);

  // Don't render if no price data available
  if (!price && !percentChange24h && !marketCap) {
    return null;
  }

  const isPositive = percentChange24h && percentChange24h > 0;
  const isNegative = percentChange24h && percentChange24h < 0;
  const isNeutral = percentChange24h === 0;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const ChangeIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const changeColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';

  const badgeContent = (
    <div className={`flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}>
      {showPrice && price && (
        <span className="font-mono font-medium">
          {formatPrice(price, currency)}
        </span>
      )}
      
      {showChange && percentChange24h !== null && percentChange24h !== undefined && (
        <div className={`flex items-center gap-0.5 ${changeColor}`}>
          <ChangeIcon className={iconSize[size]} />
          <span className="font-mono">
            {Math.abs(percentChange24h).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );

  if (showMarketCap && marketCap) {
    const tooltipText = `${tokenSymbol} Market Data\n` +
      `Price: ${price ? formatPrice(price, currency) : 'N/A'}\n` +
      `24h Change: ${percentChange24h !== null && percentChange24h !== undefined ? (percentChange24h > 0 ? '+' : '') + percentChange24h.toFixed(2) + '%' : 'N/A'}\n` +
      `Market Cap: ${currency.symbol}${(marketCap / 1000000000).toFixed(1)}B`;
    
    return (
      <Badge 
        variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
        className="cursor-help"
        title={tooltipText}
      >
        {badgeContent}
      </Badge>
    );
  }

  return (
    <Badge variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}>
      {badgeContent}
    </Badge>
  );
}