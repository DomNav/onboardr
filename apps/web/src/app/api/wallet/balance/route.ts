import { NextRequest, NextResponse } from 'next/server';
import { Horizon } from 'stellar-sdk';

const { Server } = Horizon;

interface WalletBalance {
  native: {
    balance: string;
    asset_type: 'native';
  };
  assets: Array<{
    balance: string;
    asset_code: string;
    asset_issuer: string;
    asset_type: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const network = searchParams.get('network') || process.env.STELLAR_NETWORK || 'testnet';
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate address format (Stellar addresses start with G and are 56 characters)
    if (!address.startsWith('G') || address.length !== 56) {
      return NextResponse.json(
        { error: 'Invalid Stellar address format' },
        { status: 400 }
      );
    }
    
    // Choose Horizon URL based on network parameter
    const horizonUrl = network === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';
    
    console.log(`🔍 Fetching balance for address: ${address} on network: ${network} using ${horizonUrl}`);
    
    const server = new Server(horizonUrl);
    
    try {
      // Load account from Horizon
      const account = await server.loadAccount(address);
      
      // Extract native balance
      const nativeBalance = (account as any).balances?.find(
        (b: any) => b.asset_type === 'native'
      );
      
      // Extract asset balances (excluding native)
      const assetBalances = (account as any).balances?.filter(
        (b: any) => b.asset_type !== 'native'
      ) || [];
      
      const walletBalance: WalletBalance = {
        native: {
          balance: nativeBalance?.balance || '0',
          asset_type: 'native'
        },
        assets: assetBalances.map((asset: any) => ({
          balance: asset.balance,
          asset_code: asset.asset_code,
          asset_issuer: asset.asset_issuer,
          asset_type: asset.asset_type
        }))
      };
      
      return NextResponse.json({
        address,
        ...walletBalance,
        updatedAt: new Date().toISOString(),
        network: network
      });
      
    } catch (horizonError: any) {
      if (horizonError.response?.status === 404) {
        // Account not found - return empty balances
        return NextResponse.json({
          address,
          native: {
            balance: '0',
            asset_type: 'native'
          },
          assets: [],
          updatedAt: new Date().toISOString(),
          network: network,
          accountExists: false
        });
      }
      
      console.error('Horizon API error:', horizonError);
      
      // In development, return mock data if Horizon fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Development mode: returning mock balance data due to Horizon error');
        return NextResponse.json({
          address,
          native: {
            balance: '1000.0000000',
            asset_type: 'native'
          },
          assets: [
            {
              balance: '1',
              asset_code: 'PRFDEV',
              asset_issuer: 'GD4I5QX5ZJHBNMGQMG42XHWI2MHKYAQJUPGFMXWHMH4JHVWV7WQXTDEV',
              asset_type: 'credit_alphanum12'
            }
          ],
          updatedAt: new Date().toISOString(),
          network: network,
          devMode: true,
          message: 'Using mock data - Horizon API unavailable'
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch account balance from Horizon',
          details: horizonError.message || 'Network error'
        },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('Wallet balance API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}