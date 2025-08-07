'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import 'smoothscroll-polyfill';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useProfileStore } from '@/store/profile';
import { useTradeStore } from '@/store/trades';
import { Skeleton } from '@/components/ui/skeleton';
import MintProfileModal from '@/components/MintProfileModal';

// Lazy load heavy components
const SoroChatPanel = lazy(() => import('@/components/SoroChatPanel'));
const SoroHero = lazy(() => import('@/components/SoroHero').then(m => ({ default: m.SoroHero })));
const SoroFeaturesAccordion = lazy(() => import('@/components/SoroFeaturesAccordion').then(m => ({ default: m.SoroFeaturesAccordion })));
const SoroMetrics = lazy(() => import('@/components/SoroMetrics').then(m => ({ default: m.SoroMetrics })));
const MetricsCard = lazy(() => import('@/components/MetricsCard').then(m => ({ default: m.MetricsCard })));
const DefindexSummaryCard = lazy(() => import('@/components/DefindexSummaryCard').then(m => ({ default: m.DefindexSummaryCard })));
const TradeQueueCard = lazy(() => import('@/components/TradeQueueCard'));

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export default function SoroPage() {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [hasMintedSuccessfully, setHasMintedSuccessfully] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [walletJustConnected, setWalletJustConnected] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { isConnected, address } = useWallet();
  const { hasProfileNFT, checkOwnership, isCheckingOwnership, hasDismissedMintModal, setHasDismissedMintModal } = useProfileStore();
  const { markRead } = useTradeStore();

  // Check Profile NFT ownership when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkOwnership(address);
      // Mark that wallet just connected
      setWalletJustConnected(true);
      // Small delay to let wallet connection UI settle before showing modal
      setTimeout(() => {
        setWalletJustConnected(false);
      }, 1500);
    } else {
      // Reset flags when wallet disconnects
      setHasMintedSuccessfully(false);
      setWalletJustConnected(false);
      setHasDismissedMintModal(false); // Reset so modal can show again in new session
    }
  }, [isConnected, address, checkOwnership, setHasDismissedMintModal]);

  // Show mint modal only after wallet has been connected for a moment
  // AND the user hasn't already dismissed it in this session
  useEffect(() => {
    if (isConnected && !isCheckingOwnership && !hasProfileNFT && !hasMintedSuccessfully && !walletJustConnected && !hasDismissedMintModal) {
      // Add a small delay after wallet connection before showing the modal
      const timer = setTimeout(() => {
        setShowMintModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isCheckingOwnership, hasProfileNFT, hasMintedSuccessfully, walletJustConnected, hasDismissedMintModal]);

  const handleTradeQuote = (quote: any) => {
    setCurrentQuote(quote);
  };



  const handleMintSuccess = () => {
    // Set flag to prevent modal from showing again
    setHasMintedSuccessfully(true);
    
    // Refresh ownership status after successful mint
    if (address) {
      checkOwnership(address);
    }
  };

  const handleTryFeature = (command: string) => {
    // First, scroll to the chat input
    const chatSection = document.getElementById('soroChatPanel');
    if (chatSection) {
      chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // After a short delay, populate and focus the input
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.value = command;
        chatInputRef.current.focus();
        // Highlight the input briefly
        chatInputRef.current.classList.add('ring-2', 'ring-teal-400', 'ring-offset-2');
        setTimeout(() => {
          chatInputRef.current?.classList.remove('ring-2', 'ring-teal-400', 'ring-offset-2');
        }, 1500);
      }
    }, 500);
  };

  // Show loading state while checking ownership
  if (isConnected && isCheckingOwnership) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking Profile NFT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] bg-gradient-to-br from-background via-background/80 to-background -mx-6 -my-6 px-6 py-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative"
      >
        <motion.div variants={item}>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <SoroHero />
          </Suspense>
        </motion.div>

        {/* Always show chat panel and sidebar */}
        <motion.div variants={item} className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2" id="soroChatPanel">
                <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
                  <SoroChatPanel onTradeQuote={handleTradeQuote} inputRef={chatInputRef} />
                </Suspense>
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-4">
                  <div className="bg-card/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-lg shadow-black/5">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-2xl border border-border/30 shadow-sm">
                        <p className="text-sm text-muted-foreground">Type commands in chat:</p>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground/80">
                          <p>• <span className="text-teal-400">swap 100 xlm for usdc</span> - Natural language</p>
                          <p>• <span className="text-teal-400">swap 100 xlm for usdc and swap 50 aqua to yxlm</span> - Multiple swaps</p>
                          <p>• <span className="text-teal-400">help</span> - Show all commands</p>
                        </div>
                      </div>
                      
                      {/* Metrics Action Button */}
                      <button
                        onClick={() => setIsMetricsOpen(true)}
                        className="w-full p-3 bg-gradient-to-r from-teal-500/10 to-teal-600/10 hover:from-teal-500/20 hover:to-teal-600/20 rounded-2xl border border-teal-500/20 hover:border-teal-500/30 shadow-sm hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">View Analytics</p>
                              <p className="text-xs text-muted-foreground">Charts, volume, and metrics</p>
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-muted-foreground group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                      
                      <div className="p-3 bg-muted/50 rounded-2xl border border-border/30 shadow-sm">
                          <p className="text-sm text-muted-foreground text-center">
                            Use the <button 
                              onClick={markRead} 
                              className="text-cyan-400 font-medium hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
                            >
                              Swaps
                            </button> button in the navbar to view all your swaps
                          </p>
                        </div>
                    </div>
                  </div>
                  
                  {/* Trade Queue Card - only show if wallet is connected */}
                  {isConnected && (
                    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
                      <TradeQueueCard />
                    </Suspense>
                  )}
                  
                  {/* DeFindex Summary Card */}
                  <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                    <DefindexSummaryCard />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Always show the features accordion */}
        <motion.div variants={item} className="py-8">
          <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
            <SoroFeaturesAccordion onTryFeature={handleTryFeature} />
          </Suspense>
        </motion.div>

        {/* Always show metrics section */}
        <motion.div variants={item} className="py-8">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <SoroMetrics />
          </Suspense>
        </motion.div>
      </motion.div>

      {/* Profile NFT Mint Modal */}
      <MintProfileModal
        isOpen={showMintModal}
        onClose={() => {
          setShowMintModal(false);
          // Mark that the user has dismissed the modal in this session
          setHasDismissedMintModal(true);
          // Reset mint success flag when modal is manually closed
          setHasMintedSuccessfully(false);
        }}
        onSuccess={handleMintSuccess}
      />

      {/* Metrics Panel */}
      <Suspense fallback={null}>
        <MetricsCard 
          isOpen={isMetricsOpen} 
          onClose={() => setIsMetricsOpen(false)} 
        />
      </Suspense>
    </div>
  );
}