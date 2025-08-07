'use client';

import { getTierDisplayInfo, useSubscriptionStore } from "@/store/subscription";
import { useTradeStore } from "@/store/trades";
import { useTransactionStore } from "@/store/transactions";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle, Crown, Lock, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { monitorTransactionWithToasts } from "../lib/transactionMonitor";
import type { FreighterApi } from "../types/freighter";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Spinner } from "./ui/spinner";
import UpgradeModal from "./UpgradeModal";

// ------------------------------
// 1️⃣ Types & Interfaces
// ------------------------------
export interface SwapRequest {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  expectedOutput?: number;
  minOutput?: number;
  rate?: number;
  slippage?: number;
  fee?: number;
  priceImpact?: number;
}

interface TradeQueueState {
  swaps: SwapRequest[];
  isExecuting: boolean;
  addSwap: (swap: Omit<SwapRequest, "id" | "timestamp" | "status">) => boolean;
  removeSwap: (id: string) => void;
  clearSwaps: () => void;
  setExecuting: (executing: boolean) => void;
  updateSwapStatus: (id: string, status: SwapRequest['status']) => void;
}

// ------------------------------
// 2️⃣ Zustand Store with Persistence
// ------------------------------
export const useTradeQueueStore = create<TradeQueueState>()(
  persist(
    (set, get) => ({
      swaps: [],
      isExecuting: false,
      
      addSwap: (swap) => {
        // Check tier limits
        const subscriptionStore = useSubscriptionStore.getState();
        const currentQueueSize = get().swaps.filter(s => s.status === 'pending').length;
        
        if (!subscriptionStore.canAddSwap(currentQueueSize)) {
          // Don't add the swap, let the UI handle showing upgrade modal
          return false;
        }
        
        const id = uuid(); // Generate single ID for both stores
        const newSwap: SwapRequest = {
          ...swap,
          id,
          timestamp: Date.now(),
          status: 'pending'
        };
        
        set((state) => ({ 
          swaps: [...state.swaps, newSwap] 
        }));
        
        // Also add to comprehensive trades store with same ID
        const tradesStore = useTradeStore.getState();
        tradesStore.addTrade({
          id, // Use same ID to keep them in sync
          summary: `${swap.amount} ${swap.from} → ${swap.to}`,
          status: 'pending',
          amount: swap.amount.toString(),
          fromToken: swap.from,
          toToken: swap.to,
          createdAt: new Date().toISOString()
        });
        
        toast.success(`Added ${swap.amount} ${swap.from} → ${swap.to} to queue`);
        return true;
      },
      
      removeSwap: (id) => {
        const swap = get().swaps.find(s => s.id === id);
        set((state) => ({ 
          swaps: state.swaps.filter((s) => s.id !== id) 
        }));
        
        if (swap) {
          toast.info(`Removed ${swap.amount} ${swap.from} → ${swap.to} from queue`);
        }
      },
      
      clearSwaps: () => set({ swaps: [] }),
      
      setExecuting: (executing) => set({ isExecuting: executing }),
      
      updateSwapStatus: (id, status) => {
        set((state) => ({
          swaps: state.swaps.map(swap => 
            swap.id === id ? { ...swap, status } : swap
          )
        }));
        
        // Also update in comprehensive trades store
        const tradesStore = useTradeStore.getState();
        tradesStore.updateStatus(id, status);
      }
    }),
    {
      name: 'trade-queue-storage',
      // Only persist the swaps, not the execution state
      partialize: (state) => ({ swaps: state.swaps })
    }
  )
);

