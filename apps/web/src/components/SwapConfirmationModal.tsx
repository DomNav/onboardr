'use client';

import { SwapDetailsCard } from '@/components/SwapDetailsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SwapDetails } from '@/store/transactions';
import {
    AlertTriangle,
    ArrowUpDown,
    CheckCircle,
    Clock,
    Info,
    Loader2,
    X
} from 'lucide-react';
import { useState } from 'react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  swaps: Array<{
    id: string;
    from: string;
    to: string;
    amount: number;
    expectedOutput?: number;
    swapDetails?: SwapDetails;
  }>;
  totalFees?: number;
  isExecuting?: boolean;
}

export function SwapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  swaps,
  totalFees = 0,
  isExecuting = false
}: SwapConfirmationModalProps) {
  const [hasAcceptedWarnings, setHasAcceptedWarnings] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!hasAcceptedWarnings) return;
    
    setConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Swap confirmation failed:', error);
    } finally {
      setConfirming(false);
    }
  };

  const getTotalValue = () => {
    return swaps.reduce((total, swap) => total + swap.amount, 0);
  };

  const hasHighPriceImpact = () => {
    return swaps.some(swap => 
      swap.swapDetails && swap.swapDetails.priceImpact > 3
    );
  };

  const hasHighSlippage = () => {
    return swaps.some(swap => 
      swap.swapDetails && swap.swapDetails.slippageTolerance > 1
    );
  };

  const showWarnings = hasHighPriceImpact() || hasHighSlippage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Confirm Swap{swaps.length > 1 ? 's' : ''}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              disabled={confirming}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Transaction Summary</span>
                <Badge variant="outline" className="font-mono">
                  {swaps.length} operation{swaps.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {swaps.map((swap, index) => (
                <div key={swap.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="font-semibold">{swap.amount}</span>
                      <span className="text-muted-foreground">{swap.from}</span>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground rotate-90" />
                      <span className="text-muted-foreground">{swap.to}</span>
                    </div>
                  </div>
                  {swap.expectedOutput && (
                    <div className="text-sm text-muted-foreground">
                      ≈{swap.expectedOutput.toFixed(6)} {swap.to}
                    </div>
                  )}
                </div>
              ))}

              <Separator />
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Estimated Network Fees</span>
                <span className="font-mono">≈{totalFees.toFixed(4)} XLM</span>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {showWarnings && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Important Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasHighPriceImpact() && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">High Price Impact Detected</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        One or more swaps may significantly affect the market price. Consider reducing the amount.
                      </p>
                    </div>
                  </div>
                )}
                
                {hasHighSlippage() && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">High Slippage Tolerance</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your transaction may be frontrun or receive less than expected due to high slippage tolerance.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="accept-warnings" 
                    checked={hasAcceptedWarnings}
                    onCheckedChange={setHasAcceptedWarnings}
                  />
                  <label
                    htmlFor="accept-warnings"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I understand the risks and want to proceed
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Swap Information */}
          {swaps.some(swap => swap.swapDetails) && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Swap Details
              </h3>
              {swaps.map((swap, index) => 
                swap.swapDetails && (
                  <SwapDetailsCard
                    key={swap.id}
                    swapDetails={swap.swapDetails}
                    compact={true}
                    showHeader={false}
                    className="border-l-4 border-l-primary"
                  />
                )
              )}
            </div>
          )}

          {/* Execution Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What happens next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <span className="text-sm">Sign transaction in your wallet</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <span className="text-sm">Transaction broadcast to Stellar network</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <span className="text-sm">Confirmation and token transfer (~5-10 seconds)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={confirming}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={showWarnings && !hasAcceptedWarnings || confirming}
            className="flex-1"
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Swap{swaps.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
