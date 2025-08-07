import * as StellarSDK from '@stellar/stellar-sdk';

// Contract configuration
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://soroban-rpc.mainnet.stellar.org'
  : 'https://soroban-rpc.testnet.stellar.org/';

const PROFILE_NFT_CONTRACT = process.env.PROFILE_NFT_CONTRACT_ADDRESS;

export interface ProfileMetadata {
  name: string;
  avatar: string;
  fiat: string;
  vectorKey: string;
}

/**
 * Get profile metadata by wallet address
 * Throws error if no NFT found
 */
export async function getProfileByAddress(address: string): Promise<ProfileMetadata> {
  if (!PROFILE_NFT_CONTRACT) {
    throw new Error('Profile NFT contract not configured');
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const contract = new StellarSDK.Contract(PROFILE_NFT_CONTRACT);
    
    // Create a dummy account for read operations
    const dummyKeypair = StellarSDK.Keypair.random();
    const dummyAccount = new StellarSDK.Account(dummyKeypair.publicKey(), '0');

    // Get token ID by owner
    const getTokenOp = contract.call('get_token_by_owner', StellarSDK.nativeToScVal(StellarSDK.Address.fromString(address)));
    
    const getTokenTx = new StellarSDK.TransactionBuilder(dummyAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' 
        ? StellarSDK.Networks.PUBLIC 
        : StellarSDK.Networks.TESTNET,
    })
      .addOperation(getTokenOp)
      .setTimeout(300)
      .build();

    const tokenResult = await server.simulateTransaction(getTokenTx);
    
    if (StellarSDK.rpc.Api.isSimulationError(tokenResult)) {
      throw new Error('Profile NFT not found');
    }

    const tokenIdScVal = tokenResult.result!.retval;
    const tokenId = StellarSDK.scValToNative(tokenIdScVal);

    if (!tokenId) {
      throw new Error('Profile NFT not found');
    }

    // Get metadata by token ID
    const getMetadataOp = contract.call('get_metadata', StellarSDK.nativeToScVal(tokenId));
    
    const getMetadataTx = new StellarSDK.TransactionBuilder(dummyAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' 
        ? StellarSDK.Networks.PUBLIC 
        : StellarSDK.Networks.TESTNET,
    })
      .addOperation(getMetadataOp)
      .setTimeout(300)
      .build();

    const metadataResult = await server.simulateTransaction(getMetadataTx);
    
    if (StellarSDK.rpc.Api.isSimulationError(metadataResult)) {
      throw new Error('Failed to fetch profile metadata');
    }

    const metadataScVal = metadataResult.result!.retval;
    const metadata = StellarSDK.scValToNative(metadataScVal);

    // Validate metadata structure
    if (!metadata.vector_key || !metadata.name) {
      throw new Error('Invalid profile metadata structure');
    }

    return {
      name: metadata.name,
      avatar: metadata.avatar,
      fiat: metadata.fiat,
      vectorKey: metadata.vector_key
    };

  } catch (error) {
    console.error('Error fetching profile by address:', error);
    throw new Error(`Profile NFT not found: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if address owns a profile NFT (lighter weight than getProfileByAddress)
 */
export async function hasProfileNFT(address: string): Promise<boolean> {
  if (!PROFILE_NFT_CONTRACT) {
    return false;
  }

  try {
    const server = new StellarSDK.rpc.Server(RPC_URL);
    const contract = new StellarSDK.Contract(PROFILE_NFT_CONTRACT);
    
    const dummyKeypair = StellarSDK.Keypair.random();
    const dummyAccount = new StellarSDK.Account(dummyKeypair.publicKey(), '0');

    const ownsTokenOp = contract.call('owns_token', StellarSDK.nativeToScVal(StellarSDK.Address.fromString(address)));
    
    const ownsTokenTx = new StellarSDK.TransactionBuilder(dummyAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' 
        ? StellarSDK.Networks.PUBLIC 
        : StellarSDK.Networks.TESTNET,
    })
      .addOperation(ownsTokenOp)
      .setTimeout(300)
      .build();

    const ownsResult = await server.simulateTransaction(ownsTokenTx);
    
    if (StellarSDK.rpc.Api.isSimulationError(ownsResult)) {
      return false;
    }

    const boolValue = StellarSDK.scValToNative(ownsResult.result!.retval);
    return Boolean(boolValue);
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
}