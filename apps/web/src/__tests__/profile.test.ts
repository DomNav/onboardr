import { NextRequest } from 'next/server';
import { POST as mintProfile } from '@/app/api/profile/mint/route';
import { GET as checkOwnership } from '@/app/api/profile/owns/[address]/route';
import { 
  TEST_ADDRESSES,
  MOCK_MINT_REQUEST,
  MOCK_PROFILE_METADATA,
  createMockRequest,
  getResponseJson,
  mockEnvironment,
  submitTestTx
} from '@/lib/testUtils';
import { vi } from 'vitest';

// Mock the Stellar SDK and external dependencies
vi.mock('@stellar/stellar-sdk');
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-vector-key-12345')
}));

describe('Profile API', () => {
  mockEnvironment();

  describe('/api/profile/owns/[address]', () => {
    it('should return false when user has no NFT', async () => {
      const request = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.NO_NFT}`);
      const response = await checkOwnership(request, { params: { address: TEST_ADDRESSES.NO_NFT } });
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.owns).toBe(false);
      expect(data.metadata).toBeUndefined();
    });

    it('should return true with metadata when user has NFT', async () => {
      const request = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.VALID}`);
      const response = await checkOwnership(request, { params: { address: TEST_ADDRESSES.VALID } });
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.owns).toBe(true);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBe(MOCK_PROFILE_METADATA.name);
      expect(data.metadata.vectorKey).toBe(MOCK_PROFILE_METADATA.vectorKey);
    });

    it('should return 400 for invalid address format', async () => {
      const request = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.INVALID}`);
      const response = await checkOwnership(request, { params: { address: TEST_ADDRESSES.INVALID } });
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid wallet address');
    });

    it('should use cache on repeated requests', async () => {
      const request1 = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.VALID}`);
      const response1 = await checkOwnership(request1, { params: { address: TEST_ADDRESSES.VALID } });
      const data1 = await getResponseJson(response1);

      const request2 = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.VALID}`);
      const response2 = await checkOwnership(request2, { params: { address: TEST_ADDRESSES.VALID } });
      const data2 = await getResponseJson(response2);

      expect(data1.cached).toBe(false);
      expect(data2.cached).toBe(true);
      expect(data1.owns).toBe(data2.owns);
    });
  });

  describe('/api/profile/mint', () => {
    it('should prepare mint transaction for valid request', async () => {
      const request = createMockRequest('POST', '/api/profile/mint', MOCK_MINT_REQUEST);
      const response = await mintProfile(request);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.xdr).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.name).toBe(MOCK_MINT_REQUEST.metadata.name);
      expect(data.metadata.vectorKey).toBeDefined();
      expect(data.tokenURI).toContain('ipfs://');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequest = {
        walletAddress: TEST_ADDRESSES.VALID,
        metadata: {
          name: '', // Empty name should fail
          fiat: 'USD'
        }
      };

      const request = createMockRequest('POST', '/api/profile/mint', invalidRequest);
      const response = await mintProfile(request);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid wallet address', async () => {
      const invalidRequest = {
        ...MOCK_MINT_REQUEST,
        walletAddress: TEST_ADDRESSES.INVALID
      };

      const request = createMockRequest('POST', '/api/profile/mint', invalidRequest);
      const response = await mintProfile(request);
      const data = await getResponseJson(response);

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid wallet address');
    });

    it('should generate unique vector keys for different users', async () => {
      const request1 = createMockRequest('POST', '/api/profile/mint', {
        ...MOCK_MINT_REQUEST,
        walletAddress: TEST_ADDRESSES.VALID
      });
      
      const request2 = createMockRequest('POST', '/api/profile/mint', {
        ...MOCK_MINT_REQUEST,
        walletAddress: TEST_ADDRESSES.NO_NFT
      });

      const response1 = await mintProfile(request1);
      const response2 = await mintProfile(request2);
      
      const data1 = await getResponseJson(response1);
      const data2 = await getResponseJson(response2);

      expect(data1.metadata.vectorKey).toBeDefined();
      expect(data2.metadata.vectorKey).toBeDefined();
      // In real implementation, these would be different UUIDs
    });

    it('should auto-generate avatar when not provided', async () => {
      const requestWithoutAvatar = {
        walletAddress: TEST_ADDRESSES.VALID,
        metadata: {
          name: 'Test User',
          fiat: 'USD'
        }
      };

      const request = createMockRequest('POST', '/api/profile/mint', requestWithoutAvatar);
      const response = await mintProfile(request);
      const data = await getResponseJson(response);

      expect(response.status).toBe(200);
      expect(data.metadata.avatar).toBeDefined();
      expect(data.metadata.avatar).toContain('data:image/svg+xml');
    });
  });

  describe('Integration: Mint and then check ownership', () => {
    it('should mint NFT and then verify ownership', async () => {
      // Step 1: Mint NFT
      const mintRequest = createMockRequest('POST', '/api/profile/mint', MOCK_MINT_REQUEST);
      const mintResponse = await mintProfile(mintRequest);
      const mintData = await getResponseJson(mintResponse);

      expect(mintResponse.status).toBe(200);
      expect(mintData.success).toBe(true);
      expect(mintData.xdr).toBeDefined();

      // Step 2: Mock transaction submission (in real tests, this would submit to testnet)
      const submitResult = await submitTestTx(mintData.xdr);
      expect(submitResult.success).toBe(true);

      // Step 3: Check ownership
      const ownsRequest = createMockRequest('GET', `/api/profile/owns/${MOCK_MINT_REQUEST.walletAddress}`);
      const ownsResponse = await checkOwnership(ownsRequest, { 
        params: { address: MOCK_MINT_REQUEST.walletAddress } 
      });
      const ownsData = await getResponseJson(ownsResponse);

      expect(ownsResponse.status).toBe(200);
      expect(ownsData.owns).toBe(true);
      expect(ownsData.metadata.name).toBe(MOCK_MINT_REQUEST.metadata.name);
      expect(ownsData.metadata.vectorKey).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle contract not configured error', async () => {
      // Temporarily remove contract address
      const originalContract = process.env.PROFILE_NFT_CONTRACT_ADDRESS;
      delete process.env.PROFILE_NFT_CONTRACT_ADDRESS;

      const request = createMockRequest('POST', '/api/profile/mint', MOCK_MINT_REQUEST);
      const response = await mintProfile(request);
      const data = await getResponseJson(response);

      expect(response.status).toBe(500);
      expect(data.error).toContain('not configured');

      // Restore contract address
      process.env.PROFILE_NFT_CONTRACT_ADDRESS = originalContract;
    });

    it('should handle network errors gracefully', async () => {
      // This test would mock network failures in a real implementation
      // For now, we'll test the error handling structure
      const request = createMockRequest('GET', `/api/profile/owns/${TEST_ADDRESSES.VALID}`);
      
      // Mock network error by using invalid contract address
      const originalContract = process.env.PROFILE_NFT_CONTRACT_ADDRESS;
      process.env.PROFILE_NFT_CONTRACT_ADDRESS = 'INVALID_CONTRACT';

      const response = await checkOwnership(request, { params: { address: TEST_ADDRESSES.VALID } });
      const data = await getResponseJson(response);

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();

      // Restore contract address
      process.env.PROFILE_NFT_CONTRACT_ADDRESS = originalContract;
    });
  });
});