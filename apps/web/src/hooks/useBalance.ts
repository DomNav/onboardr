import { useState, useEffect, useCallback } from 'react';
import { useWalletNetworkListener } from '@/contexts/WalletContext';

interface NativeBalance {
  balance: string;
  asset_type: 'native';
}

interface AssetBalance {
  balance: string;
  asset_code: string;
  asset_issuer: string;
  asset_type: string;
}

interface BalanceData {
  native: NativeBalance;
  assets: AssetBalance[];
  address: string | null;
  updatedAt: Date | null;
  isLoading: boolean;
  error: string | null;
  accountExists?: boolean;
  refetch: () => Promise<void>;
}

export default function useBalance(address?: string, network?: 'mainnet' | 'testnet' | null): BalanceData {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    native: { balance: '0', asset_type: 'native' },
    assets: [],
    address: address || null,
    updatedAt: null,
    isLoading: false,
    error: null,
    refetch: async () => {}
  });

  const fetchBalance = useCallback(async () => {
    if (!address || !network) {
      setBalanceData(prev => ({
        ...prev,
        native: { balance: '0', asset_type: 'native' },
        assets: [],
        address: null,
        updatedAt: null,
        isLoading: false,
        error: null,
      }));
      return;
    }
    
    setBalanceData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}&network=${network}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }
      
      setBalanceData(prev => ({
        ...prev,
        native: data.native || { balance: '0', asset_type: 'native' },
        assets: data.assets || [],
        address: data.address,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        isLoading: false,
        error: null,
        accountExists: data.accountExists !== false, // Default to true unless explicitly false
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Balance fetch timed out');
        setBalanceData(prev => ({
          ...prev,
          native: { balance: '0', asset_type: 'native' },
          assets: [],
          updatedAt: null,
          isLoading: false,
          error: 'Request timed out - network may be slow',
        }));
      } else {
        console.error('Failed to fetch balance:', error);
        setBalanceData(prev => ({
          ...prev,
          native: { balance: '0', asset_type: 'native' },
          assets: [],
          updatedAt: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
  }, [address, network]);

  // Update refetch function reference
  useEffect(() => {
    setBalanceData(prev => ({ ...prev, refetch: fetchBalance }));
  }, [fetchBalance]);

  useEffect(() => {
    if (!address || !network) return;

    fetchBalance();
    
    // Refresh balance every 30 seconds (reduced from 10s to improve performance)
    const interval = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(interval);
  }, [address, network, fetchBalance]);

  // Update address when it changes
  useEffect(() => {
    setBalanceData(prev => ({ ...prev, address: address || null }));
  }, [address]);

  // Listen for network changes and refresh balances
  useWalletNetworkListener(useCallback(() => {
    if (address && network) {
      fetchBalance();
    }
  }, [fetchBalance, address, network]));

  return balanceData;
}