'use client';

import React from 'react';
import { Wallet, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectorMeta, WalletErrorCodes } from '@/connectors/types';

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FreighterIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white shadow-lg">
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
    </svg>
  </div>
);

const getErrorMessage = (error: any): string => {
  if (!error) return '';
  
  switch (error.code) {
    case WalletErrorCodes.USER_REJECTED:
      return 'Connection was cancelled. Please try again.';
    case WalletErrorCodes.NOT_INSTALLED:
      return error.message || 'Wallet is not installed or available.';
    case WalletErrorCodes.CONNECTION_FAILED:
      return 'Failed to connect. Please check your wallet and try again.';
    case WalletErrorCodes.WC_SESSION_EXPIRED:
      return 'WalletConnect session expired. Please reconnect.';
    default:
      return error.message || 'An unknown error occurred.';
  }
};

export default function WalletSelectModal({ isOpen, onClose }: WalletSelectModalProps) {
  const { connect, isConnecting, error, availableConnectors, isConnected } = useWallet();

  const handleConnect = async (connectorId: string) => {
    try {
      await connect(connectorId);
      // Don't close immediately - let the connection complete
      setTimeout(() => {
        if (isConnected) {
          onClose();
        }
      }, 1000);
    } catch (err) {
      // Error is handled by the context
      console.error('Connection failed:', err);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect to Freighter
          </DialogTitle>
          <DialogDescription>
            Connect your Freighter wallet to start trading on Stellar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {availableConnectors.length > 0 ? (
            <div className="space-y-2">
              <Button
                variant="outline"
                className={`w-full justify-start h-16 p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                  !availableConnectors[0].installed ? 'opacity-50 cursor-not-allowed' : ''
                } ${isConnecting ? 'pointer-events-none' : ''}`}
                onClick={() => availableConnectors[0].installed && handleConnect('freighter')}
                disabled={!availableConnectors[0].installed || isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <FreighterIcon />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Freighter Wallet</div>
                    <div className="text-sm text-muted-foreground">
                      {!availableConnectors[0].installed 
                        ? 'Extension not detected' 
                        : 'Browser extension wallet for Stellar'
                      }
                    </div>
                  </div>
                  {isConnecting && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!availableConnectors[0].installed && (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </Button>
              
              {/* Install Link or Troubleshooting */}
              {!availableConnectors[0].installed && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">Freighter Not Detected</p>
                  <p className="text-xs text-amber-700 mb-2">
                    If Freighter is already installed, try:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 ml-4">
                    <li>• Refreshing the page</li>
                    <li>• Unlocking Freighter (enter password)</li>
                    <li>• Disabling and re-enabling the extension</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <a
                      href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Install Freighter Extension →
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Loading wallet connector...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">Connection Failed</div>
                <div className="text-sm text-red-700 mt-1">
                  {getErrorMessage(error)}
                </div>
              </div>
            </div>
          </div>
        )}

        {isConnecting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <div className="text-sm text-blue-800">
                Connecting to wallet...
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Need testnet XLM? <a href="https://laboratory.stellar.org/#account-creator" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Get from faucet</a>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isConnecting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}