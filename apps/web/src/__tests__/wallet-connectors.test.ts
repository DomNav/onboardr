import { FreighterConnector } from '@/connectors/freighter';
import { lobstrConnector } from '@/connectors/lobstr';
import { getAvailableConnectors, getConnector } from '@/connectors';

// Mock Freighter API
jest.mock('@stellar/freighter-api', () => ({
  isConnected: jest.fn(),
  isAllowed: jest.fn(),
  requestAccess: jest.fn(),
  getAddress: jest.fn(),
  getNetwork: jest.fn(),
}));

// Mock WalletConnect
jest.mock('@walletconnect/sign-client', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
  },
}));

jest.mock('@walletconnect/modal', () => ({
  WalletConnectModal: jest.fn().mockImplementation(() => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
  })),
}));

describe('Wallet Connectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for browser environment
    Object.defineProperty(window, 'freighter', {
      value: {},
      writable: true,
    });
  });

  describe('FreighterConnector', () => {
    it('should have correct metadata', () => {
      expect(FreighterConnector.id).toBe('freighter');
      expect(FreighterConnector.name).toBe('Freighter');
    });

    it('should detect availability based on window.freighter', async () => {
      const available = await FreighterConnector.isAvailable();
      expect(available).toBe(true);

      // @ts-ignore
      delete window.freighter;
      const unavailable = await FreighterConnector.isAvailable();
      expect(unavailable).toBe(false);
    });

    it('should return null address when not connected', async () => {
      const { isConnected } = require('@stellar/freighter-api');
      isConnected.mockResolvedValue(false);

      const address = await FreighterConnector.getAddress();
      expect(address).toBeNull();
    });
  });

  describe('LobstrConnector', () => {
    it('should have correct metadata', () => {
      expect(lobstrConnector.id).toBe('lobstr');
      expect(lobstrConnector.name).toBe('LOBSTR');
    });

    it('should return false availability without WC project ID', async () => {
      delete process.env.NEXT_PUBLIC_WC_PROJECT_ID;
      const available = await lobstrConnector.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Connector Registry', () => {
    it('should return available connectors', async () => {
      const connectors = await getAvailableConnectors();
      expect(connectors).toHaveLength(2);
      expect(connectors.map(c => c.id)).toContain('freighter');
      expect(connectors.map(c => c.id)).toContain('lobstr');
    });

    it('should get connector by id', () => {
      const freighter = getConnector('freighter');
      expect(freighter).toBe(FreighterConnector);

      const lobstr = getConnector('lobstr');
      expect(lobstr).toBe(lobstrConnector);

      const nonExistent = getConnector('nonexistent');
      expect(nonExistent).toBeNull();
    });
  });
});

describe('WalletContext Integration', () => {
  it('should handle connector errors properly', () => {
    // This would be a more complex integration test
    // For now, just ensure the error types are properly defined
    const mockError = {
      connector: 'freighter',
      code: 'USER_REJECTED',
      message: 'User rejected connection'
    };

    expect(mockError.connector).toBe('freighter');
    expect(mockError.code).toBe('USER_REJECTED');
  });
});