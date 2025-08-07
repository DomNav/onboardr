'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { VaultMetrics, ProtocolSnapshot, VaultHistory } from '@/lib/defindex/client';

// Hook for fetching protocol snapshot
export function useDefindexSnapshot() {
  return useQuery({
    queryKey: ['defindex', 'snapshot'],
    queryFn: async () => {
      const response = await fetch('/api/defindex/metrics?type=snapshot');
      if (!response.ok) throw new Error('Failed to fetch snapshot');
      return response.json() as Promise<ProtocolSnapshot>;
    },
    refetchInterval: 30000, // Auto-refresh every 30s
    staleTime: 25000, // Consider data stale after 25s
  });
}

// Hook for fetching vault metrics
export function useDefindexVaults() {
  return useQuery({
    queryKey: ['defindex', 'vaults'],
    queryFn: async () => {
      const response = await fetch('/api/defindex/metrics?type=vaults');
      if (!response.ok) throw new Error('Failed to fetch vaults');
      const data = await response.json();
      return data.vaults as VaultMetrics[];
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });
}

// Hook for fetching vault history
export function useVaultHistory(vaultId: string, range: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['defindex', 'vault', vaultId, 'history', range],
    queryFn: async () => {
      const response = await fetch(`/api/defindex/metrics/${vaultId}/history?range=${range}`);
      if (!response.ok) throw new Error('Failed to fetch vault history');
      const data = await response.json();
      return data.data as VaultHistory[];
    },
    enabled: !!vaultId,
    staleTime: 60000, // History data can be cached longer
  });
}

// Hook for comparison data
export function useDefindexComparison() {
  return useQuery({
    queryKey: ['defindex', 'comparison'],
    queryFn: async () => {
      const response = await fetch('/api/defindex/metrics?type=comparison');
      if (!response.ok) throw new Error('Failed to fetch comparison');
      return response.json() as Promise<{
        soroswap: ProtocolSnapshot;
        defindex: ProtocolSnapshot;
      }>;
    },
    refetchInterval: 60000, // Less frequent updates for comparison
    staleTime: 55000,
  });
}

// Combined hook for all metrics with optimized loading
export function useDefindexMetrics() {
  const snapshot = useDefindexSnapshot();
  const vaults = useDefindexVaults();
  const comparison = useDefindexComparison();
  
  // Only show loading on initial load, not on refetch
  const isLoading = snapshot.isLoading && !snapshot.data;
  const isError = snapshot.isError || vaults.isError || comparison.isError;
  const error = snapshot.error || vaults.error || comparison.error;
  
  return {
    snapshot: snapshot.data,
    vaults: vaults.data,
    comparison: comparison.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      // Refetch in parallel but don't block UI
      Promise.all([
        snapshot.refetch(),
        vaults.refetch(),
        comparison.refetch()
      ]);
    },
  };
}

// Hook for simulating deposits (what-if scenarios)
export function useWhatIfSimulator() {
  const [simulation, setSimulation] = useState<{
    amount: number;
    vaultId: string;
    projectedYield: number;
    projectedValue: number;
  } | null>(null);
  
  const simulate = (amount: number, vaultId: string, apy: number) => {
    // Calculate 1-year projection
    const yearlyYield = amount * (apy / 100);
    const projectedValue = amount + yearlyYield;
    
    setSimulation({
      amount,
      vaultId,
      projectedYield: yearlyYield,
      projectedValue,
    });
  };
  
  const reset = () => setSimulation(null);
  
  return {
    simulation,
    simulate,
    reset,
  };
}