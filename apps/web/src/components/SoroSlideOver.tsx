'use client';

import { MetricWidgetGrid } from '@/components/MetricWidget';
import SoroChatPanel from '@/components/SoroChatPanel';
import TradeQueueCard from '@/components/TradeQueueCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradientText } from '@/components/ui/GradientText';
import { useWallet } from '@/contexts/WalletContext';
import { Activity, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SoroSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

const SoroAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
    <svg
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill="rgb(20 184 166)" />
      <circle cx="15" cy="9" r="1.5" fill="rgb(20 184 166)" />
      <path 
        d="M8 14c1 2 3 3 4 3s3-1 4-3" 
        stroke="rgb(20 184 166)" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  </div>
);

export const SoroSlideOver: React.FC<SoroSlideOverProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isConnected } = useWallet();

  // Focus chat input when panel opens
  useEffect(() => {
    if (isOpen && chatInputRef.current) {
      // Small delay to ensure the panel is fully rendered
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleTradeQuote = (quote: any) => {
    // The SoroChatPanel handles trade quotes through the existing context
    // No additional handling needed here - the global trade simulation context
    // and transaction confirmation modals will handle the rest
    console.log('Trade quote received in slide-over:', quote);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="fixed inset-y-0 right-0 h-full max-w-3xl w-full sm:max-w-4xl transform translate-x-0 translate-y-0 left-auto top-0 rounded-l-2xl rounded-r-none border-l border-t-0 border-r-0 border-b-0 p-0 gap-0 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300"
        style={{
          // Override the default centering styles from DialogContent
          position: 'fixed',
          transform: 'none',
          left: 'auto',
          top: '0',
          right: '0',
          bottom: '0',
          maxHeight: '100vh'
        }}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 space-y-0">
          <DialogTitle className="flex items-center gap-3">
            <SoroAvatar />
            <div>
              <h2 className="text-lg font-semibold">
                <GradientText>Soro</GradientText>
              </h2>
              <p className="text-sm text-muted-foreground">AI Trading Assistant</p>
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted"
            aria-label="Close Soro panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Content - ensure full height with proper scroll handling */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
            {/* Metrics Widgets - Top Section */}
            <div className="flex-shrink-0">
              <MetricWidgetGrid isLoading={false} />
            </div>

            {/* Main layout - two columns on desktop, stacked on mobile */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              {/* Left Column - Chat */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Chat Panel */}
                <div className="flex-1 min-h-0 lg:min-h-[400px]">
                  <SoroChatPanel 
                    onTradeQuote={handleTradeQuote} 
                    inputRef={chatInputRef}
                  />
                </div>
              </div>

              {/* Right Column - Trade Queue & Quick Commands */}
              <div className="w-full lg:w-80 flex flex-col space-y-4">
                {/* Pending Swaps */}
                <div className="flex-1 min-h-0">
                  {isConnected ? (
                    <>
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Pending Swaps
                        </h3>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <TradeQueueCard />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center p-4 bg-muted/50 rounded-xl border border-border/30">
                        <p className="text-sm text-muted-foreground">
                          Connect your wallet to view pending swaps
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Commands - Moved from left column */}
                <div className="flex-shrink-0">
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/30">
                    <p className="text-sm text-muted-foreground mb-2">Quick commands:</p>
                    <div className="space-y-1 text-xs text-muted-foreground/80">
                      <p>• <span className="text-teal-400 font-mono">swap 100 xlm for usdc</span></p>
                      <p>• <span className="text-teal-400 font-mono">help</span> - Show all commands</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
