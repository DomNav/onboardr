'use client';
import { useWallet } from '@/contexts/WalletContext';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import BalanceDialog from '@/components/BalanceDialog';
import SegmentedNav from '@/components/SegmentedNav';
import UserIsland from '@/components/UserIsland';
import WalletSelectModal from '@/components/wallet/WalletSelectModal';
import { useProfileStore } from '@/store/profile';

const tabs = [
  { href: 'https://app.soroswap.finance/swap', label: 'Soroswap', external: true },
  { href: '/soro', label: 'Soro AI' },
  { href: '/analytics', label: 'Dashboard' },
  { href: 'https://www.defindex.io/', label: 'Defindex', external: true },
];

export default function Nav() {
  const { isConnected, isConnecting, disconnect, address, error } = useWallet();
  const { data: session } = useSession();
  const { profile } = useProfileStore();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  return (
    <>
      <nav 
        className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-b border-border"
        style={{ '--nav-height': '72px' } as React.CSSProperties}
      >
        {/* Left side - Navigation tabs */}
        <SegmentedNav tabs={tabs} />
        
        {/* Right side - User island */}
        <UserIsland />
      </nav>
      
      {/* Balance Dialog */}
      <BalanceDialog />
      
      {/* Wallet Selection Modal */}
      <WalletSelectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </>
  );
}