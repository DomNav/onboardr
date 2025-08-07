import * as StellarSDK from '@stellar/stellar-sdk';

// Network configuration
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://soroban-rpc.mainnet.stellar.org'
  : 'https://soroban-rpc.testnet.stellar.org/';

const HORIZON_URL = NETWORK === 'mainnet'
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org';

/**
 * Submit a signed transaction to the Stellar network
 * @param signedXdr - Signed transaction XDR
 * @returns Transaction hash
 */
export async function submitTransaction(signedXdr: string): Promise<string> {
  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const transaction = StellarSDK.TransactionBuilder.fromXDR(
      signedXdr, 
      NETWORK === 'mainnet' ? StellarSDK.Networks.PUBLIC : StellarSDK.Networks.TESTNET
    );
    
    const result = await server.sendTransaction(transaction);
    
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${result.errorResult || 'Unknown error'}`);
    }
    
    console.log(`Transaction submitted: ${result.hash}`);
    return result.hash;
    
  } catch (error) {
    console.error('Failed to submit transaction:', error);
    throw new Error(`Transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get transaction status from Horizon
 * @param hash - Transaction hash
 * @returns Transaction status info
 */
export async function getTxStatus(hash: string): Promise<{
  successful: boolean;
  pending: boolean;
  error?: string;
  ledger?: number;
}> {
  try {
    const horizonServer = new StellarSDK.Horizon.Server(HORIZON_URL);
    const txResponse = await horizonServer.transactions().transaction(hash).call();
    
    return {
      successful: txResponse.successful,
      pending: false,
      ledger: parseInt(String(txResponse.ledger_attr || '0'))
    };
    
  } catch (error: any) {
    // If transaction not found, it might still be pending
    if (error.response?.status === 404) {
      return {
        successful: false,
        pending: true
      };
    }
    
    console.error('Error checking transaction status:', error);
    return {
      successful: false,
      pending: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get Stellar Expert URL for transaction
 * @param hash - Transaction hash
 * @returns Explorer URL
 */
export function getExplorerUrl(hash: string): string {
  const network = NETWORK === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

/**
 * Get network info
 */
export function getNetworkInfo() {
  return {
    network: NETWORK,
    rpcUrl: RPC_URL,
    horizonUrl: HORIZON_URL,
    passphrase: NETWORK === 'mainnet' ? StellarSDK.Networks.PUBLIC : StellarSDK.Networks.TESTNET
  };
}

// TODO: Add support for fee-bump transactions
// TODO: Add retry logic for failed submissions  
// TODO: Add transaction result parsing for better error messages