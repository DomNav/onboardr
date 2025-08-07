import SignClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { 
  WalletConnector, 
  StellarNetwork, 
  WalletConnection, 
  WalletError, 
  WalletErrorCodes 
} from './types';

/**
 * LOBSTR wallet connector using WalletConnect v2
 */
export class LobstrConnector implements WalletConnector {
  readonly id = 'lobstr';
  readonly name = 'LOBSTR';
  
  private client: SignClient | null = null;
  private modal: WalletConnectModal | null = null;
  private session: any = null;
  private initializationError: Error | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      if (typeof window === 'undefined') return;

      const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
      if (!projectId) {
        console.warn('NEXT_PUBLIC_WC_PROJECT_ID not set - LOBSTR connector will not work');
        return;
      }

      this.client = await SignClient.init({
        projectId,
        metadata: {
          name: 'Onboardr',
          description: 'DeFi Trading Platform for Stellar',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      });

      this.modal = new WalletConnectModal({
        projectId,
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '9999'
        }
      });

      // Restore existing sessions
      const sessions = this.client.session.getAll();
      if (sessions.length > 0) {
        this.session = sessions[0]; // Use the first active session
      }

      // Listen for session events
      this.client.on('session_delete', () => {
        this.session = null;
      });

    } catch (error) {
      console.error('[LobstrConnector] Failed to initialize WalletConnect client:', error);
      this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
      // Emit event for error tracking if available
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('wallet-connector-error', { 
          detail: { 
            connector: 'lobstr', 
            error: this.initializationError.message 
          } 
        }));
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    if (this.initializationError) {
      console.warn('[LobstrConnector] Initialization failed:', this.initializationError.message);
    }
    return this.client !== null && this.initializationError === null;
  }

  async isConnected(): Promise<boolean> {
    return this.session !== null && !this.session.expiry || this.session.expiry > Date.now();
  }

  async connect(): Promise<WalletConnection> {
    try {
      if (!this.client || !this.modal) {
        throw new Error('WalletConnect not initialized');
      }

      // If already connected, return current session info
      if (await this.isConnected()) {
        const address = this.getAddressFromSession();
        const network = this.getNetworkFromSession();
        return { address, network };
      }

      // Define Stellar namespace requirements
      const requiredNamespaces = {
        stellar: {
          methods: ['stellar_signAndSendTransaction', 'stellar_signTransaction'],
          events: [],
          chains: ['stellar:pubnet', 'stellar:testnet']
        }
      };

      // Connect with modal
      const { uri, approval } = await this.client.connect({
        requiredNamespaces
      });

      if (uri) {
        this.modal.openModal({ uri });
      }

      // Wait for approval
      this.session = await approval();
      this.modal.closeModal();

      const address = this.getAddressFromSession();
      const network = this.getNetworkFromSession();

      return { address, network };

    } catch (error: any) {
      this.modal?.closeModal();
      
      const walletError: WalletError = {
        connector: 'lobstr',
        code: error.message?.includes('User rejected') || error.message?.includes('cancelled') 
          ? WalletErrorCodes.USER_REJECTED 
          : WalletErrorCodes.CONNECTION_FAILED,
        message: error.message || 'Failed to connect to LOBSTR via WalletConnect'
      };
      throw walletError;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.session) {
        await this.client.disconnect({
          topic: this.session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected'
          }
        });
      }
      this.session = null;
    } catch (error) {
      console.error('[LobstrConnector] Error disconnecting from LOBSTR:', error);
      // Clear session even if disconnect fails
      this.session = null;
      // Still throw to surface the error to the caller
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to disconnect from LOBSTR');
    }
  }

  async getNetwork(): Promise<StellarNetwork> {
    if (!this.session) {
      return 'testnet'; // Default fallback
    }
    return this.getNetworkFromSession();
  }

  async getAddress(): Promise<string | null> {
    if (!this.session) {
      return null;
    }
    try {
      return this.getAddressFromSession();
    } catch (error) {
      console.warn('[LobstrConnector] Error getting address from session:', error);
      return null;
    }
  }

  async signTx(xdr: string): Promise<string> {
    if (!this.client || !this.session) {
      throw new Error('LOBSTR not connected');
    }

    try {
      const network = await this.getNetwork();
      const chainId = `stellar:${network === 'mainnet' ? 'pubnet' : 'testnet'}`;

      const result = await this.client.request({
        topic: this.session.topic,
        chainId,
        request: {
          method: 'stellar_signTransaction',
          params: { xdr }
        }
      });

      return result as string;
    } catch (error: any) {
      const walletError: WalletError = {
        connector: 'lobstr',
        code: error.message?.includes('User rejected') 
          ? WalletErrorCodes.USER_REJECTED 
          : WalletErrorCodes.SIGN_FAILED,
        message: error.message || 'Failed to sign transaction'
      };
      throw walletError;
    }
  }

  private getAddressFromSession(): string {
    if (!this.session?.namespaces?.stellar?.accounts?.length) {
      throw new Error('No Stellar accounts in session');
    }
    
    // Parse account string: "stellar:pubnet:GCXXXXXXX" -> "GCXXXXXXX"  
    const accountString = this.session.namespaces.stellar.accounts[0];
    const parts = accountString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid account format in session');
    }
    
    return parts[2]; // The actual Stellar address
  }

  private getNetworkFromSession(): StellarNetwork {
    if (!this.session?.namespaces?.stellar?.accounts?.length) {
      return 'testnet'; // Default fallback
    }
    
    // Parse account string: "stellar:pubnet:GCXXXXXXX" -> "pubnet"
    const accountString = this.session.namespaces.stellar.accounts[0];
    const parts = accountString.split(':');
    if (parts.length !== 3) {
      return 'testnet'; // Default fallback
    }
    
    const chain = parts[1];
    return chain === 'pubnet' ? 'mainnet' : 'testnet';
  }
}

// Export singleton instance
export const lobstrConnector = new LobstrConnector();