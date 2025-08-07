/**
 * Unit tests for FreighterConnector
 * Tests wallet connection, network detection, and error handling
 */

import { FreighterConnector } from './freighter';
import { WalletErrorCodes } from './types';

// Get the mock helper from the auto-mocked module
const { __freighterMock } = jest.requireMock('@stellar/freighter-api');

describe('FreighterConnector', () => {
  beforeEach(() => {
    __freighterMock.reset();
    // Ensure window.freighter exists for availability tests
    (window as any).freighter = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct id and name', () => {
      expect(FreighterConnector.id).toBe('freighter');
      expect(FreighterConnector.name).toBe('Freighter');
    });
  });

  describe('isAvailable()', () => {
    it('should return true when window.freighter exists', async () => {
      (window as any).freighter = {};
      const available = await FreighterConnector.isAvailable();
      expect(available).toBe(true);
    });

    it('should return false when window.freighter does not exist', async () => {
      delete (window as any).freighter;
      const available = await FreighterConnector.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('isConnected()', () => {
    it('should return true when Freighter is connected', async () => {
      __freighterMock.setConnected(true);
      const connected = await FreighterConnector.isConnected();
      expect(connected).toBe(true);
    });

    it('should return false when Freighter is not connected', async () => {
      __freighterMock.setConnected(false);
      const connected = await FreighterConnector.isConnected();
      expect(connected).toBe(false);
    });

    it('should handle object response from Freighter API', async () => {
      __freighterMock.setConnected({ isConnected: true });
      const connected = await FreighterConnector.isConnected();
      expect(connected).toBe(true);
    });

    it('should return false on API error', async () => {
      __freighterMock.setError('isConnected', new Error('API Error'));
      const connected = await FreighterConnector.isConnected();
      expect(connected).toBe(false);
    });
  });

  describe('getNetwork()', () => {
    it('should return mainnet for PUBLIC network', async () => {
      __freighterMock.setNetwork('PUBLIC');
      const network = await FreighterConnector.getNetwork();
      expect(network).toBe('mainnet');
    });

    it('should return testnet for TESTNET network', async () => {
      __freighterMock.setNetwork('TESTNET');
      const network = await FreighterConnector.getNetwork();
      expect(network).toBe('testnet');
    });

    it('should handle object response from Freighter API', async () => {
      __freighterMock.setNetwork({ network: 'PUBLIC' });
      const network = await FreighterConnector.getNetwork();
      expect(network).toBe('mainnet');
    });

    it('should default to testnet on error', async () => {
      __freighterMock.setError('getNetwork', new Error('Network error'));
      const network = await FreighterConnector.getNetwork();
      expect(network).toBe('testnet');
    });
  });

  describe('getAddress()', () => {
    it('should return null when not connected', async () => {
      __freighterMock.setConnected(false);
      const address = await FreighterConnector.getAddress();
      expect(address).toBeNull();
    });

    it('should return address when connected', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      __freighterMock
        .setConnected(true)
        .setAddress(mockAddress);
      
      const address = await FreighterConnector.getAddress();
      expect(address).toBe(mockAddress);
    });

    it('should handle object response from Freighter API', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      __freighterMock
        .setConnected(true)
        .setAddress({ address: mockAddress });
      
      const address = await FreighterConnector.getAddress();
      expect(address).toBe(mockAddress);
    });

    it('should return null on error', async () => {
      __freighterMock
        .setConnected(true)
        .setError('getAddress', new Error('Address error'));
      
      const address = await FreighterConnector.getAddress();
      expect(address).toBeNull();
    });
  });

  describe('connect()', () => {
    it('should connect successfully when allowed', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('PUBLIC');

      const connection = await FreighterConnector.connect();
      
      expect(connection).toEqual({
        address: mockAddress,
        network: 'mainnet'
      });
    });

    it('should request access when not allowed', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      __freighterMock
        .setAllowed(false)
        .setAddress(mockAddress)
        .setNetwork('TESTNET');

      const connection = await FreighterConnector.connect();
      
      expect(connection).toEqual({
        address: mockAddress,
        network: 'testnet'
      });
    });

    it('should handle requestAccess when isAllowed throws', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      __freighterMock
        .setError('isAllowed', new Error('Permission error'))
        .setAddress(mockAddress)
        .setNetwork('TESTNET');

      const connection = await FreighterConnector.connect();
      
      expect(connection).toEqual({
        address: mockAddress,
        network: 'testnet'
      });
    });

    it('should throw WalletError on user rejection', async () => {
      __freighterMock.simulateUserRejection();
      
      await expect(FreighterConnector.connect()).rejects.toMatchObject({
        connector: 'freighter',
        code: WalletErrorCodes.USER_REJECTED,
        message: expect.stringContaining('User rejected')
      });
    });

    it('should throw WalletError on connection failure', async () => {
      __freighterMock.setError('getAddress', new Error('Connection failed'));
      
      await expect(FreighterConnector.connect()).rejects.toMatchObject({
        connector: 'freighter',
        code: WalletErrorCodes.CONNECTION_FAILED,
        message: expect.stringContaining('Connection failed')
      });
    });
  });

  describe('disconnect()', () => {
    it('should complete without error (no-op)', async () => {
      await expect(FreighterConnector.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete connection flow', async () => {
      const mockAddress = 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC';
      
      // Initially not available
      delete (window as any).freighter;
      expect(await FreighterConnector.isAvailable()).toBe(false);
      
      // Install Freighter
      (window as any).freighter = {};
      expect(await FreighterConnector.isAvailable()).toBe(true);
      
      // Not connected initially
      __freighterMock.setConnected(false);
      expect(await FreighterConnector.isConnected()).toBe(false);
      
      // Connect
      __freighterMock
        .setAllowed(true)
        .setAddress(mockAddress)
        .setNetwork('PUBLIC');
      
      const connection = await FreighterConnector.connect();
      expect(connection.address).toBe(mockAddress);
      expect(connection.network).toBe('mainnet');
      
      // Now connected
      __freighterMock.setConnected(true);
      expect(await FreighterConnector.isConnected()).toBe(true);
      
      // Can get address
      expect(await FreighterConnector.getAddress()).toBe(mockAddress);
      
      // Can get network
      expect(await FreighterConnector.getNetwork()).toBe('mainnet');
    });

    it('should handle network switching', async () => {
      __freighterMock.setNetwork('TESTNET');
      expect(await FreighterConnector.getNetwork()).toBe('testnet');
      
      // Simulate network switch
      __freighterMock.simulateNetworkChange('PUBLIC');
      expect(await FreighterConnector.getNetwork()).toBe('mainnet');
    });
  });
});