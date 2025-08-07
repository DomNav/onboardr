import { create } from 'zustand';

interface WalletStore {
  showBalances: boolean;
  setShowBalances: (show: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  showBalances: false,
  setShowBalances: (show) => set({ showBalances: show }),
})); 