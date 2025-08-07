import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  requestAccess,
  getAddress,
  getNetwork as freighterGetNetwork,
  /* signTransaction as freighterSignTransaction */
} from '@stellar/freighter-api';

import { WalletConnector, StellarNetwork, WalletConnection, WalletErrorCodes, WalletError } from './types';

/**
 * Freighter browser-extension wallet connector
 */
export const FreighterConnector: WalletConnector = {
  id: 'freighter',
  name: 'Freighter',

  async isAvailable() {
    if (typeof window === 'undefined') return false;
    
    // Freighter may not expose window.freighter directly
    // Instead, check if the Freighter API functions are available
    try {
      // Try to import and check if Freighter is actually available
      const connected = await freighterIsConnected();
      // If we can check connection status, Freighter is available
      return true;
    } catch (error) {
      // If the API throws, Freighter is not available
      return false;
    }
  },

  async isConnected() {
    try {
      const result = await freighterIsConnected();
      return typeof result === 'boolean' ? result : result.isConnected;
    } catch (error) {
      console.warn('[FreighterConnector] Error checking connection status:', error);
      // Return false but log the error for debugging
      return false;
    }
  },

  async connect(): Promise<WalletConnection> {
    try {
      // Ensure permission is granted
      try {
        const allowed = await freighterIsAllowed();
        if (!allowed) {
          await requestAccess();
        }
      } catch {
        // Some versions of Freighter throw if permission not yet granted
        await requestAccess();
      }

      // Get address and network in parallel
      const [addressResult, network] = await Promise.all([
        getAddress(),
        this.getNetwork()
      ]);

      const address = typeof addressResult === 'string' ? addressResult : addressResult.address;
      
      return { address, network };
    } catch (error: any) {
      const walletError: WalletError = {
        connector: 'freighter',
        code: error.message?.includes('User rejected') ? WalletErrorCodes.USER_REJECTED : WalletErrorCodes.CONNECTION_FAILED,
        message: error.message || 'Failed to connect to Freighter'
      };
      throw walletError;
    }
  },

  async disconnect() {
    // Freighter doesn’t currently expose a programmatic disconnect API.
    // Leaving this as a no-op so the interface contract is satisfied.
    return;
  },

  async getNetwork(): Promise<StellarNetwork> {
    try {
      const result = await freighterGetNetwork();
      const networkString = typeof result === 'string' ? result : result.network;
      return networkString === 'PUBLIC' ? 'mainnet' : 'testnet';
    } catch (error) {
      console.warn('[FreighterConnector] Error getting network, defaulting to testnet:', error);
      // Default fallback if Freighter not available yet
      return 'testnet';
    }
  },

  async getAddress(): Promise<string | null> {
    try {
      if (!(await this.isConnected())) {
        return null;
      }
      const addressResult = await getAddress();
      return typeof addressResult === 'string' ? addressResult : addressResult.address;
    } catch (error) {
      console.warn('[FreighterConnector] Error getting address:', error);
      return null;
    }
  },

  /*
  async signTx(xdr: string) {
    // Uncomment when we need Freighter signing from the connector layer
    const signed = await freighterSignTransaction(xdr, {
      network: (await this.getNetwork()) === 'mainnet' ? 'PUBLIC' : 'TESTNET',
    });
    return signed;
  },
  */
};
