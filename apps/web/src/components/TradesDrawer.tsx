'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Activity } from 'lucide-react';
import TradesTable from './TradesTable';
import { useTradeStore } from '@/store/trades';
import { useState, useEffect } from 'react';

export default function TradesDrawer() {
  const { 
    isOpen, 
    setOpen, 
    trades, 
    clearTrades,
    getPendingTrades,
    getExecutingTrades, 
    getCompletedTrades,
    getCancelledTrades,
    getFailedTrades
  } = useTradeStore();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute counts
  const pendingCount = getPendingTrades().length;
  const executingCount = getExecutingTrades().length;
  const completedCount = getCompletedTrades().length;
  const cancelledCount = getCancelledTrades().length;
  const failedCount = getFailedTrades().length;

  // Mock refresh function - will be replaced with real API call
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all trade history? This cannot be undone.')) {
      clearTrades();
    }
  };

  // Auto-switch to executing tab when trades are executing
  useEffect(() => {
    if (executingCount > 0 && activeTab === 'pending') {
      setActiveTab('executing');
    }
  }, [executingCount, activeTab]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl bg-background/95 backdrop-blur-sm border-l border-border/50"
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-semibold text-foreground">
                    Swaps Center
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage and monitor all your swaps
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                
                {trades.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col mt-4"
          >
            <TabsList className="grid grid-cols-4 mb-4 bg-muted/30">
              <TabsTrigger value="pending" className="relative text-xs">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="executing" className="relative text-xs">
                Executing
                {executingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1 bg-blue-500">
                    {executingCount}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="completed" className="relative text-xs">
                Completed
                {completedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1">
                    {completedCount}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="cancelled" className="relative text-xs">
                Failed
                {(cancelledCount + failedCount) > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1">
                    {cancelledCount + failedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <TabsContent value="pending" className="h-full overflow-y-auto">
                  <TradesTable status="pending" />
                </TabsContent>
                
                <TabsContent value="executing" className="h-full overflow-y-auto">
                  <TradesTable status="executing" />
                </TabsContent>
                
                <TabsContent value="completed" className="h-full overflow-y-auto">
                  <TradesTable status="completed" />
                </TabsContent>
                
                <TabsContent value="cancelled" className="h-full overflow-y-auto">
                  <div className="space-y-4">
                    {/* Show both cancelled and failed together in this tab */}
                    {getCancelledTrades().length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Cancelled</h3>
                        <TradesTable status="cancelled" />
                      </div>
                    )}
                    
                    {getFailedTrades().length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Failed</h3>
                        <TradesTable status="failed" />
                      </div>
                    )}
                    
                    {getCancelledTrades().length === 0 && getFailedTrades().length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <div className="text-2xl text-muted-foreground">🚫</div>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No failed trades
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Cancelled and failed trades will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}