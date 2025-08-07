'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Currency, DEFAULT_CURRENCY, findCurrencyByCode } from '@/lib/currencies';
import { CMCQuoteResponse } from '@/types/cmc';
import { useCMCQuotes } from '@/hooks/useCMCQuotes';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
  cmcPrices: CMCQuoteResponse;
  getCMCPrice: (tokenSymbol: string) => number | null;
  getPercentChange24h: (tokenSymbol: string) => number | null;
  getMarketCap: (tokenSymbol: string) => number | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Popular tokens to fetch prices for
  const popularTokens = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'XLM', 'USDC', 'USDT'];
  
  // Fetch CMC prices for popular tokens
  const { 
    data: cmcPrices = {}, 
    isLoading: cmcLoading 
  } = useCMCQuotes(popularTokens, currency.code, {
    refreshInterval: 30000, // 30 seconds
    fallbackToContext: true,
  });

  // Load currency preference from localStorage on mount
  useEffect(() => {
    try {
      const savedCurrencyCode = localStorage.getItem('preferred-currency');
      if (savedCurrencyCode) {
        const savedCurrency = findCurrencyByCode(savedCurrencyCode);
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
        }
      }
    } catch (error) {
      console.warn('Failed to load currency preference from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('preferred-currency', newCurrency.code);
    } catch (error) {
      console.warn('Failed to save currency preference to localStorage:', error);
    }
  };

  // Helper functions to get CMC data by token symbol
  const getCMCPrice = (tokenSymbol: string): number | null => {
    const quote = Object.values(cmcPrices).find(q => q.symbol === tokenSymbol.toUpperCase());
    return quote?.price || null;
  };

  const getPercentChange24h = (tokenSymbol: string): number | null => {
    const quote = Object.values(cmcPrices).find(q => q.symbol === tokenSymbol.toUpperCase());
    return quote?.percentChange24h || null;
  };

  const getMarketCap = (tokenSymbol: string): number | null => {
    const quote = Object.values(cmcPrices).find(q => q.symbol === tokenSymbol.toUpperCase());
    return quote?.marketCap || null;
  };

  const contextValue: CurrencyContextType = {
    currency,
    setCurrency,
    isLoading: isLoading || cmcLoading,
    cmcPrices,
    getCMCPrice,
    getPercentChange24h,
    getMarketCap,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 