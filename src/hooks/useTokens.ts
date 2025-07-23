import { useState, useEffect } from 'react';
import { Token, mockTokens, getWatchlistFromStorage, saveWatchlistToStorage } from '@/utils/tokenData';

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [watchedTokens, setWatchedTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const storedWatchlist = getWatchlistFromStorage();
    setWatchedTokens(storedWatchlist);
  }, []);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prevTokens => 
        prevTokens.map(token => {
          // Simulate small price movements
          const volatility = token.tokenType === 'Stablecoin' ? 0.0001 : 0.02;
          const change = (Math.random() - 0.5) * volatility * token.price;
          const newPrice = Math.max(0.0001, token.price + change);
          const newChange24h = newPrice - token.price;
          const newChangePercent24h = (newChange24h / token.price) * 100;
          
          return {
            ...token,
            price: newPrice,
            change24h: newChange24h,
            changePercent24h: newChangePercent24h,
            lastUpdated: new Date()
          };
        })
      );
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleWatchToken = (symbol: string) => {
    const newWatchlist = watchedTokens.includes(symbol)
      ? watchedTokens.filter(s => s !== symbol)
      : [...watchedTokens, symbol];
    
    setWatchedTokens(newWatchlist);
    saveWatchlistToStorage(newWatchlist);
  };

  const getWatchedTokens = () => {
    return tokens.filter(token => watchedTokens.includes(token.symbol));
  };

  const filterTokensByType = (type: Token['tokenType'] | 'All') => {
    if (type === 'All') return tokens;
    return tokens.filter(token => token.tokenType === type);
  };

  const filterTokensByPlatform = (platform: Token['platform'] | 'All') => {
    if (platform === 'All') return tokens;
    return tokens.filter(token => token.platform === platform);
  };

  const searchTokens = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(lowercaseQuery) ||
      token.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    tokens,
    watchedTokens,
    isLoading,
    toggleWatchToken,
    getWatchedTokens,
    filterTokensByType,
    filterTokensByPlatform,
    searchTokens
  };
} 