'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  WalletConnector, 
  WalletError, 
  WalletConnection, 
  StellarNetwork,
  ConnectorMeta 
} from '@/connectors/types';
import { getConnector, getAvailableConnectors } from '@/connectors';
import { toast } from 'sonner';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: StellarNetwork | null;
  connectorId: string | null;
  isConnecting: boolean;
  error: WalletError | null;
  availableConnectors: ConnectorMeta[];
}

interface WalletContextType extends WalletState {
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshConnection: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    network: null,
    connectorId: null,
    isConnecting: false,
    error: null,
    availableConnectors: [],
  });

  const driftCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const currentConnectorRef = useRef<WalletConnector | null>(null);

  // Initialize available connectors on mount
  useEffect(() => {
    const initConnectors = async () => {
      try {
        const connectors = await getAvailableConnectors();
        setState(prev => ({ ...prev, availableConnectors: connectors }));
      } catch (error) {
        console.error('[WalletContext] Failed to initialize connectors:', error);
        toast.error('Failed to initialize wallet connectors', {
          description: 'Please refresh the page and try again'
        });
      }
    };

    initConnectors();
  }, []);

  const disconnect = useCallback(async () => {
    console.log('🔌 Disconnecting wallet...');
    
    try {
      if (currentConnectorRef.current) {
        await currentConnectorRef.current.disconnect();
      }
    } catch (error) {
      console.error('[WalletContext] Error during disconnect:', error);
      // Surface error to user
      toast.error('Failed to disconnect wallet', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }

    // Clear state
    setState({
      isConnected: false,
      address: null,
      network: null,
      connectorId: null,
      isConnecting: false,
      error: null,
      availableConnectors: state.availableConnectors, // Preserve existing data
    });

    // Clear stored connection
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wallet_connector_id');
    }

    // Clear connector reference
    currentConnectorRef.current = null;

    // Clear drift monitoring
    if (driftCheckInterval.current) {
      clearInterval(driftCheckInterval.current);
      driftCheckInterval.current = null;
    }
  }, [state.availableConnectors]);

  // Network drift detection
  const checkNetworkDrift = useCallback(async () => {
    if (!currentConnectorRef.current || !state.isConnected || !state.network) {
      return;
    }

    try {
      const freshNetwork = await currentConnectorRef.current.getNetwork();
      if (freshNetwork !== state.network) {
        console.log(`🌐 Network drift detected: ${state.network} → ${freshNetwork}`);
        setState(prev => ({ 
          ...prev, 
          network: freshNetwork 
        }));
        
        // Emit network change event for hooks to respond
        window.dispatchEvent(new CustomEvent('walletNetworkChanged', { 
          detail: { oldNetwork: state.network, newNetwork: freshNetwork } 
        }));
      }
    } catch (error) {
      console.error('[WalletContext] Network drift check failed:', error);
      // If we can't check network, the connection might be stale
      if (error instanceof Error && error.message.includes('session')) {
        toast.warning('Wallet session expired', {
          description: 'Please reconnect your wallet'
        });
        disconnect();
      }
    }
  }, [state.isConnected, state.network, disconnect]);

  // Start/stop network drift monitoring
  useEffect(() => {
    if (state.isConnected && currentConnectorRef.current) {
      // Check on page focus
      const handleFocus = () => checkNetworkDrift();
      window.addEventListener('focus', handleFocus);
      
      // Check every 30 seconds
      driftCheckInterval.current = setInterval(checkNetworkDrift, 30000);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        if (driftCheckInterval.current) {
          clearInterval(driftCheckInterval.current);
          driftCheckInterval.current = null;
        }
      };
    }
    
    // Return undefined when not connected
    return undefined;
  }, [state.isConnected, checkNetworkDrift]);

  const connect = useCallback(async (connectorId: string) => {
    console.log(`🔄 Connecting to ${connectorId}...`);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const connector = getConnector(connectorId);
      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      // Check if connector is available
      if (!(await connector.isAvailable())) {
        const error: WalletError = {
          connector: connectorId,
          code: 'NOT_INSTALLED',
          message: `${connector.name} is not installed or available`
        };
        throw error;
      }

      // Connect to wallet
      const connection: WalletConnection = await connector.connect();
      currentConnectorRef.current = connector;

      console.log(`✅ Connected to ${connector.name}:`, connection);

      setState({
        isConnected: true,
        address: connection.address,
        network: connection.network,
        connectorId,
        isConnecting: false,
        error: null,
        availableConnectors: state.availableConnectors, // Preserve existing data
      });

      // Store connection for auto-reconnect
      if (typeof window !== 'undefined') {
        localStorage.setItem('wallet_connector_id', connectorId);
      }

    } catch (error: any) {
      console.error(`💥 Failed to connect to ${connectorId}:`, error);
      
      const walletError: WalletError = error.connector ? error : {
        connector: connectorId,
        code: 'CONNECTION_FAILED',
        message: error.message || `Failed to connect to ${connectorId}`
      };

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: walletError,
      }));
    }
  }, [state.availableConnectors]);

  const refreshConnection = useCallback(async () => {
    if (!currentConnectorRef.current || !state.connectorId) return;

    try {
      const [isStillConnected, address, network] = await Promise.all([
        currentConnectorRef.current.isConnected(),
        currentConnectorRef.current.getAddress(),
        currentConnectorRef.current.getNetwork()
      ]);

      if (!isStillConnected || !address) {
        await disconnect();
        return;
      }

      // Update state if anything changed
      if (address !== state.address || network !== state.network) {
        setState(prev => ({
          ...prev,
          address,
          network
        }));
      }
    } catch (error) {
      console.error('[WalletContext] Connection refresh failed:', error);
      toast.error('Failed to refresh wallet connection', {
        description: 'Disconnecting wallet...'
      });
      await disconnect();
    }
  }, [state.connectorId, state.address, state.network, disconnect]);

  // Auto-reconnect on page load
  useEffect(() => {
    const autoReconnect = async () => {
      if (typeof window === 'undefined') return;
      
      const storedConnectorId = localStorage.getItem('wallet_connector_id');
      if (!storedConnectorId) return;

      const connector = getConnector(storedConnectorId);
      if (!connector) return;

      try {
        const [isAvailable, isConnected] = await Promise.all([
          connector.isAvailable(),
          connector.isConnected()
        ]);

        if (isAvailable && isConnected) {
          console.log(`🔄 Auto-reconnecting to ${storedConnectorId}...`);
          await connect(storedConnectorId);
        } else {
          // Clean up stale stored connection
          localStorage.removeItem('wallet_connector_id');
        }
      } catch (error) {
        console.error('[WalletContext] Auto-reconnect failed:', error);
        localStorage.removeItem('wallet_connector_id');
        // Don't show toast for auto-reconnect failures as it might be too intrusive on page load
        // User can manually connect if needed
      }
    };

    // Small delay to let the page settle
    const timeout = setTimeout(autoReconnect, 1000);
    return () => clearTimeout(timeout);
  }, [connect]); // Only run once on mount

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshConnection,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Helper hook for listening to network changes
export function useWalletNetworkListener(callback: (oldNetwork: StellarNetwork, newNetwork: StellarNetwork) => void) {
  useEffect(() => {
    const handleNetworkChange = (event: CustomEvent) => {
      const { oldNetwork, newNetwork } = event.detail;
      callback(oldNetwork, newNetwork);
    };

    window.addEventListener('walletNetworkChanged', handleNetworkChange as EventListener);
    return () => window.removeEventListener('walletNetworkChanged', handleNetworkChange as EventListener);
  }, [callback]);
}