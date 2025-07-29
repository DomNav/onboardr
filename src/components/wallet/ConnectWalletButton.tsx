import { Button } from '../ui/button';
import { useFreighter } from '../../hooks/useFreighter';

const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export default function ConnectWalletButton() {
  const { publicKey, isConnected, connect, disconnect } = useFreighter();

  return (
    <Button
      variant="outline"
      onClick={isConnected ? disconnect : connect}
      className="rounded-2xl px-4"
      title={isConnected ? `Click to disconnect ${publicKey}` : 'Connect your Freighter wallet'}
    >
      {isConnected && publicKey ? (
        <span className="flex items-center gap-2">
          <span>{truncate(publicKey)}</span>
          <span className="text-xs opacity-70">• Disconnect</span>
        </span>
      ) : (
        'Connect Freighter'
      )}
    </Button>
  );
}