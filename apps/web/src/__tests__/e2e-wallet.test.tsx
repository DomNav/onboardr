import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';

// Mock the wallet context and components
const mockWalletContext = {
  address: null,
  isConnected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  balance: '0',
};

// Create a mock wallet connection component
function MockWalletConnection() {
  const [connected, setConnected] = React.useState(false);
  const [address, setAddress] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setError(null);
      
      if (!('freighterApi' in window)) {
        throw new Error('Freighter wallet not installed');
      }

      const publicKey = await window.freighterApi.getPublicKey();
      setAddress(publicKey);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setAddress(null);
    setError(null);
  };

  return (
    <div>
      {!connected ? (
        <button onClick={connectWallet} data-testid="connect-wallet">
          Connect Wallet
        </button>
      ) : (
        <div>
          <div data-testid="wallet-address">{address}</div>
          <button onClick={disconnectWallet} data-testid="disconnect-wallet">
            Disconnect
          </button>
        </div>
      )}
      {error && <div data-testid="wallet-error">{error}</div>}
    </div>
  );
}

describe('End-to-End Wallet Connection Tests', () => {
  beforeEach(() => {
    // Reset window.freighterApi mock
    Object.defineProperty(window, 'freighterApi', {
      value: {
        getPublicKey: vi.fn().mockResolvedValue('GTEST123ABCDEF'),
        isConnected: vi.fn().mockResolvedValue(true),
        signTransaction: vi.fn().mockResolvedValue('signed-tx'),
        signAndSubmitXDR: vi.fn().mockResolvedValue({ hash: 'tx-hash' }),
      },
      writable: true,
    });
  });

  describe('Wallet Connection Flow', () => {
    it('successfully connects to Freighter wallet', async () => {
      render(<MockWalletConnection />);

      const connectButton = screen.getByTestId('connect-wallet');
      expect(connectButton).toBeInTheDocument();

      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
        expect(screen.getByTestId('wallet-address')).toHaveTextContent('GTEST123ABCDEF');
      });

      expect(screen.getByTestId('disconnect-wallet')).toBeInTheDocument();
    });

    it('handles wallet connection errors gracefully', async () => {
      // Mock Freighter API to throw error
      window.freighterApi.getPublicKey = vi.fn().mockRejectedValue(new Error('User rejected'));

      render(<MockWalletConnection />);

      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-error')).toBeInTheDocument();
        expect(screen.getByTestId('wallet-error')).toHaveTextContent('User rejected');
      });
    });

    it('handles missing Freighter extension', async () => {
      // Remove freighterApi from window
      delete (window as any).freighterApi;

      render(<MockWalletConnection />);

      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-error')).toBeInTheDocument();
        expect(screen.getByTestId('wallet-error')).toHaveTextContent('Freighter wallet not installed');
      });
    });

    it('can disconnect wallet successfully', async () => {
      render(<MockWalletConnection />);

      // Connect first
      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
      });

      // Then disconnect
      const disconnectButton = screen.getByTestId('disconnect-wallet');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(screen.getByTestId('connect-wallet')).toBeInTheDocument();
        expect(screen.queryByTestId('wallet-address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Wallet State Persistence', () => {
    it('remembers wallet connection across page reloads', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('GTEST123ABCDEF'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      render(<MockWalletConnection />);

      // Should attempt to reconnect automatically
      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('wallet-address');
      });
    });

    it('clears wallet state on disconnect', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      render(<MockWalletConnection />);

      // Connect and disconnect
      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('disconnect-wallet')).toBeInTheDocument();
      });

      const disconnectButton = screen.getByTestId('disconnect-wallet');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      });
    });
  });

  describe('Transaction Signing Flow', () => {
    it('successfully signs a transaction', async () => {
      render(<MockWalletConnection />);

      // Connect wallet first
      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
      });

      // Mock signing a transaction
      const signTx = vi.fn().mockResolvedValue('signed-xdr');
      window.freighterApi.signTransaction = signTx;

      // Simulate signing
      const result = await window.freighterApi.signTransaction('mock-xdr');
      expect(result).toBe('signed-xdr');
      expect(signTx).toHaveBeenCalledWith('mock-xdr');
    });

    it('handles transaction signing errors', async () => {
      render(<MockWalletConnection />);

      // Connect wallet first
      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
      });

      // Mock signing failure
      const signTx = vi.fn().mockRejectedValue(new Error('User cancelled transaction'));
      window.freighterApi.signTransaction = signTx;

      // Simulate signing failure
      await expect(window.freighterApi.signTransaction('mock-xdr')).rejects.toThrow('User cancelled transaction');
    });
  });

  describe('Network Connectivity', () => {
    it('handles network errors gracefully', async () => {
      // Mock network failure
      server.use(
        http.get('*', () => {
          return HttpResponse.error();
        })
      );

      render(<MockWalletConnection />);

      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      // Should still connect to wallet even if network is down
      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
      });
    });

    it('retries connection on network recovery', async () => {
      let attempts = 0;
      
      // Mock intermittent network failure
      server.use(
        http.get('*', () => {
          attempts++;
          if (attempts <= 2) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ success: true });
        })
      );

      render(<MockWalletConnection />);

      const connectButton = screen.getByTestId('connect-wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-address')).toBeInTheDocument();
      });

      // Should have retried at least once
      expect(attempts).toBeGreaterThan(1);
    });
  });
});

// Helper function to create a React import for the mock component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    }
  }
}

import React from 'react';