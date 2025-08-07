import { NextRequest, NextResponse } from 'next/server';
import * as StellarSDK from '@stellar/stellar-sdk';
import { v4 as uuidv4 } from 'uuid';
import { mintSacNft } from '../../../../lib/nft/mintSacNft';

// Removed unused NETWORK variable - now using SAC NFT implementation

interface ProfileMetadata {
  name: string;
  avatar: string;
  fiat: string;
  vectorKey?: string;
}

interface MintRequest {
  walletAddress: string;
  metadata: ProfileMetadata;
  tokenURI?: string; // Allow frontend to provide pre-uploaded IPFS URI
  network?: 'mainnet' | 'testnet';
}


// Upload metadata to IPFS (mock implementation - replace with actual IPFS service)
async function uploadToIPFS(metadata: ProfileMetadata): Promise<string> {
  // For now, we'll create a mock IPFS URI
  // In production, replace this with actual IPFS upload
  const hash = Buffer.from(JSON.stringify(metadata)).toString('hex').substring(0, 46);
  return `ipfs://Qm${hash}`;
}

// Generate avatar SVG
function generateAvatarSVG(name: string, vectorKey: string): string {
  // Simple SVG avatar generation based on name and vectorKey
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorIndex = vectorKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="60" fill="${bgColor}"/>
    <text x="60" y="60" text-anchor="middle" dy=".35em" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">
      ${initials}
    </text>
  </svg>`;
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, metadata, tokenURI, network = 'testnet' }: MintRequest = await req.json();

    // Validate required fields
    if (!walletAddress || !metadata.name || !metadata.fiat) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, name, fiat' },
        { status: 400 }
      );
    }

    // Validate wallet address
    try {
      StellarSDK.StrKey.decodeEd25519PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Call mintSacNft to create the SAC NFT with network parameter
    const sacResult = await mintSacNft(network);

    // Generate vector key for AI memory
    const vectorKey = uuidv4();

    // Generate avatar if not provided
    const avatar = metadata.avatar || `data:image/svg+xml;base64,${Buffer.from(generateAvatarSVG(metadata.name, vectorKey)).toString('base64')}`;

    // Prepare full metadata
    const fullMetadata = {
      ...metadata,
      avatar,
      vectorKey,
    };

    // Use provided tokenURI or upload metadata to IPFS
    const finalTokenURI = tokenURI || await uploadToIPFS(fullMetadata);

    // Return the SAC NFT information
    return NextResponse.json({
      success: true,
      assetCode: sacResult.assetCode,
      issuer: sacResult.issuer,
      txHash: sacResult.txHash,
      metadata: fullMetadata,
      tokenURI: finalTokenURI,
      message: 'SAC NFT minted successfully'
    });

  } catch (error) {
    console.error('Mint API error:', error);
    
    // Handle specific errors from our minting process
    if (error instanceof Error) {
      const message = error.message;
      
      // Environment/Configuration errors
      if (message.includes('SPONSOR_SECRET_KEY') || message.includes('environment')) {
        return NextResponse.json(
          { 
            error: 'Server configuration error', 
            details: 'SAC NFT minting service is not properly configured. Please contact support.',
            code: 'CONFIG_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Sponsor account errors
      if (message.includes('Sponsor account not found')) {
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable', 
            details: 'SAC NFT minting service sponsor account is not available. Please try again later.',
            code: 'SPONSOR_NOT_FOUND'
          },
          { status: 503 }
        );
      }
      
      if (message.includes('Insufficient sponsor account balance')) {
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable', 
            details: 'SAC NFT minting service is temporarily out of funds. Please try again later.',
            code: 'SPONSOR_INSUFFICIENT_FUNDS'
          },
          { status: 503 }
        );
      }
      
      // Network/Horizon errors
      if (message.includes('Horizon timeout') || message.includes('Network error')) {
        return NextResponse.json(
          { 
            error: 'Network timeout', 
            details: 'The Stellar network is experiencing delays. Please try again in a few moments.',
            code: 'NETWORK_TIMEOUT'
          },
          { status: 504 }
        );
      }
      
      if (message.includes('Transaction sequence number conflict')) {
        return NextResponse.json(
          { 
            error: 'Transaction conflict', 
            details: 'Please wait a moment and try minting your Profile NFT again.',
            code: 'SEQUENCE_CONFLICT' 
          },
          { status: 409 }
        );
      }
      
      // Stellar transaction errors
      if (message.includes('Stellar transaction failed')) {
        return NextResponse.json(
          { 
            error: 'Blockchain transaction failed', 
            details: message,
            code: 'STELLAR_TX_FAILED'
          },
          { status: 400 }
        );
      }
      
      // Legacy errors (maintain compatibility)
      if (message.includes('AlreadyOwnsToken')) {
        return NextResponse.json(
          { 
            error: 'Address already owns a Profile NFT',
            code: 'ALREADY_OWNS_TOKEN'
          },
          { status: 409 }
        );
      }
      
      if (message.includes('InvalidMetadata')) {
        return NextResponse.json(
          { 
            error: 'Invalid metadata provided',
            details: message,
            code: 'INVALID_METADATA'
          },
          { status: 400 }
        );
      }
      
      // Generic error with more details
      return NextResponse.json(
        { 
          error: 'SAC NFT minting failed', 
          details: message,
          code: 'MINT_FAILED'
        },
        { status: 500 }
      );
    }

    // Fallback for non-Error objects
    return NextResponse.json(
      { 
        error: 'Internal server error during minting process',
        details: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}