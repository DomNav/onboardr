'use client';

import { Bell } from 'lucide-react';
import { useTradeStore } from '@/store/trades';

export default function TradesButton() {
  const { unread, markRead, addTrade, trades } = useTradeStore();
  
  const handleClick = () => {
    // Add some demo trades if none exist
    if (trades.length === 0) {
      addTrade({
        summary: '100 XLM → USDC',
        status: 'completed',
        amount: '100',
        fromToken: 'XLM',
        toToken: 'USDC',
        txHash: '0xabc123...'
      });
      addTrade({
        summary: '50 USDC → XLM',
        status: 'pending',
        amount: '50',
        fromToken: 'USDC',
        toToken: 'XLM'
      });
      addTrade({
        summary: '25 XLM → BTC',
        status: 'executing',
        amount: '25',
        fromToken: 'XLM',
        toToken: 'BTC'
      });
    }
    
    markRead(); // This will open the drawer and clear unread count
  };

  return (
    <button 
      onClick={handleClick}
      className="relative flex items-center gap-1 rounded-full bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500 transition-colors duration-200"
    >
      <Bell className="size-4" />
      Swaps
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}