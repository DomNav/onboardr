import { 
  Keypair, 
  Networks, 
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Account,
  AuthFlag
} from 'stellar-sdk';
import { validateSacNftEnvironment } from '../envValidation';

const { Server } = Horizon;

export interface MintSacNftResult {
  assetCode: string;
  issuer: string;
  txHash: string;
}

export async function mintSacNft(network: 'mainnet' | 'testnet' = 'testnet'): Promise<MintSacNftResult> {
  // In development mode, return mock result if SPONSOR_SECRET_KEY is unset
  if (process.env.NODE_ENV !== 'production' && !process.env.SPONSOR_SECRET_KEY) {
    console.warn('Development mode: returning mock SAC NFT result due to missing SPONSOR_SECRET_KEY');
    return {
      assetCode: 'PRFDEV',
      issuer: 'GD4I5QX5ZJHBNMGQMG42XHWI2MHKYAQJUPGFMXWHMH4JHVWV7WQXTDEV',
      txHash: '0xDEVELOPMENT_MODE_MOCK_TRANSACTION_HASH'
    };
  }
  
  // Validate all required environment variables
  const envValidation = validateSacNftEnvironment();
  if (!envValidation.isValid) {
    const errorMessages = [
      ...envValidation.missingVars.map(v => `Missing required environment variable: ${v}`),
      ...envValidation.errors
    ];
    throw new Error(`Environment configuration error: ${errorMessages.join(', ')}. Please check your .env.local file.`);
  }

  // Environment is validated, safe to use
  const sponsorSecretKey = process.env.SPONSOR_SECRET_KEY!;
  const sponsorKeypair = Keypair.fromSecret(sponsorSecretKey);

  // Generate unique asset code with timestamp
  const assetCode = `PRF${Date.now()}`;
  
  // Create issuer keypair (this will be the NFT issuer)
  const issuerKeypair = Keypair.random();
  const issuer = issuerKeypair.publicKey();
  
  // Get network details based on parameter
  const networkPassphrase = network === 'mainnet' 
    ? Networks.PUBLIC 
    : Networks.TESTNET;
  
  const horizonUrl = network === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
  
  const server = new Server(horizonUrl);
  
  try {
    // Load sponsor account with detailed error handling
    let sponsorAccount: Account;
    try {
      sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Sponsor account not found: ${sponsorKeypair.publicKey()}. Please ensure the sponsor account exists and is funded.`);
      }
      throw new Error(`Failed to load sponsor account: ${error.message || 'Network error'}`);
    }

    // Check sponsor account balance
    const nativeBalance = (sponsorAccount as any).balances?.find((b: any) => b.asset_type === 'native')?.balance;
    if (!nativeBalance || parseFloat(nativeBalance) < 5) {
      throw new Error(`Insufficient sponsor account balance: ${nativeBalance || '0'} XLM. Minimum 5 XLM required for SAC NFT minting.`);
    }
    
    // Create the SAC asset with supply of 1 (NFT)
    const asset = new Asset(assetCode, issuer);
    
    // Build transaction to create account and issue SAC
    const transaction = new TransactionBuilder(sponsorAccount, {
      fee: '100000', // Higher fee for multi-operation transaction
      networkPassphrase,
    })
      // Create and fund the issuer account
      .addOperation(Operation.createAccount({
        destination: issuer,
        startingBalance: '2', // Minimum balance for account + reserves
      }))
      // Issue the SAC token with supply of 1
      .addOperation(Operation.payment({
        destination: sponsorKeypair.publicKey(), // Send to sponsor (could be any destination)
        asset: asset,
        amount: '1', // NFT supply of 1
        source: issuer, // Issue from the new issuer account
      }))
      // Lock the asset to make it truly an NFT (set auth flags)
      .addOperation(Operation.setOptions({
        setFlags: 2, // AUTH_REQUIRED_FLAG to prevent further issuance
        source: issuer,
      }))
      .setTimeout(30)
      .build();
    
    // Sign with both sponsor (for funding) and issuer (for asset operations)
    transaction.sign(sponsorKeypair);
    transaction.sign(issuerKeypair);
    
    // Submit transaction with detailed error handling
    let result: any;
    try {
      result = await server.submitTransaction(transaction);
    } catch (error: any) {
      // Handle specific Stellar SDK errors
      if (error.response?.data?.extras?.result_codes) {
        const { transaction: txCode, operations: opCodes } = error.response.data.extras.result_codes;
        
        if (txCode === 'tx_insufficient_balance') {
          throw new Error('Sponsor account has insufficient balance to complete the transaction.');
        }
        
        if (txCode === 'tx_bad_seq') {
          throw new Error('Transaction sequence number conflict. Please retry the operation.');
        }
        
        if (opCodes?.includes('op_underfunded')) {
          throw new Error('Sponsor account underfunded for account creation operation.');
        }
        
        if (opCodes?.includes('op_already_exists')) {
          throw new Error('Issuer account already exists. This should not happen with random keypairs.');
        }
        
        throw new Error(`Stellar transaction failed: ${txCode}, operations: ${opCodes?.join(', ') || 'unknown'}`);
      }
      
      if (error.response?.status === 504) {
        throw new Error('Horizon timeout. The transaction may still be processing. Please check the network status.');
      }
      
      throw new Error(`Transaction submission failed: ${error.message || 'Unknown Stellar network error'}`);
    }

    if (!result?.successful) {
      throw new Error('Transaction was submitted but not marked as successful by Horizon.');
    }
    
    return {
      assetCode,
      issuer,
      txHash: result.hash,
    };
    
  } catch (error) {
    // Re-throw our custom errors as-is
    if (error instanceof Error && error.message.includes('Sponsor account') || 
        error instanceof Error && error.message.includes('Stellar transaction') ||
        error instanceof Error && error.message.includes('Transaction submission')) {
      throw error;
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in mintSacNft:', error);
    throw new Error(`SAC NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
}