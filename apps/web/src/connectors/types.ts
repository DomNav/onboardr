export type StellarNetwork = 'mainnet' | 'testnet';

/**
 * Result of successful wallet connection
 */
export interface WalletConnection {
  address: string;
  network: StellarNetwork;
}

/**
 * Wallet error with connector context
 */
export interface WalletError {
  connector: string;
  code: string;
  message: string;
}

/**
 * Connector metadata for UI display
 */
export interface ConnectorMeta {
  id: string;
  name: string;
  installed: boolean;
}

/**
 * Standard error codes for consistent error handling
 */
export const WalletErrorCodes = {
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',
  WC_SESSION_EXPIRED: 'WC_SESSION_EXPIRED',
  NOT_INSTALLED: 'NOT_INSTALLED',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  SIGN_FAILED: 'SIGN_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type WalletErrorCode = keyof typeof WalletErrorCodes;

/**
 * Common interface every wallet connector must implement so that
 * the rest of the application can work with any supported wallet
 * (Freighter, LOBSTR, Ledger, etc.) via a single abstraction layer.
 */
export interface WalletConnector {
  /** Unique identifier for the connector (e.g. "freighter", "lobstr") */
  readonly id: string;
  /** Human-readable name to display in the UI */
  readonly name: string;

  /** Detect whether the wallet provider is present / reachable */
  isAvailable(): Promise<boolean>;

  /** Return true if a session is already established */
  isConnected(): Promise<boolean>;

  /** Prompt user to connect and return address + network */
  connect(): Promise<WalletConnection>;

  /** Disconnect the wallet (no-op if the provider doesn't support it) */
  disconnect(): Promise<void>;

  /** Return the current network selected inside the wallet */
  getNetwork(): Promise<StellarNetwork>;

  /** Get current address if connected */
  getAddress(): Promise<string | null>;

  /** Optional helper to sign a transaction and return signed XDR */
  signTx?(xdr: string): Promise<string>;
}
