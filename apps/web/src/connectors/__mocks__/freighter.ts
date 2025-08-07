/**
 * Mock implementation for @stellar/freighter-api
 * Provides controllable responses for testing wallet connector functionality
 */

type MockResponse<T> = T | Promise<T> | Error;

interface MockState {
  isConnected: MockResponse<boolean>;
  isAllowed: MockResponse<boolean>;
  getAddress: MockResponse<string | { address: string }>;
  getNetwork: MockResponse<string | { network: string }>;
  requestAccess: MockResponse<void>;
}

class FreighterMock {
  private state: MockState = {
    isConnected: false,
    isAllowed: false,
    getAddress: 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
    getNetwork: 'TESTNET',
    requestAccess: undefined as any,
  };

  // Helper methods to control mock responses
  setConnected(connected: boolean) {
    this.state.isConnected = connected;
    return this;
  }

  setAllowed(allowed: boolean) {
    this.state.isAllowed = allowed;
    return this;
  }

  setAddress(address: string | { address: string }) {
    this.state.getAddress = address;
    return this;
  }

  setNetwork(network: 'PUBLIC' | 'TESTNET' | { network: 'PUBLIC' | 'TESTNET' }) {
    this.state.getNetwork = network;
    return this;
  }

  setError(method: keyof MockState, error: Error) {
    this.state[method] = error;
    return this;
  }

  setRequestAccessError(error: Error) {
    this.state.requestAccess = error;
    return this;
  }

  reset() {
    this.state = {
      isConnected: false,
      isAllowed: false,
      getAddress: 'GCTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABC',
      getNetwork: 'TESTNET',
      requestAccess: undefined as any,
    };
    return this;
  }

  // Mock implementations
  async isConnected(): Promise<boolean> {
    const response = this.state.isConnected;
    if (response instanceof Error) throw response;
    return Promise.resolve(response);
  }

  async isAllowed(): Promise<boolean> {
    const response = this.state.isAllowed;
    if (response instanceof Error) throw response;
    return Promise.resolve(response);
  }

  async getAddress(): Promise<string | { address: string }> {
    const response = this.state.getAddress;
    if (response instanceof Error) throw response;
    return Promise.resolve(response);
  }

  async getNetwork(): Promise<string | { network: string }> {
    const response = this.state.getNetwork;
    if (response instanceof Error) throw response;
    return Promise.resolve(response);
  }

  async requestAccess(): Promise<void> {
    const response = this.state.requestAccess;
    if (response instanceof Error) throw response;
    return Promise.resolve();
  }

  // Simulate network change for drift testing
  simulateNetworkChange(newNetwork: 'PUBLIC' | 'TESTNET') {
    this.setNetwork(newNetwork);
    // Simulate the event that would trigger network drift detection
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('freighter-network-changed', {
          detail: { network: newNetwork }
        }));
      }, 100);
    }
  }

  // Simulate user rejection
  simulateUserRejection() {
    return this.setError('requestAccess', new Error('User rejected the request'));
  }

  // Simulate wallet not installed
  simulateNotInstalled() {
    return this
      .setError('isConnected', new Error('Freighter not installed'))
      .setError('isAllowed', new Error('Freighter not installed'))
      .setError('getAddress', new Error('Freighter not installed'))
      .setError('getNetwork', new Error('Freighter not installed'));
  }
}

// Create singleton instance
const freighterMock = new FreighterMock();

// Export mock functions that Jest will use
export const isConnected = jest.fn().mockImplementation(() => freighterMock.isConnected());
export const isAllowed = jest.fn().mockImplementation(() => freighterMock.isAllowed());
export const getAddress = jest.fn().mockImplementation(() => freighterMock.getAddress());
export const getNetwork = jest.fn().mockImplementation(() => freighterMock.getNetwork());
export const requestAccess = jest.fn().mockImplementation(() => freighterMock.requestAccess());

// Export helper for tests to control mock behavior
export const __freighterMock = freighterMock;

// Export default for ES6 imports
export default {
  isConnected,
  isAllowed,
  getAddress,
  getNetwork,
  requestAccess,
  __freighterMock: freighterMock,
};