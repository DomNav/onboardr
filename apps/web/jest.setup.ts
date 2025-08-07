/**
 * Jest setup file for wallet connector testing
 * Configures automatic mocking of wallet APIs
 */

import '@testing-library/jest-dom';

// Mock window.freighter for Freighter availability tests
Object.defineProperty(window, 'freighter', {
  value: {},
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock environment variables
process.env.NEXT_PUBLIC_WC_PROJECT_ID = 'test-project-id';

// Auto-mock Freighter API
jest.mock('@stellar/freighter-api', () => {
  const mockModule = jest.requireActual('../src/connectors/__mocks__/freighter');
  return mockModule;
});

// Auto-mock WalletConnect modules
jest.mock('@walletconnect/sign-client', () => {
  const mockModule = jest.requireActual('../src/connectors/__mocks__/walletconnect');
  return mockModule.default;
});

jest.mock('@walletconnect/modal', () => {
  const mockModule = jest.requireActual('../src/connectors/__mocks__/walletconnect');
  return { WalletConnectModal: mockModule.WalletConnectModal };
});

// Mock CustomEvent for older environments
if (typeof window !== 'undefined' && !window.CustomEvent) {
  (global as any).CustomEvent = class CustomEvent extends Event {
    detail: any;
    constructor(type: string, params: { detail?: any } = {}) {
      super(type);
      this.detail = params.detail;
    }
  };
}

// Mock fetch for API calls
global.fetch = jest.fn();

// Console methods - suppress in tests unless needed
const originalConsole = { ...console };
global.console = {
  ...console,
  // Suppress logs in tests, but allow error/warn for debugging
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: originalConsole.error,
  warn: originalConsole.warn,
};

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  
  // Reset Freighter mock
  const { __freighterMock } = jest.requireMock('@stellar/freighter-api');
  __freighterMock.reset();
  
  // Reset WalletConnect mocks
  const { __resetAllMocks } = jest.requireMock('../src/connectors/__mocks__/walletconnect');
  __resetAllMocks();
  
  // Reset window.freighter
  window.freighter = {};
});

// Helper to restore console for specific tests
(global as any).restoreConsole = () => {
  global.console = originalConsole;
};

// Helper to suppress all console output for noisy tests
(global as any).suppressConsole = () => {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
};