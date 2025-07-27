import { create } from 'zustand';

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWallet = create<WalletState>((set) => ({
  publicKey: null,
  isConnected: false,
  connect: async () => {
    const [{ isConnected }, { address }] = await Promise.all([
      (await import('@stellar/freighter-api')).isConnected(),
      (await import('@stellar/freighter-api')).requestAccess(),
    ]);
    if (!isConnected || !address) throw new Error('Freighter not connected');
    set({ publicKey: address, isConnected: true });
  },
  disconnect: () => set({ publicKey: null, isConnected: false }),
}));