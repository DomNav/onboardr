'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWalletStore } from '@/store/wallet';
import BalanceTable from './BalanceTable';

export default function BalanceDialog() {
  const { showBalances, setShowBalances } = useWalletStore();
  const [showWrapped, setShowWrapped] = useState(false);

  return (
    <Dialog open={showBalances} onOpenChange={setShowBalances}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto sm:translate-y-0 translate-y-full transition-transform duration-300">
        <DialogHeader>
          <DialogTitle>Your token&apos;s balance</DialogTitle>
          <DialogDescription>
            View and manage your wallet token balances across supported networks.
          </DialogDescription>
        </DialogHeader>
        <BalanceTable 
          showWrapped={showWrapped} 
          onToggleWrapped={setShowWrapped} 
        />
      </DialogContent>
    </Dialog>
  );
} 