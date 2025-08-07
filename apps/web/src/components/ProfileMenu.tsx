'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import WalletSelectModal from '@/components/wallet/WalletSelectModal';
import { useWallet } from '@/contexts/WalletContext';
import { useProfileStore } from '@/store/profile';
import { ChevronDown, Copy, LogOut, Settings, Trash, Wallet } from 'lucide-react';
import { useState } from 'react';
import { AvatarInitial } from './ui/AvatarInitial';
import { ProfileSettingsDialog } from './ProfileSettingsDialog';

export default function ProfileMenu() {
  const profileMetadata = useProfileStore(state => state.profileMetadata);
  const hasProfileNFT = useProfileStore(state => state.hasProfileNFT);
  const isHydrated = useProfileStore(state => state.isHydrated);
  const clearProfile = useProfileStore(state => state.clearProfile);
  const { isConnected, address, disconnect, connect } = useWallet();
  const [showSettings, setShowSettings] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Demo bypass function
  const handleDemoConnect = async () => {
    try {
      // Try to connect to Freighter first (most common)
      await connect('freighter');
    } catch (error) {
      // If Freighter fails, open the wallet modal as fallback
      console.log('Demo connect failed, opening wallet modal:', error);
      setShowWalletModal(true);
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr || typeof addr !== 'string') return 'Connected';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      // You could add a toast notification here
    }
  };



  // Show profile menu even without NFT, but with different content

  async function handleDelete() {
    if (!confirm('⚠️  Delete account & burn NFT? This cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/profile/delete', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }
      
      clearProfile();          // kill local state
      window.location.href = '/'; // soft logout / redirect
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-teal-500 rounded-full p-1">
          {!isHydrated ? (
            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center animate-pulse">
              <span className="text-xs font-bold text-white">...</span>
            </div>
          ) : hasProfileNFT && profileMetadata ? (
            <AvatarInitial 
              name={profileMetadata.name}
              size="sm"
            />
          ) : isConnected ? (
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <Wallet className="size-3 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">?</span>
            </div>
          )}
          
          {/* Show wallet address when connected */}
          {isConnected && address && (
            <span className="text-xs text-white/80 font-mono">
              {formatAddress(address)}
            </span>
          )}
          
          <ChevronDown className="size-4 text-white/60" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Wallet Section */}
        {isConnected && address && (
          <>
            <div className="px-2 py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="size-4" />
                <span>Wallet Connected</span>
              </div>
              <div className="font-mono text-xs bg-muted rounded p-1">
                {address}
              </div>
            </div>
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className="mr-2 size-4" /> Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={disconnect}
              className="text-orange-600 focus:text-orange-600"
            >
              <LogOut className="mr-2 size-4" /> Disconnect Wallet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Profile Section */}
        {hasProfileNFT && profileMetadata ? (
          <>
            <DropdownMenuItem
              onClick={() => setShowSettings(true)}
            >
              <Settings className="mr-2 size-4" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 size-4" /> Delete Account
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {!isConnected && (
              <>
                <DropdownMenuItem onClick={handleDemoConnect}>
                  <Wallet className="mr-2 size-4" /> Connect Wallet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem disabled>
              <Settings className="mr-2 size-4" /> Create Profile NFT
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <span className="mr-2">📝</span> Mint your profile to unlock features
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      
      {hasProfileNFT && profileMetadata && (
        <ProfileSettingsDialog 
          open={showSettings} 
          onOpenChange={setShowSettings}
        />
      )}
      
      {/* Wallet Selection Modal */}
      <WalletSelectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </DropdownMenu>
  );
} 