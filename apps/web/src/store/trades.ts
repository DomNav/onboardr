'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

// ------------------------------
// 1️⃣ Types & Interfaces
// ------------------------------
export type TradeStatus = 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';

export interface Trade {
  id: string;
  createdAt: string; // ISO timestamp
  summary: string;   // "100 XLM → USDC"
  txHash?: string;
  status: TradeStatus;
  amount?: string;   // Original amount for sorting/filtering
  fromToken?: string;
  toToken?: string;
}

interface TradeState {
  trades: Trade[];
  unread: number;
  isOpen: boolean;

  // Actions
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  updateStatus: (id: string, status: TradeStatus, txHash?: string) => void;
  markRead: () => void;
  setOpen: (open: boolean) => void;
  clearTrades: () => void;
  
  // Computed getters
  getPendingTrades: () => Trade[];
  getExecutingTrades: () => Trade[];
  getCompletedTrades: () => Trade[];
  getCancelledTrades: () => Trade[];
  getFailedTrades: () => Trade[];
}

// ------------------------------
// 2️⃣ Zustand Store with Persistence
// ------------------------------
export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      trades: [],
      unread: 0,
      isOpen: false,

      addTrade: (trade) => {
        const newTrade: Trade = {
          ...trade,
          id: trade.id || uuid(),
          createdAt: trade.createdAt || new Date().toISOString(),
        };
        
        set((state) => ({ 
          trades: [newTrade, ...state.trades], // Newest first
          unread: state.unread + 1,
        }));
      },

      updateStatus: (id, status, txHash) => {
        set((state) => ({
          trades: state.trades.map(trade => 
            trade.id === id 
              ? { ...trade, status, ...(txHash && { txHash }) }
              : trade
          ),
          // Increment unread for status changes
          unread: state.unread + 1,
        }));
      },

      markRead: () => {
        set({ unread: 0, isOpen: true });
      },

      setOpen: (open) => {
        set({ isOpen: open });
        if (open) {
          set({ unread: 0 }); // Clear unread when opening
        }
      },

      clearTrades: () => {
        set({ trades: [], unread: 0 });
      },

      // Computed getters
      getPendingTrades: () => get().trades.filter(t => t.status === 'pending'),
      getExecutingTrades: () => get().trades.filter(t => t.status === 'executing'),
      getCompletedTrades: () => get().trades.filter(t => t.status === 'completed'),
      getCancelledTrades: () => get().trades.filter(t => t.status === 'cancelled'),
      getFailedTrades: () => get().trades.filter(t => t.status === 'failed'),
    }),
    {
      name: 'trades-storage',
      // Persist trades and unread count
      partialize: (state) => ({ 
        trades: state.trades,
        unread: state.unread,
      })
    }
  )
);