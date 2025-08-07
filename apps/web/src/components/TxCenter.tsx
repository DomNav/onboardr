'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { SwapDetailsBadge } from '@/components/SwapDetailsCard';
import {
    getTransactionStatusInfo,
    useTransactionStore,
    type Transaction
} from '@/store/transactions';
import {
    Activity,
    CheckCircle2,
    Copy,
    ExternalLink,
    TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function TxCenter() {
  const { 
    transactions, 
    isDrawerOpen, 
    activeTransactions,
    setDrawerOpen,
    clearTransactions,
    getRecentTransactions 
  } = useTransactionStore();
  
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Auto-open when new transaction is added
  useEffect(() => {
    const handleNewTx = (event: CustomEvent) => {
      // Could add sound effect here
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => {});
    };

    window.addEventListener('newTransaction', handleNewTx as EventListener);
    return () => window.removeEventListener('newTransaction', handleNewTx as EventListener);
  }, []);

  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      toast.success('Transaction hash copied!');
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      toast.error('Failed to copy hash');
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderTransaction = (tx: Transaction) => {
    const statusInfo = getTransactionStatusInfo(tx.status);
    
    return (
      <motion.div
        key={tx.id}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Card className={`border ${statusInfo.bgColor} ${
          statusInfo.animated ? 'animate-pulse' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{statusInfo.icon}</span>
                <div>
                  <p className="font-medium text-sm">{tx.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
              </div>
              <Badge 
                variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                className={statusInfo.color}
              >
                {statusInfo.label}
              </Badge>
            </div>
            
            {tx.details && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {tx.details.amount && (
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-mono">
                      {tx.details.amount} {tx.details.token}
                    </span>
                  </div>
                )}
                {tx.details.estimatedFee && (
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span className="font-mono">{tx.details.estimatedFee} XLM</span>
                  </div>
                )}
                {tx.details.operations && (
                  <div className="flex justify-between">
                    <span>Operations:</span>
                    <span>{tx.details.operations}</span>
                  </div>
                )}
                
                {/* Show swap details badge for swap transactions */}
                {tx.details.swap && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <SwapDetailsBadge swapDetails={tx.details.swap} />
                  </div>
                )}
              </div>
            )}
            
            {tx.hash && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Hash:</span>
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                    </code>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(tx.hash!)}
                    >
                      {copiedHash === tx.hash ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    {tx.explorerUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        asChild
                      >
                        <a 
                          href={tx.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {tx.error && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                <p className="text-xs text-red-500">{tx.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      {/* Floating button indicator */}
      <AnimatePresence>
        {activeTransactions > 0 && !isDrawerOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-24 right-6 lg:bottom-28 lg:right-8 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="relative">
              <Activity className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeTransactions}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Transaction Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Transaction Center
              </div>
              {activeTransactions > 0 && (
                <Badge variant="default" className="bg-blue-500">
                  {activeTransactions} Active
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Monitor your transaction status in real-time
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your transactions will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
                  </p>
                  {transactions.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        clearTransactions();
                        toast.success('Transaction history cleared');
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="space-y-3 pr-4">
                    <AnimatePresence mode="popLayout">
                      {transactions.map(renderTransaction)}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Export a hook to programmatically control the TxCenter
export function useTxCenter() {
  const { setDrawerOpen, addTransaction } = useTransactionStore();
  
  return {
    open: () => setDrawerOpen(true),
    close: () => setDrawerOpen(false),
    addTransaction,
  };
}