import { NFTStorage } from 'nft.storage';

export interface ProfileMetadata {
  name: string;
  avatar: string;
  fiat: string;
  vectorKey: string;
}

/**
 * Upload metadata to NFT.storage (IPFS)
 * Returns ipfs://CID URL
 */
export async function uploadMetadata(metadata: ProfileMetadata): Promise<string | null> {
  // For now, return a mock IPFS URL since NFT.storage requires server-side upload
  // The backend will handle the actual IPFS upload if needed
  console.log('Using mock IPFS URL for development');
  const mockHash = Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 46);
  return `ipfs://Qm${mockHash}`;
}

/**
 * Fetch metadata from IPFS URL
 */
export async function fetchMetadata(ipfsUrl: string): Promise<ProfileMetadata | null> {
  try {
    // Convert ipfs:// to HTTP gateway URL
    const httpUrl = ipfsUrl.replace('ipfs://', 'https://gateway.nftstorage.link/ipfs/');
    
    const response = await fetch(httpUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const metadata = await response.json() as ProfileMetadata;
    
    // Validate metadata structure
    if (!metadata.name || !metadata.vectorKey) {
      throw new Error('Invalid metadata structure');
    }
    
    return metadata;
    
  } catch (error) {
    console.error('Failed to fetch metadata from IPFS:', error);
    return null;
  }
}

/**
 * Check if NFT.storage is properly configured
 */
export function isNFTStorageConfigured(): boolean {
  // Always return false for client-side since we're using mock IPFS
  return false;
}