// ------------------------------
// 3️⃣ Mock Authentication Dialog
// ------------------------------
const showMockAuthDialog = async (swaps: SwapRequest[]): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-4';
    
    modal.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold dark:text-white">Approve Transaction</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Demo Wallet Authentication</p>
          </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Details:</p>
          ${swaps.map(swap => `
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Swap:</span>
              <span class="font-mono dark:text-white">${swap.amount} ${swap.from} → ${swap.to}</span>
            </div>
          `).join('')}
          <div class="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="text-gray-600 dark:text-gray-400">Network Fee:</span>
            <span class="font-mono dark:text-white">0.00001 XLM</span>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button id="demo-reject" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Reject
          </button>
          <button id="demo-approve" class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105">
            Approve
          </button>
        </div>
        
        <p class="text-xs text-center text-gray-500 dark:text-gray-400">
          🎮 Demo Mode - No real transaction will be executed
        </p>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const approveBtn = modal.querySelector('#demo-approve');
    const rejectBtn = modal.querySelector('#demo-reject');
    
    const cleanup = () => {
      overlay.classList.add('animate-out', 'fade-out');
      modal.classList.add('slide-out-to-bottom-4');
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 200);
    };
    
    approveBtn?.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    rejectBtn?.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    // Allow escape key to reject
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
};

