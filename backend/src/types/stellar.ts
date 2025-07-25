// Stellar SDK types and interfaces for wallet and trade operations

export interface WalletConnection {
  publicKey: string;
  walletType: 'freighter' | 'albedo';
  networkUrl: string;
  networkPassphrase: string;
}

export interface TradeRequest {
  fromAsset: {
    code: string;
    issuer?: string;
  };
  toAsset: {
    code: string;
    issuer?: string;
  };
  amount: string;
  slippage: number;
  userPublicKey: string;
}

export interface PreparedTrade {
  id: string;
  xdr: string;
  sourceAccount: string;
  fee: string;
  estimatedOutput: string;
  priceImpact: number;
  route: Array<{
    asset: { code: string; issuer?: string };
    amount: string;
  }>;
  expiresAt: number;
}

export interface TradeSubmission {
  tradeId: string;
  signedXdr: string;
  userPublicKey: string;
}

export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  actualOutput?: string;
}