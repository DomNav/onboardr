import { NextRequest, NextResponse } from 'next/server';
import * as StellarSDK from '@stellar/stellar-sdk';

// Contract configuration
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const RPC_URL = NETWORK === 'mainnet' 
  ? 'https://soroban-rpc.mainnet.stellar.org'
  : 'https://soroban-rpc.testnet.stellar.org'; // Fixed: removed trailing slash

const CONTRACT_ADDRESS = process.env.PROFILE_NFT_CONTRACT_ADDRESS;

// Cache for ownership checks (30 seconds as specified)
const cache = new Map<string, { owns: boolean; timestamp: number; metadata?: any }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    // Validate wallet address
    try {
      StellarSDK.StrKey.decodeEd25519PublicKey(address);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `owns_${address}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        owns: cached.owns,
        metadata: cached.metadata,
        cached: true
      });
    }

    // For development, return mock response if contract not configured
    if (!CONTRACT_ADDRESS) {
      console.log('Profile NFT contract not configured, returning mock response');
      return NextResponse.json({
        owns: false,
        metadata: null,
        cached: false,
        mock: true
      });
    }

    const server = new StellarSDK.rpc.Server(RPC_URL);
    const contract = new StellarSDK.Contract(CONTRACT_ADDRESS);

    // Create a dummy account for the read operation
    const dummyKeypair = StellarSDK.Keypair.random();
    const dummyAccount = new StellarSDK.Account(dummyKeypair.publicKey(), '0');

    // Check if the address owns a token
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

    // Simulate the ownership check with timeout
    const simulateWithTimeout = async (tx: any, timeoutMs = 5000) => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC timeout')), timeoutMs)
      );
      return Promise.race([server.simulateTransaction(tx), timeoutPromise]);
    };
    
    let ownsResult;
    try {
      ownsResult = await simulateWithTimeout(ownsTokenTx) as any;
    } catch (error: any) {
      if (error.message === 'RPC timeout') {
        console.log('RPC timeout, returning default response');
        return NextResponse.json({
          owns: false,
          metadata: null,
          cached: false,
          timeout: true
        });
      }
      throw error;
    }
    
    if (StellarSDK.rpc.Api.isSimulationError(ownsResult)) {
      console.error('Ownership check simulation error:', ownsResult.error);
      return NextResponse.json(
        { error: 'Failed to check NFT ownership' },
        { status: 500 }
      );
    }

    const boolValue = StellarSDK.scValToNative(ownsResult.result!.retval);
    const owns = Boolean(boolValue);
    let metadata = undefined;

    // If the address owns a token, get the metadata
    if (owns) {
      try {
        // Get token ID
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
        
        if (!StellarSDK.rpc.Api.isSimulationError(tokenResult)) {
          const tokenIdScVal = tokenResult.result!.retval;
          const tokenId = StellarSDK.scValToNative(tokenIdScVal);

          if (tokenId) {
            // Get metadata
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
            
            if (!StellarSDK.rpc.Api.isSimulationError(metadataResult)) {
              const metadataScVal = metadataResult.result!.retval;
              metadata = StellarSDK.scValToNative(metadataScVal);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch metadata:', error);
        // Continue without metadata if fetch fails
      }
    }

    // Cache the result
    cache.set(cacheKey, { 
      owns, 
      metadata,
      timestamp: Date.now() 
    });

    // Clean up old cache entries
    const now = Date.now();
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    });

    return NextResponse.json({
      owns,
      metadata,
      cached: false
    });

  } catch (error) {
    console.error('Ownership check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during ownership check' },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}