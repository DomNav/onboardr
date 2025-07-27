import { useQuery } from '@tanstack/react-query';

interface VaultInfo {
  id: string;
  name: string;
  tvl: number;
  apy: number;
  userBalance: number;
  userShares: number;
  totalShares: number;
  asset: string;
  description?: string;
}

interface DepositResponse {
  success: boolean;
  txHash?: string;
  newBalance?: number;
  error?: string;
}

interface WithdrawResponse {
  success: boolean;
  txHash?: string;
  newBalance?: number;
  error?: string;
}

const fetchVaultInfo = async (id: string): Promise<VaultInfo> => {
  const response = await fetch(`/api/vaults/${id}/info`);
  if (!response.ok) {
    throw new Error('Failed to fetch vault info');
  }
  return response.json();
};

export const useVault = (id: string) => {
  return useQuery({
    queryKey: ['vault', id],
    queryFn: () => fetchVaultInfo(id),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!id,
  });
};

export const depositToVault = async (id: string, amount: string): Promise<DepositResponse> => {
  const response = await fetch(`/api/vaults/${id}/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to deposit to vault');
  }
  
  return response.json();
};

export const withdrawFromVault = async (id: string, amount: string): Promise<WithdrawResponse> => {
  const response = await fetch(`/api/vaults/${id}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to withdraw from vault');
  }
  
  return response.json();
};