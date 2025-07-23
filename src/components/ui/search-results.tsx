import React from 'react';
import { Search, TrendingUp, TrendingDown, DollarSign, Percent, Coins } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchResult } from '../../hooks/useSearch';
import { formatCurrency, formatPrice, formatPercentage } from '../../utils/tokenData';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  onResultClick: (result: SearchResult) => void;
  className?: string;
}

export function SearchResults({ 
  results, 
  isLoading, 
  isOpen, 
  onResultClick, 
  className 
}: SearchResultsProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'token':
        return <DollarSign className="h-4 w-4" />;
      case 'pool':
        return <Coins className="h-4 w-4" />;
      case 'protocol':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'token':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'pool':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'protocol':
        return 'text-white bg-white/10 border-white/20';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change >= 0 ? (
      <TrendingUp className="h-3 w-3 text-green-600" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-600" />
    );
  };

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-50 max-h-96 overflow-hidden",
      className
    )}>
      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          Searching...
        </div>
      ) : results.length > 0 ? (
        <div className="max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => onResultClick(result)}
              className="w-full p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 text-left"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                  getTypeColor(result.type)
                )}>
                  {getTypeIcon(result.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{result.title}</span>
                    {result.change24h !== undefined && (
                      <div className="flex items-center gap-1">
                        {getChangeIcon(result.change24h)}
                        <span className={cn(
                          "text-xs",
                          result.change24h >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercentage(result.change24h)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-1">{result.subtitle}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {result.price !== undefined && (
                      <span>{formatPrice(result.price)}</span>
                    )}
                    {result.tvl !== undefined && (
                      <span>TVL: {formatCurrency(result.tvl)}</span>
                    )}
                    {result.apr !== undefined && (
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {(result.apr * 100).toFixed(2)}%
                      </span>
                    )}
                    {result.platform && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {result.platform}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results found</p>
          <p className="text-xs">Try searching for tokens, pools, or protocols</p>
        </div>
      )}
    </div>
  );
} 