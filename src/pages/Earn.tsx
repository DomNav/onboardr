import React, { useState } from 'react';
import { TrendingUp, Wallet, DollarSign, Loader2 } from 'lucide-react';
import { useVault, depositToVault, withdrawFromVault } from '@/hooks/useVault';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const VAULT_ID = 'defi-vault-1'; // Default vault ID

export default function Earn() {
  const { data: vault, isLoading, error, refetch } = useVault(VAULT_ID);
  const { toast } = useToast();
  
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await depositToVault(VAULT_ID, depositAmount);
      if (result.success) {
        toast({
          title: "Deposit Successful",
          description: `Successfully deposited ${depositAmount} XLM to the vault`,
        });
        setDepositAmount('');
        setDepositModalOpen(false);
        refetch(); // Refresh vault data
      } else {
        toast({
          title: "Deposit Failed",
          description: result.error || "Failed to deposit to vault",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: "An error occurred while depositing to the vault",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (vault && parseFloat(withdrawAmount) > vault.userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds your vault balance",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await withdrawFromVault(VAULT_ID, withdrawAmount);
      if (result.success) {
        toast({
          title: "Withdrawal Successful",
          description: `Successfully withdrew ${withdrawAmount} XLM from the vault`,
        });
        setWithdrawAmount('');
        setWithdrawModalOpen(false);
        refetch(); // Refresh vault data
      } else {
        toast({
          title: "Withdrawal Failed",
          description: result.error || "Failed to withdraw from vault",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "An error occurred while withdrawing from the vault",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading vault information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Vault</CardTitle>
            <CardDescription>
              Failed to load vault information. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vault Not Found</CardTitle>
            <CardDescription>
              The requested vault could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Earn</h1>
        <p className="text-muted-foreground">
          Maximize your DeFi yields with our optimized vaults
        </p>
      </div>

      {/* Vault Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{vault.name}</CardTitle>
              <CardDescription>{vault.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg font-semibold">
              {vault.asset}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TVL */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Value Locked</span>
              </div>
              <p className="text-2xl font-bold">${vault.tvl.toLocaleString()}</p>
            </div>

            {/* APY */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Current APY</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{vault.apy.toFixed(2)}%</p>
            </div>

            {/* User Balance */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Your Balance</span>
              </div>
              <p className="text-2xl font-bold">{vault.userBalance.toFixed(4)} {vault.asset}</p>
              <p className="text-sm text-muted-foreground">
                {vault.userShares.toFixed(4)} shares
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <Button 
              variant="gradient" 
              onClick={() => setDepositModalOpen(true)}
              className="flex-1"
            >
              Deposit
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setWithdrawModalOpen(true)}
              className="flex-1"
              disabled={vault.userBalance === 0}
            >
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit to Vault</DialogTitle>
            <DialogDescription>
              Enter the amount you want to deposit to start earning yield.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({vault.asset})</label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepositModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={isProcessing || !depositAmount}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from Vault</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw from your vault balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({vault.asset})</label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Available: {vault.userBalance.toFixed(4)} {vault.asset}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={isProcessing || !withdrawAmount}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}