import { useState, useEffect, useCallback } from 'react';
import { balanceEvents } from '@/lib/balanceEvents';
import { useWalletNetworkListener } from '@/contexts/WalletContext';

export type BalanceRow = {
  code: string;      // XLM, USDC …
  issuer: string;    // G… pubkey
  type: 'Native' | 'Stellar Classic Asset' | 'Wrapped';
  amount: string;    // human-readable
  logo: string;      // URL for token icon
};

// Asset logos - replace with your existing asset-map JSON
const ASSET_LOGOS: Record<string, string> = {
  'XLM': '/assets/xlm.png',
  'USDC': '/assets/usdc.png',
  'AQUA': '/assets/aqua.png',
  'XRP': '/assets/xrp.png',
  'BTC': '/assets/btc.png',
  'CETES': '/assets/cetes.png',
};

export function useWalletBalances(address?: string | null, network?: 'mainnet' | 'testnet' | null) {
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState<boolean>(true);

  const fetchBalances = useCallback(async () => {
    if (!address || !network) {
      setRows([]);
      setAccountExists(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the new wallet balance API endpoint
      const response = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}&network=${network}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }
      
      // Track account existence
      setAccountExists(data.accountExists !== false);
      
      const balanceRows: BalanceRow[] = [];
      
      // Add native balance (XLM)
      if (data.native) {
        balanceRows.push({
          code: 'XLM',
          issuer: 'native',
          type: 'Native',
          amount: data.native.balance,
          logo: ASSET_LOGOS['XLM'] || '/assets/default.png',
        });
      }
      
      // Add asset balances
      if (data.assets && Array.isArray(data.assets)) {
        data.assets.forEach((asset: any) => {
          balanceRows.push({
            code: asset.asset_code || 'Unknown',
            issuer: asset.asset_issuer || '',
            type: 'Stellar Classic Asset',
            amount: asset.balance,
            logo: ASSET_LOGOS[asset.asset_code] || '/assets/default.png',
          });
        });
      }

      setRows(balanceRows);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      setRows([]);
      setAccountExists(true); // Reset on error
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  const refetch = useCallback(async () => {
    await fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    if (!address || !network) return;

    fetchBalances();
    
    // Refresh balance every 10 seconds for real-time updates
    const interval = setInterval(fetchBalances, 10000);
    
    return () => clearInterval(interval);
  }, [fetchBalances, address, network]);

  // Listen for balance refresh events (e.g., after successful mint)
  useEffect(() => {
    const cleanup = balanceEvents.addListener(() => {
      if (address) {
        fetchBalances();
      }
    });
    
    return cleanup;
  }, [fetchBalances, address]);

  // Listen for network changes and refresh balances
  useWalletNetworkListener(useCallback(() => {
    if (address && network) {
      fetchBalances();
    }
  }, [fetchBalances, address, network]));

  return {
    rows,
    refetch,
    loading,
    error,
    accountExists,
  };
} 