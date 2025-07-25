import { Router, Request, Response } from 'express';
import { StellarService } from '../services/stellarService';
import { WalletConnection } from '../types/stellar';

const router: Router = Router();
const stellarService = new StellarService();

/**
 * POST /api/wallet/connect
 * Validate wallet connection and return account info
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const connection: WalletConnection = req.body;

    // Validate required fields
    if (!connection.publicKey || !connection.walletType) {
      return res.status(400).json({
        error: 'Missing required fields: publicKey, walletType',
      });
    }

    // Validate wallet type
    if (!['freighter', 'albedo'].includes(connection.walletType)) {
      return res.status(400).json({
        error: 'Invalid wallet type. Supported: freighter, albedo',
      });
    }

    const result = await stellarService.validateWalletConnection(connection);

    if (result.valid) {
      res.json({
        success: true,
        publicKey: connection.publicKey,
        walletType: connection.walletType,
        balance: result.balance,
        network: stellarService.getNetworkInfo(),
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/wallet/network
 * Get current network configuration
 */
router.get('/network', (req: Request, res: Response) => {
  res.json({
    ...stellarService.getNetworkInfo(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/wallet/health
 * Health check for wallet service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'wallet-service',
    network: 'testnet',
    timestamp: new Date().toISOString(),
  });
});

export { router };