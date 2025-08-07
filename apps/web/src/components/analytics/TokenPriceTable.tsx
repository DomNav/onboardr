'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TokenPrice } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { formatLargeNumber } from '@/lib/formatters';

// Chart data validation helper
function validateChartData(data: TokenPrice[]): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every(token => 
    typeof token.symbol === 'string' &&
    typeof token.name === 'string' &&
    typeof token.price === 'number' &&
    typeof token.change24h === 'number' &&
    typeof token.change7d === 'number' &&
    typeof token.volume24h === 'number' &&
    typeof token.marketCap === 'number'
  );
}

type SortField = 'symbol' | 'price' | 'change24h' | 'change7d' | 'volume24h' | 'marketCap';
type SortDirection = 'asc' | 'desc';

interface TokenPriceTableProps {
  data: TokenPrice[];
  className?: string;
}

export const TokenPriceTable: React.FC<TokenPriceTableProps> = ({ 
  data, 
  className 
}) => {
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedData = useMemo(() => {
    // Validate data before processing
    if (!validateChartData(data)) {
      return [];
    }

    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'symbol') {
        aValue = (aValue as string).toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [data, sortField, sortDirection]);

  // Validate data before rendering
  if (!validateChartData(data)) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="text-muted-foreground">
          Invalid token price data format
        </div>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ 
    field, 
    children 
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
      aria-label={`Sort by ${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'desc' 
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronUp className="h-4 w-4" />
        )}
      </div>
    </Button>
  );

  const formatPrice = (price: number): string => {
    return price < 0.01 
      ? `$${price.toFixed(6)}` 
      : `$${price.toFixed(2)}`;
  };

  const formatPercentage = (change: number): { text: string; color: string } => {
    const isPositive = change >= 0;
    return {
      text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
      color: isPositive 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    };
  };

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="symbol">Token</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="price">Price</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="change24h">24h Change</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="change7d">7d Change</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="volume24h">Volume (24h)</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((token) => {
            const change24h = formatPercentage(token.change24h);
            const change7d = formatPercentage(token.change7d);
            
            return (
              <TableRow key={token.symbol} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {token.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-right font-mono">
                  {formatPrice(token.price)}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className={cn("flex items-center justify-end gap-1", change24h.color)}>
                    {token.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-mono text-sm">
                      {change24h.text}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className={cn("flex items-center justify-end gap-1", change7d.color)}>
                    {token.change7d >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-mono text-sm">
                      {change7d.text}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="text-right font-mono text-sm">
                  ${formatLargeNumber(token.volume24h)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};