// ------------------------------
// 4️⃣ Execute Swaps Function
// ------------------------------
export const executeSwaps = async (swaps: SwapRequest[]) => {
  console.log('🔥 executeSwaps called with:', swaps);
  const { setExecuting, updateSwapStatus, clearSwaps } = useTradeQueueStore.getState();
  const { addTransaction, updateTransaction } = useTransactionStore.getState();
  
  // Check if we're in demo mode
  const isDemoMode = true; // Always demo mode for hackathon
  
  try {
    setExecuting(true);

    // Update all swaps to executing status
    swaps.forEach(swap => updateSwapStatus(swap.id, 'executing'));

    if (isDemoMode) {
      // Demo mode: Simulate successful swap execution
      console.log('🎮 Running in demo mode - simulating swap execution');
      
      // Add transactions to the transaction center
      const txIds = swaps.map(swap => {
        return addTransaction({
          type: 'swap',
          status: 'signing',
          summary: `Swap ${swap.amount} ${swap.from} → ${swap.to}`,
          details: {
            amount: swap.amount.toString(),
            token: swap.from,
            swap: {
              tokenIn: swap.from,
              tokenOut: swap.to,
              amountIn: swap.amount.toString(),
              amountOut: (parseFloat(swap.amount) * 0.95).toFixed(2), // Simulate 5% slippage
              minAmountOut: (parseFloat(swap.amount) * 0.9).toFixed(2),
              maxAmountIn: swap.amount.toString(),
              rate: '0.95',
              inverseRate: '1.05',
              slippageTolerance: 0.5,
              priceImpact: 0.02,
              networkFee: '0.00001',
              tradingFee: '0.003',
              pools: [{
                address: 'DEMO' + Math.random().toString(36).substr(2, 9),
                name: `${swap.from}/${swap.to} Pool`,
                fee: 0.3
              }],
              route: [swap.from, swap.to]
            },
            estimatedFee: '0.00001',
            operations: 3
          }
        });
      });
      
      // Show mock authentication dialog
      const confirmed = await showMockAuthDialog(swaps);
      
      if (!confirmed) {
        // User cancelled
        swaps.forEach(swap => updateSwapStatus(swap.id, 'failed'));
        txIds.forEach(id => updateTransaction(id, { 
          status: 'cancelled',
          error: 'Transaction cancelled by user' 
        }));
        toast.error('Transaction cancelled');
        return;
      }
      
      // Simulate signing phase
      toast.loading('Signing transaction...');
      txIds.forEach(id => updateTransaction(id, { status: 'signing' }));
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate broadcasting
      toast.loading('Broadcasting to network...');
      txIds.forEach(id => updateTransaction(id, { 
        status: 'broadcasting',
        hash: '0x' + Math.random().toString(16).substr(2, 64)
      }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate confirmation
      toast.loading('Waiting for confirmation...');
      txIds.forEach(id => updateTransaction(id, { status: 'confirming' }));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as completed
      swaps.forEach(swap => updateSwapStatus(swap.id, 'completed'));
      txIds.forEach(id => updateTransaction(id, { status: 'confirmed' }));
      
      toast.success(`✅ ${swaps.length} swap${swaps.length > 1 ? 's' : ''} completed successfully!`);
      
      // Clear completed swaps after a delay
      setTimeout(() => clearSwaps(), 3000);
      
      return;
    }

    // Original code for production (kept for reference)
    // Check if Freighter wallet is available
    if (!('freighterApi' in window)) {
      throw new Error('Freighter wallet not found. Please install Freighter extension.');
    }

    // Get user's public key from Freighter
    const freighterApi: FreighterApi = window.freighterApi;
    const publicKey = await freighterApi.getPublicKey();
    
    if (!publicKey) {
      throw new Error('Unable to get public key from Freighter wallet.');
    }

    toast.loading(`Building transaction for ${swaps.length} swap${swaps.length > 1 ? 's' : ''}...`);

    // Transform swaps to prepTrades format
    const trades = swaps.map(swap => ({
      sell: swap.from,
      buy: swap.to,
      amount: swap.amount.toString()
    }));

    // Call our prepTrades backend API
    const prepResponse = await fetch('/api/trades/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades, publicKey })
    });

    if (!prepResponse.ok) {
      const error = await prepResponse.json().catch(() => ({ error: 'Failed to prepare trades' }));
      throw new Error(error.error || 'Failed to prepare transaction');
    }

    const { xdr, summary, features } = await prepResponse.json();
    
    console.log('📋 Transaction prepared:', {
      operations: summary.totalOperations,
      estimatedFee: summary.estimatedFee,
      protocol23Features: features
    });

    toast.loading(`Signing transaction... (${summary.totalOperations} operations)`);

    // Sign and submit XDR with Freighter
    const result = await freighterApi.signAndSubmitXDR(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015'
    });
    
    console.log('📤 Transaction submitted:', {
      hash: result.hash,
      fee: summary.estimatedFee,
      routes: summary.routes
    });

    // Start monitoring the transaction
    if (result.hash) {
      toast.success(`📤 Transaction submitted! Monitoring confirmation...`);
      
      try {
        // Monitor transaction with real-time updates
        const finalStatus = await monitorTransactionWithToasts(result.hash, toast);
        
        if (finalStatus.status === 'success') {
          // Mark all as completed only after network confirmation
          swaps.forEach(swap => updateSwapStatus(swap.id, 'completed'));
          
          console.log('🎉 Transaction confirmed on network:', {
            hash: result.hash,
            ledger: finalStatus.details?.ledger,
            operationCount: finalStatus.details?.operation_count
          });
          
          // Clear completed swaps after a short delay
          setTimeout(() => clearSwaps(), 3000);
        } else {
          // Transaction failed or timed out
          throw new Error(`Transaction ${finalStatus.status}: ${finalStatus.error || 'Unknown error'}`);
        }
      } catch (monitorError) {
        console.error('Transaction monitoring failed:', monitorError);
        // Still mark as completed since it was submitted
        swaps.forEach(swap => updateSwapStatus(swap.id, 'completed'));
        toast.warning('⚠️ Transaction submitted but monitoring failed. Check manually.');
      }
    } else {
      throw new Error('No transaction hash returned from Freighter');
    }

  } catch (error: any) {
    console.error('Swap execution failed:', error);
    
    // Mark all as failed
    swaps.forEach(swap => updateSwapStatus(swap.id, 'failed'));
    
    // Enhanced error messages
    let errorMessage = error.message || 'Unknown error occurred';
    
    if (errorMessage.includes('User declined')) {
      errorMessage = 'Transaction was cancelled by user';
    } else if (errorMessage.includes('Freighter')) {
      errorMessage = 'Wallet connection error. Please check Freighter extension.';
    } else if (errorMessage.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    toast.error(`❌ Swap failed: ${errorMessage}`);
  } finally {
    setExecuting(false);
  }
};

// ------------------------------
// 4️⃣ UI Component
// ------------------------------
interface Props {
  className?: string;
}

const TradeQueueCard: React.FC<Props> = ({ className }) => {
  const { swaps, isExecuting, removeSwap, clearSwaps, addSwap } = useTradeQueueStore();
  const { tier, features, isKycVerified } = useSubscriptionStore();
  const { addTransaction } = useTransactionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // DEBUG: Log swaps to console
  console.log('🔍 TradeQueueCard render - swaps:', swaps);

  const pendingSwaps = swaps.filter(swap => swap.status === 'pending');
  const executingSwaps = swaps.filter(swap => swap.status === 'executing');
  const completedSwaps = swaps.filter(swap => swap.status === 'completed');

  const onConfirmAll = async () => {
    console.log('🚀 Confirm button clicked!');
    console.log('📊 Pending swaps:', pendingSwaps);
    if (pendingSwaps.length === 0) return;
    
    // Add to transaction center
    const txId = addTransaction({
      type: 'swap',
      status: 'signing',
      summary: `Executing ${pendingSwaps.length} swap${pendingSwaps.length > 1 ? 's' : ''}`,
      details: {
        operations: pendingSwaps.length,
      }
    });
    
    await executeSwaps(pendingSwaps);
  };

  const getStatusIcon = (status: SwapRequest['status']) => {
    switch (status) {
      case 'executing':
        return <Spinner size="sm" className="text-yellow-400" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'failed':
        return <Trash2 className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SwapRequest['status']) => {
    switch (status) {
      case 'executing':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'failed':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-border bg-muted/30';
    }
  };

  return (
    <>
      <Card className={`w-full mt-4 border-border bg-card/50 shadow-lg shadow-black/5 ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              Pending Swaps ({swaps.length} total)
              {swaps.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-teal-600 text-white text-xs rounded-full">
                  {pendingSwaps.length}
                </span>
              )}
            </h3>
            {/* Tier badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTierDisplayInfo(tier).color} ${getTierDisplayInfo(tier).textColor}`}>
              {tier === 'elite' && <Crown className="w-3 h-3" />}
              {getTierDisplayInfo(tier).name}
            </div>
          </div>
          {swaps.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSwaps}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Tier limit warning */}
        {pendingSwaps.length >= features.maxConcurrentSwaps && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-500">
                  Swap limit reached ({features.maxConcurrentSwaps} swaps)
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs"
              >
                Upgrade
              </Button>
            </div>
          </motion.div>
        )}
        
        {swaps.length === 0 ? (
          <EmptyState icon="box">Nothing queued</EmptyState>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {swaps.map((swap) => (
                <motion.div
                  key={swap.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`flex items-center justify-between rounded-2xl p-3 border shadow-sm ${getStatusColor(swap.status)} ${swap.status === 'pending' ? 'animate-pulse opacity-75' : ''}`}>
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(swap.status)}
                      <span className="flex items-center gap-2 font-mono text-sm text-foreground">
                        <span className="font-bold">{swap.amount}</span>
                        <span className="text-muted-foreground">{swap.from}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{swap.to}</span>
                      </span>
                    </div>
                    
                    {swap.status === 'pending' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeSwap(swap.id)}
                        className="p-1 hover:text-red-400 text-muted-foreground transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {pendingSwaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex gap-2"
          >
            <Button
              onClick={onConfirmAll}
              disabled={isExecuting}
              className="flex-1 shadow-sm hover:shadow-md"
              size="sm"
            >
              {isExecuting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  Confirm {pendingSwaps.length} Swap{pendingSwaps.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </motion.div>
        )}

        {(executingSwaps.length > 0 || completedSwaps.length > 0) && (
          <div className="mt-3 text-xs text-muted-foreground text-center">
            {executingSwaps.length > 0 && (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                <span>{executingSwaps.length} executing...</span>
              </div>
            )}
            {completedSwaps.length > 0 && (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{completedSwaps.length} completed</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      </Card>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentSwapCount={pendingSwaps.length}
      />
    </>
  );
};

// Export hook for external components to trigger upgrade modal
export const useTradeQueueUpgrade = () => {
  const { swaps } = useTradeQueueStore();
  const { features } = useSubscriptionStore();
  const pendingCount = swaps.filter(s => s.status === 'pending').length;
  const isAtLimit = pendingCount >= features.maxConcurrentSwaps;
  
  return { isAtLimit, pendingCount, maxSwaps: features.maxConcurrentSwaps };
};

export default TradeQueueCard;