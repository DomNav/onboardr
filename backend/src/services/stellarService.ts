import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  Transaction,
  SorobanRpc,
} from '@stellar/stellar-sdk';
import {
  WalletConnection,
  TradeRequest,
  PreparedTrade,
  TradeSubmission,
  TradeResult,
} from '../types/stellar';

// Stellar testnet configuration
const TESTNET_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_TESTNET_URL = 'https://soroban-testnet.stellar.org:443';
const NETWORK_PASSPHRASE = Networks.TESTNET;

export class StellarService {
  private horizonServer: Horizon.Server;
  private sorobanServer: SorobanRpc.Server;
  private pendingTrades: Map<string, PreparedTrade> = new Map();

  constructor() {
    this.horizonServer = new Horizon.Server(TESTNET_URL);
    this.sorobanServer = new SorobanRpc.Server(SOROBAN_TESTNET_URL);
  }

  /**
   * Validate wallet connection and get account info
   */
  async validateWalletConnection(connection: WalletConnection): Promise<{
    valid: boolean;
    balance?: string;
    error?: string;
  }> {
    try {
      // Validate public key format
      Keypair.fromPublicKey(connection.publicKey);

      // Check if account exists on testnet
      const account = await this.horizonServer.loadAccount(connection.publicKey);
      const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0';

      return {
        valid: true,
        balance: xlmBalance,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Prepare a trade transaction (build XDR without signing)
   */
  async prepareTrade(request: TradeRequest): Promise<PreparedTrade> {
    try {
      // TODO: Integrate with actual Soroswap contract once deployed
      // For now, create a mock trade preparation
      
      const sourceAccount = await this.horizonServer.loadAccount(request.userPublicKey);
      
      // Generate unique trade ID
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock price calculation (replace with actual Soroswap contract call)
      const mockOutput = (parseFloat(request.amount) * 0.98).toFixed(7); // 2% mock slippage
      const mockPriceImpact = 0.15; // 0.15% mock price impact
      
      // Create a placeholder transaction for structure
      // This will be replaced with actual Soroswap contract invocation
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100000', // 0.01 XLM base fee
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          // Placeholder operation - will be replaced with contract invocation
          Operation.manageBuyOffer({
            selling: Asset.native(),
            buying: new Asset(request.toAsset.code, request.toAsset.issuer || Keypair.random().publicKey()),
            buyAmount: mockOutput,
            price: '1.0',
          })
        )
        .setTimeout(300) // 5 minute timeout
        .build();

      const preparedTrade: PreparedTrade = {
        id: tradeId,
        xdr: transaction.toXDR(),
        sourceAccount: request.userPublicKey,
        fee: '100000',
        estimatedOutput: mockOutput,
        priceImpact: mockPriceImpact,
        route: [
          { asset: request.fromAsset, amount: request.amount },
          { asset: request.toAsset, amount: mockOutput },
        ],
        expiresAt: Date.now() + 300000, // 5 minutes from now
      };

      // Store prepared trade temporarily
      this.pendingTrades.set(tradeId, preparedTrade);

      // Clean up expired trades
      this.cleanupExpiredTrades();

      return preparedTrade;
    } catch (error) {
      throw new Error(`Failed to prepare trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit signed trade transaction
   */
  async submitTrade(submission: TradeSubmission): Promise<TradeResult> {
    try {
      // Get prepared trade
      const preparedTrade = this.pendingTrades.get(submission.tradeId);
      if (!preparedTrade) {
        return {
          success: false,
          error: 'Trade not found or expired',
        };
      }

      // Check if trade has expired
      if (Date.now() > preparedTrade.expiresAt) {
        this.pendingTrades.delete(submission.tradeId);
        return {
          success: false,
          error: 'Trade has expired',
        };
      }

      // Parse and submit the signed transaction
      const transaction = new Transaction(submission.signedXdr, NETWORK_PASSPHRASE);
      const result = await this.horizonServer.submitTransaction(transaction);

      // Clean up processed trade
      this.pendingTrades.delete(submission.tradeId);

      if (result.successful) {
        return {
          success: true,
          transactionHash: result.hash,
          actualOutput: preparedTrade.estimatedOutput, // In real implementation, parse from transaction result
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get trade status by ID
   */
  getPendingTrade(tradeId: string): PreparedTrade | null {
    return this.pendingTrades.get(tradeId) || null;
  }

  /**
   * Clean up expired trades from memory
   */
  private cleanupExpiredTrades(): void {
    const now = Date.now();
    for (const [id, trade] of this.pendingTrades.entries()) {
      if (now > trade.expiresAt) {
        this.pendingTrades.delete(id);
      }
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      horizonUrl: TESTNET_URL,
      sorobanUrl: SOROBAN_TESTNET_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      network: 'testnet',
    };
  }
}