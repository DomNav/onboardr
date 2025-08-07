import { NextRequest, NextResponse } from 'next/server';
import * as StellarSDK from '@stellar/stellar-sdk';

// Test utilities for Profile NFT testing

export const TEST_ADDRESSES = {
  VALID: 'GDKTESTADDRESS1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  NO_NFT: 'GDNOTESTNFT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
  INVALID: 'INVALID_ADDRESS'
};

export const MOCK_PROFILE_METADATA = {
  name: 'Test User',
  avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNjAiIGN5PSI2MCIgcj0iNjAiIGZpbGw9IiNGRjZCNkIiLz48dGV4dCB4PSI2MCIgeT0iNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuMzVlbSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjM2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPlRVPC90ZXh0Pjwvc3ZnPg==',
  fiat: 'USD',
  vectorKey: 'test-vector-key-12345'
};

export const MOCK_MINT_REQUEST = {
  walletAddress: TEST_ADDRESSES.VALID,
  metadata: {
    name: MOCK_PROFILE_METADATA.name,
    avatar: MOCK_PROFILE_METADATA.avatar,
    fiat: MOCK_PROFILE_METADATA.fiat
  }
};

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(method: string, url: string, body?: any): NextRequest {
  const absoluteUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  const request = new NextRequest(absoluteUrl, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return request;
}

/**
 * Mock Stellar SDK functions for testing
 */
export function mockStellarSDK() {
  // Mock successful ownership check
  const mockSimulateTransaction = jest.fn().mockImplementation((tx) => {
    const operation = tx.operations[0];
    
    if (operation.function === 'owns_token') {
      const address = operation.args[0].value();
      return Promise.resolve({
        result: {
          retval: StellarSDK.nativeToScVal(address === TEST_ADDRESSES.VALID)
        }
      });
    }
    
    if (operation.function === 'get_token_by_owner') {
      return Promise.resolve({
        result: {
          retval: StellarSDK.nativeToScVal(1) // Mock token ID
        }
      });
    }
    
    if (operation.function === 'get_metadata') {
      return Promise.resolve({
        result: {
          retval: StellarSDK.nativeToScVal(MOCK_PROFILE_METADATA)
        }
      });
    }
    
    return Promise.resolve({
      result: {
        retval: StellarSDK.nativeToScVal(null)
      }
    });
  });

  return {
    mockSimulateTransaction
  };
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironment() {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STELLAR_NETWORK: 'testnet',
      PROFILE_NFT_CONTRACT_ADDRESS: 'CDTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
      SPONSOR_SECRET_KEY: 'STEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890AB',
      OPENAI_API_KEY: 'sk-test1234567890'
    };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
}

/**
 * Helper to extract JSON from NextResponse
 */
export async function getResponseJson(response: NextResponse): Promise<any> {
  const text = await response.text();
  return JSON.parse(text);
}

/**
 * Mock IPFS upload for testing
 */
export function mockIPFSUpload(mockHash?: string): string {
  const hash = mockHash || 'QmTest1234567890abcdefghijklmnopqrstuvwxyz';
  return `ipfs://${hash}`;
}

/**
 * Submit test transaction (mock implementation)
 * In real tests, this would interact with Stellar testnet
 */
export async function submitTestTx(xdr: string): Promise<{ success: boolean; hash?: string }> {
  try {
    // Mock successful transaction submission
    const mockHash = 'test-tx-hash-' + Date.now();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      hash: mockHash
    };
  } catch (error) {
    return {
      success: false
    };
  }
}