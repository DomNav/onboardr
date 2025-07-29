'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Soroswap component stubs - to be replaced with actual components
export function SwapComponent() {
  return (
    <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">Soroswap Trading Interface</h2>
      <p className="text-zinc-400 mb-4">
        Full Soroswap integration coming soon. This will connect to the Soroswap SDK for trading.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-zinc-800 rounded">From: [Token Selector]</div>
        <div className="p-4 bg-zinc-800 rounded">To: [Token Selector]</div>
        <button className="w-full py-3 bg-purple-600 rounded hover:bg-purple-700">
          Connect Wallet to Swap
        </button>
      </div>
    </div>
  );
}

export function Balances() {
  const [isClient, setIsClient] = useState(false);
  const [walletState, setWalletState] = useState({
    publicKey: null as string | null,
    isConnected: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleWalletAction = async () => {
    if (!isClient) return;
    
    try {
      if (walletState.isConnected) {
        setWalletState({ publicKey: null, isConnected: false });
        toast.success('Wallet disconnected');
      } else {
        // Import Freighter API 
        const { isConnected, requestAccess } = await import('@stellar/freighter-api');
        
        const [connected, { address }] = await Promise.all([
          isConnected(),
          requestAccess(),
        ]);
        
        if (connected && address) {
          setWalletState({ publicKey: address, isConnected: true });
          toast.success('Wallet connected successfully!');
        } else {
          throw new Error('Freighter not connected');
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect Freighter');
    }
  };

  if (!isClient) {
    return (
      <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
        <h2 className="text-xl font-bold mb-4">Wallet Balances</h2>
        <p className="text-zinc-400 mb-4">Loading...</p>
        <div className="space-y-2">
          <div className="flex justify-between p-3 bg-zinc-800 rounded">
            <span>XLM</span>
            <span>--- XLM</span>
          </div>
          <div className="flex justify-between p-3 bg-zinc-800 rounded">
            <span>USDC</span>
            <span>--- USDC</span>
          </div>
        </div>
        <button className="w-full mt-4 py-3 bg-purple-600 rounded hover:bg-purple-700">
          Connect Freighter Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="border border-purple-600 rounded-lg p-6 bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">Wallet Balances</h2>
      <p className="text-zinc-400 mb-4">
        {walletState.isConnected 
          ? `Connected wallet: ${walletState.publicKey ? truncate(walletState.publicKey) : 'Unknown'}`
          : 'Connect your Freighter wallet to view balances and manage assets.'
        }
      </p>
      <div className="space-y-2">
        <div className="flex justify-between p-3 bg-zinc-800 rounded">
          <span>XLM</span>
          <span>{walletState.isConnected ? '0.00 XLM' : '--- XLM'}</span>
        </div>
        <div className="flex justify-between p-3 bg-zinc-800 rounded">
          <span>USDC</span>
          <span>{walletState.isConnected ? '0.00 USDC' : '--- USDC'}</span>
        </div>
      </div>
      <button 
        className="w-full mt-4 py-3 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
        onClick={handleWalletAction}
      >
        {walletState.isConnected ? 'Disconnect Wallet' : 'Connect Freighter Wallet'}
      </button>
    </div>
  );
}