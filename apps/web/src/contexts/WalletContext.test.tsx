/**
 * Integration tests for WalletContext
 * Tests multi-connector state management, network drift detection, and auto-reconnect
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { WalletProvider, useWallet, useWalletNetworkListener } from './WalletContext';
import { WalletErrorCodes } from '@/connectors/types';

// Get mock helpers
const { __freighterMock } = jest.requireMock('@stellar/freighter-api');
const { __signClientMock, __modalMock } = jest.requireMock('../connectors/__mocks__/walletconnect');

// Test component that uses the wallet context
const TestComponent = () => {
  const { 
    isConnected, 
    address, 
    network, 
    connectorId, 
    isConnecting, 
    error, 
    availableConnectors,
    connect, 
    disconnect, 
    refreshConnection 
  } = useWallet();

  const [networkChangeEvents, setNetworkChangeEvents] = React.useState<string[]>([]);

  useWalletNetworkListener(React.useCallback((oldNetwork, newNetwork) => {
    setNetworkChangeEvents(prev => [...prev, `${oldNetwork}->${newNetwork}`]);
  }, []));

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Not Connected'}
      </div>
      <div data-testid="address">{address || 'No Address'}</div>
      <div data-testid="network">{network || 'No Network'}</div>
      <div data-testid="connector-id">{connectorId || 'No Connector'}</div>
      <div data-testid="is-connecting">{isConnecting ? 'Connecting' : 'Not Connecting'}</div>
      <div data-testid="error">{error?.message || 'No Error'}</div>
      <div data-testid="available-connectors">
        {availableConnectors.map(c => `${c.id}:${c.installed}`).join(',')}
      </div>
      <div data-testid="network-events">{networkChangeEvents.join(';')}</div>
      
      <button 
        data-testid="connect-freighter" 
        onClick={() => connect('freighter')}
        disabled={isConnecting}
      >
        Connect Freighter
      </button>
      <button 
        data-testid="connect-lobstr" 
        onClick={() => connect('lobstr')}
        disabled={isConnecting}
      >
        Connect LOBSTR
      </button>
      <button 
        data-testid="disconnect" 
        onClick={() => disconnect()}
      >
        Disconnect
      </button>
      <button 
        data-testid="refresh" 
        onClick={() => refreshConnection()}
      >
        Refresh
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <WalletProvider>
      <TestComponent />
    </WalletProvider>
  );
};

describe('WalletContext Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    __freighterMock.reset();
    __signClientMock.reset();
    __modalMock.reset();
    
    // Clear localStorage
    localStorage.clear();
    
    // Set up window.freighter for availability
    (window as any).freighter = {};
    
    // Set up environment
    process.env.NEXT_PUBLIC_WC_PROJECT_ID = 'test-project-id';
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should render with default disconnected state', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
        expect(screen.getByTestId('address')).toHaveTextContent('No Address');
        expect(screen.getByTestId('network')).toHaveTextContent('No Network');
        expect(screen.getByTestId('connector-id')).toHaveTextContent('No Connector');
        expect(screen.getByTestId('is-connecting')).toHaveTextContent('Not Connecting');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });
    });

    it('should load available connectors', async () => {
      renderWithProvider();
      
      await waitFor(() => {
        const connectors = screen.getByTestId('available-connectors').textContent;
        expect(connectors).toContain('freighter:true');
        expect(connectors).toContain('lobstr:true');
      });
    });
  });

  describe('Freighter Connection Flow', () => {
    it('should connect to Freighter successfully', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('PUBLIC');

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
        expect(screen.getByTestId('address')).toHaveTextContent(mockAddress);
        expect(screen.getByTestId('network')).toHaveTextContent('mainnet');
        expect(screen.getByTestId('connector-id')).toHaveTextContent('freighter');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });

      // Should store connector ID in localStorage
      expect(localStorage.getItem('wallet_connector_id')).toBe('freighter');
    });

    it('should handle Freighter connection error', async () => {
      __freighterMock.simulateUserRejection();

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
        expect(screen.getByTestId('error')).toHaveTextContent('User rejected');
      });
    });

    it('should handle Freighter not installed', async () => {
      delete (window as any).freighter;
      __freighterMock.simulateNotInstalled();

      renderWithProvider();
      
      await waitFor(() => {
        const connectors = screen.getByTestId('available-connectors').textContent;
        expect(connectors).toContain('freighter:false');
      });

      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('not installed or available');
      });
    });
  });

  describe('LOBSTR Connection Flow', () => {
    it('should connect to LOBSTR successfully', async () => {
      __signClientMock
        .clearSessions()
        .setConnectSuccess(true);

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-lobstr'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
        expect(screen.getByTestId('address')).toHaveTextContent('GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC');
        expect(screen.getByTestId('network')).toHaveTextContent('testnet');
        expect(screen.getByTestId('connector-id')).toHaveTextContent('lobstr');
      });

      // Should store connector ID in localStorage
      expect(localStorage.getItem('wallet_connector_id')).toBe('lobstr');
    });

    it('should handle LOBSTR connection rejection', async () => {
      __signClientMock
        .clearSessions()
        .setConnectSuccess(false);

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-lobstr'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
        expect(screen.getByTestId('error')).toHaveTextContent('User rejected');
      });
    });
  });

  describe('Disconnect Flow', () => {
    it('should disconnect successfully', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // First connect
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('PUBLIC');

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Then disconnect
      await act(async () => {
        await user.click(screen.getByTestId('disconnect'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
        expect(screen.getByTestId('address')).toHaveTextContent('No Address');
        expect(screen.getByTestId('network')).toHaveTextContent('No Network');
        expect(screen.getByTestId('connector-id')).toHaveTextContent('No Connector');
      });

      // Should clear localStorage
      expect(localStorage.getItem('wallet_connector_id')).toBeNull();
    });
  });

  describe('Network Drift Detection', () => {
    it('should detect and handle network changes', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // Connect on testnet
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('TESTNET');

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('network')).toHaveTextContent('testnet');
      });

      // Simulate network change to mainnet
      await act(async () => {
        __freighterMock.simulateNetworkChange('PUBLIC');
        
        // Trigger network drift check (normally happens on focus/timer)
        window.dispatchEvent(new Event('focus'));
        
        // Wait for drift check
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await waitFor(() => {
        expect(screen.getByTestId('network')).toHaveTextContent('mainnet');
        expect(screen.getByTestId('network-events')).toHaveTextContent('testnet->mainnet');
      });
    });
  });

  describe('Auto-reconnect', () => {
    it('should auto-reconnect on page load with stored connection', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // Pre-populate localStorage as if user was previously connected
      localStorage.setItem('wallet_connector_id', 'freighter');
      
      // Set up Freighter to be connected
      __freighterMock
        .setConnected(true)
        .setAddress(mockAddress)
        .setNetwork('PUBLIC');

      renderWithProvider();
      
      // Wait for auto-reconnect
      await waitFor(
        () => {
          expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
          expect(screen.getByTestId('address')).toHaveTextContent(mockAddress);
          expect(screen.getByTestId('network')).toHaveTextContent('mainnet');
          expect(screen.getByTestId('connector-id')).toHaveTextContent('freighter');
        },
        { timeout: 2000 }
      );
    });

    it('should clean up stale stored connection', async () => {
      // Pre-populate localStorage with stale connection
      localStorage.setItem('wallet_connector_id', 'freighter');
      
      // Set up Freighter to not be connected
      __freighterMock.setConnected(false);

      renderWithProvider();
      
      // Wait for cleanup
      await waitFor(
        () => {
          expect(localStorage.getItem('wallet_connector_id')).toBeNull();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Connection Refresh', () => {
    it('should refresh connection state', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // Connect first
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('TESTNET')
        .setConnected(true);

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Change network in mock
      __freighterMock.setNetwork('PUBLIC');

      // Refresh connection
      await act(async () => {
        await user.click(screen.getByTestId('refresh'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('network')).toHaveTextContent('mainnet');
      });
    });

    it('should disconnect if connection is no longer valid', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // Connect first
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('TESTNET')
        .setConnected(true);

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Simulate connection lost
      __freighterMock.setConnected(false);

      // Refresh connection
      await act(async () => {
        await user.click(screen.getByTestId('refresh'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Not Connected');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display appropriate error messages', async () => {
      __freighterMock.setError('requestAccess', new Error('Custom error message'));

      renderWithProvider();
      
      await act(async () => {
        await user.click(screen.getByTestId('connect-freighter'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Custom error message');
      });
    });

    it('should handle unknown connector', async () => {
      renderWithProvider();
      
      await act(async () => {
        const wallet = useWallet();
        await wallet.connect('unknown-connector');
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Connector unknown-connector not found');
      });
    });
  });
});