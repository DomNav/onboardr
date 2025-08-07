'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransactionType = 'swap' | 'mint' | 'deposit' | 'withdraw' | 'transfer';
export type TransactionStatus = 'signing' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed' | 'cancelled';

export interface SwapDetails {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  minAmountOut: string;
  maxAmountIn: string;
  rate: string;
  inverseRate: string;
  slippageTolerance: number;
  priceImpact: number;
  networkFee: string;
  tradingFee: string;
  pools: Array<{
    address: string;
    name: string;
    fee: number;
  }>;
  route: string[];
}

export interface Transaction {
  id: string;
  hash?: string;
  type: TransactionType;
  status: TransactionStatus;
  summary: string;
  timestamp: number;
  details?: {
    from?: string;
    to?: string;
    amount?: string;
    token?: string;
    estimatedFee?: string;
    operations?: number;
    swap?: SwapDetails;
  };
  error?: string;
  explorerUrl?: string;
}

interface TransactionState {
  transactions: Transaction[];
  isDrawerOpen: boolean;
  activeTransactions: number;
  
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
  setDrawerOpen: (open: boolean) => void;
  
  // Getters
  getTransaction: (id: string) => Transaction | undefined;
  getActiveTransactions: () => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
  hasActiveTransactions: () => boolean;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isDrawerOpen: false,
      activeTransactions: 0,
      
      addTransaction: (tx) => {
        const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTx: Transaction = {
          ...tx,
          id,
          timestamp: Date.now(),
        };
        
        set((state) => {
          const isActive = ['signing', 'broadcasting', 'confirming'].includes(newTx.status);
          return {
            transactions: [newTx, ...state.transactions].slice(0, 100), // Keep last 100
            activeTransactions: isActive 
              ? state.activeTransactions + 1 
              : state.activeTransactions,
            // Auto-open drawer for new transactions
            isDrawerOpen: true,
          };
        });
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('newTransaction', { 
          detail: newTx 
        }));
        
        return id;
      },
      
      updateTransaction: (id, updates) => {
        set((state) => {
          const oldTx = state.transactions.find(t => t.id === id);
          const newTransactions = state.transactions.map(tx => 
            tx.id === id ? { ...tx, ...updates } : tx
          );
          
          // Update active count if status changed
          let activeCountChange = 0;
          if (oldTx) {
            const wasActive = ['signing', 'broadcasting', 'confirming'].includes(oldTx.status);
            const isActive = updates.status && ['signing', 'broadcasting', 'confirming'].includes(updates.status);
            const isCompleted = updates.status && ['confirmed', 'failed', 'cancelled'].includes(updates.status);
            
            if (wasActive && isCompleted) {
              activeCountChange = -1;
            } else if (!wasActive && isActive) {
              activeCountChange = 1;
            }
          }
          
          // Generate explorer URL if hash is provided
          if (updates.hash && !updates.explorerUrl) {
            updates.explorerUrl = `https://stellar.expert/explorer/testnet/tx/${updates.hash}`;
          }
          
          return {
            transactions: newTransactions,
            activeTransactions: Math.max(0, state.activeTransactions + activeCountChange),
          };
        });
        
        // Emit status change event
        if (updates.status) {
          window.dispatchEvent(new CustomEvent('transactionStatusChange', { 
            detail: { id, status: updates.status } 
          }));
        }
      },
      
      removeTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find(t => t.id === id);
          const isActive = tx && ['signing', 'broadcasting', 'confirming'].includes(tx.status);
          
          return {
            transactions: state.transactions.filter(t => t.id !== id),
            activeTransactions: isActive 
              ? Math.max(0, state.activeTransactions - 1)
              : state.activeTransactions,
          };
        });
      },
      
      clearTransactions: () => {
        set({ 
          transactions: [], 
          activeTransactions: 0,
          isDrawerOpen: false,
        });
      },
      
      setDrawerOpen: (open) => {
        set({ isDrawerOpen: open });
      },
      
      getTransaction: (id) => {
        return get().transactions.find(t => t.id === id);
      },
      
      getActiveTransactions: () => {
        return get().transactions.filter(t => 
          ['signing', 'broadcasting', 'confirming'].includes(t.status)
        );
      },
      
      getRecentTransactions: (limit = 10) => {
        return get().transactions.slice(0, limit);
      },
      
      hasActiveTransactions: () => {
        return get().activeTransactions > 0;
      },
    }),
    {
      name: 'transaction-storage',
      // Only persist completed transactions, not active ones
      partialize: (state) => ({ 
        transactions: state.transactions.filter(t => 
          ['confirmed', 'failed', 'cancelled'].includes(t.status)
        ).slice(0, 50) // Keep last 50 completed
      }),
    }
  )
);

// Helper hook for monitoring transaction status
export function useTransactionMonitor(txId?: string) {
  const { getTransaction, updateTransaction } = useTransactionStore();
  
  const monitorTransaction = async (id: string, hash: string) => {
    // Simulate monitoring (in real app, this would poll the blockchain)
    const stages: TransactionStatus[] = ['broadcasting', 'confirming', 'confirmed'];
    
    for (const status of stages) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s per stage
      updateTransaction(id, { status, hash });
      
      if (status === 'confirmed') {
        // Play success sound if available
        try {
          const audio = new Audio('/sounds/success.mp3');
          audio.play().catch(() => {}); // Ignore audio errors
        } catch {}
      }
    }
  };
  
  return { monitorTransaction };
}

// Helper to get status color and icon
export function getTransactionStatusInfo(status: TransactionStatus) {
  const statusInfo = {
    signing: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: '✍️',
      label: 'Signing',
      animated: true,
    },
    broadcasting: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: '📡',
      label: 'Broadcasting',
      animated: true,
    },
    confirming: {
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      icon: '⏳',
      label: 'Confirming',
      animated: true,
    },
    confirmed: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: '✅',
      label: 'Confirmed',
      animated: false,
    },
    failed: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: '❌',
      label: 'Failed',
      animated: false,
    },
    cancelled: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      icon: '🚫',
      label: 'Cancelled',
      animated: false,
    },
  };
  
  return statusInfo[status];
}