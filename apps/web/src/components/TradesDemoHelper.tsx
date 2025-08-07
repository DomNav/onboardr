'use client';

import { useEffect } from 'react';
import { useTradeStore } from '@/store/trades';

/**
 * Demo helper component that adds sample trades for testing.
 * Remove this in production.
 */
export default function TradesDemoHelper() {
  const { addTrade } = useTradeStore();

  useEffect(() => {
    // Add sample trades only in development
    if (process.env.NODE_ENV === 'development') {
      const sampleTrades = [
        {
          summary: '100 XLM → USDC',
          status: 'completed' as const,
          amount: '100',
          fromToken: 'XLM',
          toToken: 'USDC'
        },
        {
          summary: '50 USDC → AQUA',
          status: 'pending' as const,
          amount: '50',
          fromToken: 'USDC', 
          toToken: 'AQUA'
        },
        {
          summary: '200 AQUA → XLM',
          status: 'executing' as const,
          amount: '200',
          fromToken: 'AQUA',
          toToken: 'XLM'
        }
      ];

      // Add them with a slight delay to simulate real usage
      const timer = setTimeout(() => {
        sampleTrades.forEach((trade, index) => {
          setTimeout(() => addTrade(trade), index * 500);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
    
    // Return undefined for non-development environments
    return undefined;
  }, [addTrade]);

  return null;
}