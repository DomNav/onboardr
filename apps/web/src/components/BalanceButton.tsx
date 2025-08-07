import { Coins } from 'lucide-react';
import { useWalletStore } from '@/store/wallet';
import { useWallet } from '@/contexts/WalletContext';

export default function BalanceButton() {
  const { showBalances, setShowBalances } = useWalletStore();
  const { isConnected } = useWallet();

  if (!isConnected) {
    return null; // Don't show balance button if wallet not connected
  }

  return (
    <button 
      onClick={() => setShowBalances(!showBalances)}
      className="ml-2 flex items-center gap-1 rounded-full bg-violet-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors duration-200"
    >
      <Coins className="size-4" /> 
      Balance
    </button>
  );
} 