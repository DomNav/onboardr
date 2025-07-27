import { useWallet } from '@/store/wallet';
import { toast } from 'sonner';
import { isAllowed } from '@stellar/freighter-api';

export const useFreighter = () => {
  const { publicKey, isConnected, connect, disconnect } = useWallet();

  const safeConnect = async () => {
    try {
      await connect();
      toast.success('Wallet connected');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to connect Freighter'
      );
    }
  };

  return { publicKey, isConnected, connect: safeConnect, disconnect, isAllowed };
};