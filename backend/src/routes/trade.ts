import { Router, Request, Response } from 'express';
import { StellarService } from '../services/stellarService';
import { TradeRequest, TradeSubmission } from '../types/stellar';

const router: Router = Router();
const stellarService = new StellarService();

/**
 * POST /api/trade/prepare
 * Prepare a trade transaction (build XDR without signing)
 */
router.post('/prepare', async (req: Request, res: Response) => {
  try {
    const tradeRequest: TradeRequest = req.body;

    // Validate required fields
    if (!tradeRequest.fromAsset || !tradeRequest.toAsset || !tradeRequest.amount || !tradeRequest.userPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: fromAsset, toAsset, amount, userPublicKey',
      });
    }

    // Validate amount is positive number
    const amount = parseFloat(tradeRequest.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be a positive number',
      });
    }

    // Validate slippage (default to 1% if not provided)
    const slippage = tradeRequest.slippage || 1.0;
    if (slippage < 0 || slippage > 50) {
      return res.status(400).json({
        error: 'Slippage must be between 0 and 50 percent',
      });
    }

    const preparedTrade = await stellarService.prepareTrade({
      ...tradeRequest,
      slippage,
    });

    res.json({
      success: true,
      trade: preparedTrade,
      instructions: {
        nextStep: 'Sign the XDR with your wallet and submit to /api/trade/submit',
        expiresIn: '5 minutes',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trade preparation error:', error);
    res.status(500).json({
      error: 'Failed to prepare trade',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/trade/submit
 * Submit a signed trade transaction
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const submission: TradeSubmission = req.body;

    // Validate required fields
    if (!submission.tradeId || !submission.signedXdr || !submission.userPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: tradeId, signedXdr, userPublicKey',
      });
    }

    const result = await stellarService.submitTrade(submission);

    if (result.success) {
      res.json({
        success: true,
        transactionHash: result.transactionHash,
        actualOutput: result.actualOutput,
        explorerUrl: `https://testnet.stellarchain.io/transactions/${result.transactionHash}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Trade submission error:', error);
    res.status(500).json({
      error: 'Failed to submit trade',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/trade/health
 * Health check for trade service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'trade-service',
    network: 'testnet',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/trade/:tradeId
 * Get trade status by ID
 */
router.get('/:tradeId', (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const trade = stellarService.getPendingTrade(tradeId);

    if (trade) {
      const isExpired = Date.now() > trade.expiresAt;
      res.json({
        found: true,
        trade,
        status: isExpired ? 'expired' : 'pending',
        expiresIn: Math.max(0, trade.expiresAt - Date.now()),
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        found: false,
        error: 'Trade not found or already processed',
      });
    }
  } catch (error) {
    console.error('Trade lookup error:', error);
    res.status(500).json({
      error: 'Failed to lookup trade',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router };