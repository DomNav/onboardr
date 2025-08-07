/**
 * Mock implementations for @walletconnect/sign-client and @walletconnect/modal
 * Provides controllable responses for testing LOBSTR connector functionality
 */

interface MockSession {
  topic: string;
  namespaces: {
    stellar: {
      accounts: string[];
      methods: string[];
      events: string[];
    };
  };
  expiry: number;
}

interface MockApproval {
  acknowledged: () => Promise<MockSession>;
}

interface MockConnectResult {
  uri?: string;
  approval: () => Promise<MockSession>;
}

class SignClientMock {
  private sessions: MockSession[] = [];
  private shouldConnectSucceed = true;
  private shouldRequestSucceed = true;
  private connectUri = 'wc:mock-uri@2?relay-protocol=irn';
  private mockSession: MockSession = {
    topic: 'mock-topic-123',
    namespaces: {
      stellar: {
        accounts: ['stellar:testnet:GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC'],
        methods: ['stellar_signTransaction', 'stellar_signAndSendTransaction'],
        events: []
      }
    },
    expiry: Date.now() + 86400000 // 24 hours from now
  };

  public session = {
    getAll: jest.fn(() => this.sessions)
  };

  // Mock event handling
  private eventHandlers: { [event: string]: Function[] } = {};

  on(event: string, handler: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  emit(event: string, data?: any) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  async connect(params: any): Promise<MockConnectResult> {
    if (!this.shouldConnectSucceed) {
      throw new Error('User rejected connection');
    }

    return {
      uri: this.connectUri,
      approval: () => {
        return new Promise((resolve) => {
          // Simulate async approval
          setTimeout(() => {
            this.sessions = [this.mockSession];
            resolve(this.mockSession);
          }, 100);
        });
      }
    };
  }

  async disconnect(params: { topic: string; reason: any }): Promise<void> {
    this.sessions = this.sessions.filter(s => s.topic !== params.topic);
  }

  async request(params: { 
    topic: string; 
    chainId: string; 
    request: { method: string; params: any } 
  }): Promise<string> {
    if (!this.shouldRequestSucceed) {
      throw new Error('User rejected signing request');
    }

    // Mock signed transaction XDR
    return 'AAAAAgAAAACExample+Signed+Transaction+XDR+Here==';
  }

  // Helper methods for controlling mock behavior
  setConnectSuccess(success: boolean) {
    this.shouldConnectSucceed = success;
    return this;
  }

  setRequestSuccess(success: boolean) {
    this.shouldRequestSucceed = success;
    return this;
  }

  setConnectUri(uri: string) {
    this.connectUri = uri;
    return this;
  }

  setMockSession(session: Partial<MockSession>) {
    this.mockSession = { ...this.mockSession, ...session };
    return this;
  }

  addSession(session?: Partial<MockSession>) {
    const fullSession = { ...this.mockSession, ...session };
    this.sessions.push(fullSession);
    return this;
  }

  clearSessions() {
    this.sessions = [];
    return this;
  }

  simulateSessionExpiry() {
    this.sessions.forEach(session => {
      session.expiry = Date.now() - 1000; // Expired 1 second ago
    });
    this.emit('session_delete', { topic: this.mockSession.topic });
    return this;
  }

  simulateNetworkChange(network: 'mainnet' | 'testnet') {
    const networkString = network === 'mainnet' ? 'pubnet' : 'testnet';
    this.mockSession.namespaces.stellar.accounts = [
      `stellar:${networkString}:GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC`
    ];
    this.sessions = [this.mockSession];
    return this;
  }

  reset() {
    this.sessions = [];
    this.shouldConnectSucceed = true;
    this.shouldRequestSucceed = true;
    this.connectUri = 'wc:mock-uri@2?relay-protocol=irn';
    this.eventHandlers = {};
    return this;
  }
}

class WalletConnectModalMock {
  private isOpen = false;

  openModal = jest.fn((params: { uri: string }) => {
    this.isOpen = true;
  });

  closeModal = jest.fn(() => {
    this.isOpen = false;
  });

  getIsOpen() {
    return this.isOpen;
  }

  simulateUserCancellation() {
    this.closeModal();
    // Simulate user closing the modal without connecting
    setTimeout(() => {
      throw new Error('User cancelled connection');
    }, 50);
  }

  reset() {
    this.isOpen = false;
    this.openModal.mockClear();
    this.closeModal.mockClear();
    return this;
  }
}

// Create singleton instances
const signClientMock = new SignClientMock();
const modalMock = new WalletConnectModalMock();

// Mock the SignClient default export and init method
const SignClient = {
  init: jest.fn().mockResolvedValue(signClientMock)
};

// Mock the WalletConnectModal class
const WalletConnectModal = jest.fn().mockImplementation(() => modalMock);

// Export mocks
export default SignClient;
export { WalletConnectModal };

// Export helpers for tests
export const __signClientMock = signClientMock;
export const __modalMock = modalMock;

// Reset all mocks helper
export const __resetAllMocks = () => {
  signClientMock.reset();
  modalMock.reset();
  SignClient.init.mockClear();
  WalletConnectModal.mockClear();
};