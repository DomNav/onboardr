'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Clock, Check, XCircle, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useTradeSimulation } from '@/contexts/TradeSimulationContext';
import { SimQuote } from '@/types/trade';

interface TradeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  newQuote?: any; // Keep for backward compatibility
}

// Individual Trade Card Component for each hop
function TradeCard({ quote, index, isDemo }: { quote: SimQuote; index: number; isDemo: boolean }) {
  const [fromToken, toToken] = quote.hop;
  const minReceived = (Number(quote.amountOut) * 0.995).toFixed(6); // 0.5% slippage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.15,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="w-full"
    >
      <Card className="border-border bg-card/30 hover:bg-card/50 transition-all duration-300 shadow-lg shadow-black/5">
        <CardContent className="p-4">
          {/* Hop Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs text-white font-medium shadow-sm">
                {index + 1}
              </div>
              <h3 className="font-medium text-foreground text-sm">
                {fromToken} → {toToken}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {quote.priceImpact < 1 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-yellow-400" />
              )}
              <span className={`${quote.priceImpact < 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                {quote.priceImpact.toFixed(2)}% impact
              </span>
            </div>
          </div>

          {/* Token Flow */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 text-center">
              <div className="text-xs text-muted-foreground mb-1">You pay</div>
              <div className="text-foreground font-medium">{quote.amountIn}</div>
              <div className="text-xs text-muted-foreground">{fromToken}</div>
            </div>
            
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 text-center">
              <div className="text-xs text-muted-foreground mb-1">You get</div>
              <div className="text-foreground font-medium">{quote.amountOut}</div>
              <div className="text-xs text-muted-foreground">{toToken}</div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="space-y-2 text-xs border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min received:</span>
              <span className="text-foreground">{minReceived} {toToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee:</span>
              <span className="text-foreground">{quote.feePct}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={false}
              className={`flex-1 px-3 py-2 rounded-2xl transition-colors text-sm font-medium shadow-sm hover:shadow-md bg-teal-600 hover:bg-teal-500 text-white`}
            >
              Confirm
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={false}
              className={`flex-1 px-3 py-2 rounded-2xl transition-colors text-sm font-medium shadow-sm hover:shadow-md bg-red-600 hover:bg-red-500 text-white`}
            >
              Reject
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton loader for trade cards
function TradeCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full"
    >
      <Card className="border-slate-700 bg-slate-800/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-20 h-4" />
            </div>
            <Skeleton className="w-16 h-3" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 text-center space-y-1">
              <Skeleton className="w-12 h-3 mx-auto" />
              <Skeleton className="w-16 h-4 mx-auto" />
              <Skeleton className="w-8 h-3 mx-auto" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 text-center space-y-1">
              <Skeleton className="w-12 h-3 mx-auto" />
              <Skeleton className="w-16 h-4 mx-auto" />
              <Skeleton className="w-8 h-3 mx-auto" />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-16 h-3" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="w-8 h-3" />
              <Skeleton className="w-12 h-3" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Skeleton className="flex-1 h-8" />
            <Skeleton className="flex-1 h-8" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TradeSidebar({ isOpen, onClose, newQuote }: TradeSidebarProps) {
  const { state, confirmTrade, rejectTrade, clearSimulation } = useTradeSimulation();
  const [isClient, setIsClient] = useState(false);

  // Handle client-side only environment variables to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentSim = state.currentSimulation;
  const isLoading = currentSim?.status === 'loading';
  const isReady = currentSim?.status === 'ready';

  // Handle confirm all trades
  const handleConfirmAll = () => {
    if (currentSim) {
      confirmTrade(currentSim.id);
    }
  };

  // Handle reject all trades
  const handleRejectAll = () => {
    if (currentSim) {
      rejectTrade(currentSim.id);
    }
  };

  // Don't render until client-side to avoid hydration mismatches
  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.4
            }}
            className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isLoading ? 'Simulating Trade...' : 'Trade Simulation'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Current Simulation */}
                {currentSim && (
                  <>
                    {/* Summary Card */}
                    <Card className="border-teal-500/30 bg-slate-800/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-teal-400 flex items-center gap-2">
                          {isLoading && <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />}
                          Trade Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total In:</span>
                            <span className="text-white font-medium">{currentSim.totalAmountIn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Out:</span>
                            <span className="text-white font-medium">{currentSim.totalAmountOut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Price Impact:</span>
                            <span className={`font-medium ${
                              currentSim.totalPriceImpact < 1 ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {currentSim.totalPriceImpact.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Hops:</span>
                            <span className="text-white">{currentSim.quotes.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Individual Trade Cards */}
                    <div className="space-y-3">
                      {isLoading ? (
                        // Show skeleton loaders while loading
                        Array.from({ length: currentSim.quotes.length || 2 }, (_, i) => (
                          <TradeCardSkeleton key={i} index={i} />
                        ))
                      ) : (
                        // Show actual trade cards when ready
                        currentSim.quotes.map((quote, index) => (
                          <TradeCard 
                            key={`${quote.hop.join('-')}-${index}`}
                            quote={quote} 
                            index={index}
                            isDemo={false} // Always false for real trades
                          />
                        ))
                      )}
                    </div>

                    {/* Confirm All Button */}
                    {isReady && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: currentSim.quotes.length * 0.15 + 0.2 }}
                        className="pt-4 border-t border-slate-700"
                      >
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirmAll}
                            disabled={false}
                            className={`flex-1 px-4 py-3 rounded-2xl transition-colors font-medium bg-teal-600 hover:bg-teal-500 text-white`}
                          >
                            Confirm All Swaps
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRejectAll}
                            className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-colors font-medium"
                          >
                            Reject
                          </motion.button>
                        </div>
                        
                      </motion.div>
                    )}
                  </>
                )}

                {/* Empty State */}
                {!currentSim && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm">No active simulation</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Use swap 100 xlm for usdc to start a simulation
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}