import { Router, Request, Response } from 'express';
import { DeFindexClient } from '../services/defindex';
import { Keypair, Account } from '@stellar/stellar-sdk';

const router: Router = Router();
const defindexClient = new DeFindexClient();

/**
 * POST /api/vaults/:id/deposit
 * Deposit assets into a vault
 */
router.post('/:id/deposit', async (req: Request, res: Response) => {
  try {
    const { id: vaultId } = req.params;
    const { amount, secretKey } = req.body;

    // Validate required fields
    if (!amount || !secretKey) {
      return res.status(400).json({
        error: 'Missing required fields: amount, secretKey',
      });
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number',
      });
    }

    // Create account from secret key
    let depositorKeypair: Account;
    try {
      const keypair = Keypair.fromSecret(secretKey);
      depositorKeypair = new Account(keypair.publicKey(), '0');
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid secret key provided',
      });
    }

    const result = await defindexClient.deposit(vaultId, amount, depositorKeypair);

    res.json({
      success: true,
      vaultId,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Vault deposit error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/vaults/:id/withdraw
 * Withdraw assets from a vault
 */
router.post('/:id/withdraw', async (req: Request, res: Response) => {
  try {
    const { id: vaultId } = req.params;
    const { shares, secretKey } = req.body;

    // Validate required fields
    if (!shares || !secretKey) {
      return res.status(400).json({
        error: 'Missing required fields: shares, secretKey',
      });
    }

    // Validate shares is a positive number
    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      return res.status(400).json({
        error: 'Shares must be a positive number',
      });
    }

    // Create account from secret key
    let withdrawerKeypair: Account;
    try {
      const keypair = Keypair.fromSecret(secretKey);
      withdrawerKeypair = new Account(keypair.publicKey(), '0');
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid secret key provided',
      });
    }

    const result = await defindexClient.withdraw(vaultId, shares, withdrawerKeypair);

    res.json({
      success: true,
      vaultId,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Vault withdraw error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vaults/:id/info
 * Get vault information
 */
router.get('/:id/info', async (req: Request, res: Response) => {
  try {
    const { id: vaultId } = req.params;

    const vaultInfo = await defindexClient.getVaultInfo(vaultId);

    res.json({
      success: true,
      vaultId,
      info: vaultInfo,
      network: await defindexClient.getNetworkInfo(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Vault info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vaults/health
 * Health check for DeFindex service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'defindex-vault-service',
    network: 'testnet',
    timestamp: new Date().toISOString(),
  });
});

export { router }; 