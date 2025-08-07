/**
 * Unit tests for LobstrConnector
 * Tests WalletConnect integration, session management, and error handling
 */

import { lobstrConnector } from './lobstr';
import { WalletErrorCodes } from './types';

// Get the mock helpers from the auto-mocked modules
const { __signClientMock, __modalMock } = jest.requireMock('../__mocks__/walletconnect');

describe('LobstrConnector', () => {
  beforeEach(() => {
    __signClientMock.reset();
    __modalMock.reset();
    
    // Ensure environment variable is set
    process.env.NEXT_PUBLIC_WC_PROJECT_ID = 'test-project-id';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct id and name', () => {
      expect(lobstrConnector.id).toBe('lobstr');
      expect(lobstrConnector.name).toBe('LOBSTR');
    });
  });

  describe('isAvailable()', () => {
    it('should return true with valid project ID', async () => {
      process.env.NEXT_PUBLIC_WC_PROJECT_ID = 'valid-project-id';
      
      // Give time for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const available = await lobstrConnector.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false without project ID', async () => {
      delete process.env.NEXT_PUBLIC_WC_PROJECT_ID;
      
      // Create new instance to test initialization without project ID
      const { LobstrConnector } = await import('./lobstr');
      const testConnector = new LobstrConnector();
      
      const available = await testConnector.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('isConnected()', () => {
    it('should return false without active session', async () => {
      __signClientMock.clearSessions();
      const connected = await lobstrConnector.isConnected();
      expect(connected).toBe(false);
    });

    it('should return true with active session', async () => {
      __signClientMock.addSession();
      const connected = await lobstrConnector.isConnected();
      expect(connected).toBe(true);
    });

    it('should return false with expired session', async () => {
      __signClientMock.addSession().simulateSessionExpiry();
      const connected = await lobstrConnector.isConnected();
      expect(connected).toBe(false);
    });
  });

  describe('getNetwork()', () => {
    it('should return testnet by default', async () => {
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('testnet');
    });

    it('should return mainnet for pubnet session', async () => {
      __signClientMock.simulateNetworkChange('mainnet');
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('mainnet');
    });

    it('should return testnet for testnet session', async () => {
      __signClientMock.simulateNetworkChange('testnet');
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('testnet');
    });
  });

  describe('getAddress()', () => {
    it('should return null without session', async () => {
      __signClientMock.clearSessions();
      const address = await lobstrConnector.getAddress();
      expect(address).toBeNull();
    });

    it('should return address from session', async () => {
      __signClientMock.addSession();
      const address = await lobstrConnector.getAddress();
      expect(address).toBe('GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC');
    });
  });

  describe('connect()', () => {
    it('should connect successfully with new session', async () => {
      __signClientMock
        .clearSessions()
        .setConnectSuccess(true);

      const connectionPromise = lobstrConnector.connect();
      
      // Verify modal was opened
      expect(__modalMock.openModal).toHaveBeenCalledWith({ 
        uri: 'wc:mock-uri@2?relay-protocol=irn' 
      });

      const connection = await connectionPromise;
      
      expect(connection).toEqual({
        address: 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
        network: 'testnet'
      });
      
      // Verify modal was closed after connection
      expect(__modalMock.closeModal).toHaveBeenCalled();
    });

    it('should return existing session if already connected', async () => {
      __signClientMock.addSession();
      
      const connection = await lobstrConnector.connect();
      
      expect(connection).toEqual({
        address: 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
        network: 'testnet'
      });
      
      // Modal should not be opened for existing session
      expect(__modalMock.openModal).not.toHaveBeenCalled();
    });

    it('should handle user rejection', async () => {
      __signClientMock
        .clearSessions()
        .setConnectSuccess(false);

      await expect(lobstrConnector.connect()).rejects.toMatchObject({
        connector: 'lobstr',
        code: WalletErrorCodes.USER_REJECTED,
        message: expect.stringContaining('User rejected')
      });
      
      // Modal should be closed on error
      expect(__modalMock.closeModal).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      // Simulate client not being initialized
      const connector = new (await import('./lobstr')).LobstrConnector();
      
      await expect(connector.connect()).rejects.toMatchObject({
        connector: 'lobstr',
        code: WalletErrorCodes.CONNECTION_FAILED,
        message: expect.stringContaining('WalletConnect not initialized')
      });
    });
  });

  describe('disconnect()', () => {
    it('should disconnect active session', async () => {
      __signClientMock.addSession();
      
      await lobstrConnector.disconnect();
      
      // Should clear the session
      const connected = await lobstrConnector.isConnected();
      expect(connected).toBe(false);
    });

    it('should handle disconnect without session', async () => {
      __signClientMock.clearSessions();
      
      await expect(lobstrConnector.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('signTx()', () => {
    it('should sign transaction successfully', async () => {
      __signClientMock
        .addSession()
        .setRequestSuccess(true);

      const mockXdr = 'AAAAAgAAAACExample+XDR+Here==';
      const signedXdr = await lobstrConnector.signTx!(mockXdr);
      
      expect(signedXdr).toBe('AAAAAgAAAACExample+Signed+Transaction+XDR+Here==');
    });

    it('should handle signing rejection', async () => {
      __signClientMock
        .addSession()
        .setRequestSuccess(false);

      const mockXdr = 'AAAAAgAAAACExample+XDR+Here==';
      
      await expect(lobstrConnector.signTx!(mockXdr)).rejects.toMatchObject({
        connector: 'lobstr',
        code: WalletErrorCodes.USER_REJECTED,
        message: expect.stringContaining('User rejected')
      });
    });

    it('should throw error when not connected', async () => {
      __signClientMock.clearSessions();
      
      const mockXdr = 'AAAAAgAAAACExample+XDR+Here==';
      
      await expect(lobstrConnector.signTx!(mockXdr)).rejects.toThrow('LOBSTR not connected');
    });
  });

  describe('Session management', () => {
    it('should restore existing sessions on initialization', async () => {
      // Add session before creating new connector
      __signClientMock.addSession();
      
      const { LobstrConnector } = await import('./lobstr');
      const connector = new LobstrConnector();
      
      // Give time for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const connected = await connector.isConnected();
      expect(connected).toBe(true);
    });

    it('should handle session deletion events', async () => {
      __signClientMock.addSession();
      
      // Initially connected
      expect(await lobstrConnector.isConnected()).toBe(true);
      
      // Simulate session deletion
      __signClientMock.simulateSessionExpiry();
      
      // Give time for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(await lobstrConnector.isConnected()).toBe(false);
    });
  });

  describe('Network detection', () => {
    it('should parse mainnet from session accounts', async () => {
      __signClientMock.setMockSession({
        namespaces: {
          stellar: {
            accounts: ['stellar:pubnet:GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC'],
            methods: ['stellar_signTransaction'],
            events: []
          }
        }
      }).addSession();
      
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('mainnet');
    });

    it('should parse testnet from session accounts', async () => {
      __signClientMock.setMockSession({
        namespaces: {
          stellar: {
            accounts: ['stellar:testnet:GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC'],
            methods: ['stellar_signTransaction'],
            events: []
          }
        }
      }).addSession();
      
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('testnet');
    });

    it('should handle malformed session data gracefully', async () => {
      __signClientMock.setMockSession({
        namespaces: {
          stellar: {
            accounts: ['invalid-account-format'],
            methods: ['stellar_signTransaction'],
            events: []
          }
        }
      }).addSession();
      
      // Should default to testnet for malformed data
      const network = await lobstrConnector.getNetwork();
      expect(network).toBe('testnet');
    });
  });
});