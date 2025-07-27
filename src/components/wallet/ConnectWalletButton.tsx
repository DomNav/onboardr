import { Button } from '@/components/ui/button';
import { useFreighter } from '@/hooks/useFreighter';

const truncate = (addr: string) => `${addr.slice(0, 5)}…${addr.slice(-4)}`;

export default function ConnectWalletButton() {
  const { publicKey, isConnected, connect, disconnect } = useFreighter();

  return (
    <Button
      variant="outline"
      onClick={isConnected ? disconnect : connect}
      className="rounded-2xl px-4"
    >
      {isConnected && publicKey ? truncate(publicKey) : 'Connect Freighter'}
    </Button>
  );
}