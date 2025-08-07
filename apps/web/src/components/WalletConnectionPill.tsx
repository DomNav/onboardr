'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ChevronDown, Copy, LogOut } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useProfileStore } from '@/store/profile';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
         DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import WalletSelectModal from '@/components/wallet/WalletSelectModal';
import ProfileMenu from './ProfileMenu';

export default function WalletConnectionPill() {
  const { isConnected, isConnecting, address, network, disconnect, connect } = useWallet();
  const hasProfileNFT = useProfileStore(state => state.hasProfileNFT);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const formatAddress = (addr: string | null) => {
    if (!addr || typeof addr !== 'string') return 'Connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      // Could add a toast notification here
    }
  };

  const handleConnect = async () => {
    try {
      // Try to connect to Freighter first (most common)
      await connect('freighter');
    } catch (error) {
      // If Freighter fails, open the wallet modal
      console.log('Auto-connect failed, opening wallet modal:', error);
      setShowWalletModal(true);
    }
  };

  // When wallet is not connected, show animated connect button
  if (!isConnected) {
    return (
      <>
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="default"
            size="sm"
            className="relative bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span className="font-medium">
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </span>
            
            {/* Animated pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20"
              animate={{
                opacity: [0, 0.2, 0],
                scale: [1, 1.2, 1.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </Button>
        </motion.div>

        {/* Wallet Selection Modal */}
        <WalletSelectModal 
          isOpen={showWalletModal} 
          onClose={() => setShowWalletModal(false)} 
        />
      </>
    );
  }

  // When wallet is connected, show address dropdown or profile menu
  if (hasProfileNFT) {
    // If user has Profile NFT, use the existing ProfileMenu
    return <ProfileMenu />;
  }

  // Wallet connected but no Profile NFT - show address dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative bg-white/10 hover:bg-white/20 text-white rounded-full px-3 py-1.5 flex items-center gap-2 transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-sm">
            {formatAddress(address)}
          </span>
          {network && (
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0 h-5 bg-white/10 text-white/80 border-white/20"
            >
              {network}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 text-white/60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4" />
            <span>Wallet Connected</span>
          </div>
          <div className="font-mono text-xs bg-muted rounded p-1 break-all">
            {address}
          </div>
        </div>
        
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 w-4 h-4" /> Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={disconnect}
          className="text-orange-600 focus:text-orange-600"
        >
          <LogOut className="mr-2 w-4 h-4" /> Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}