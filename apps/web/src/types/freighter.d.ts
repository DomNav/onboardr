// Type definitions for Freighter wallet integration
export interface FreighterApi {
  isConnected(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signAndSubmitXDR(
    xdr: string, 
    opts?: { 
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<{
    hash: string;
    status: string;
    errorMessage?: string;
  }>;
  signXDR(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<string>;
  signTransaction(
    xdr: string,
    opts?: {
      network?: string;
      networkPassphrase?: string;
      accountToSign?: string;
    }
  ): Promise<string>;
}

declare global {
  interface Window {
    freighterApi: FreighterApi;
  }
}

export {};