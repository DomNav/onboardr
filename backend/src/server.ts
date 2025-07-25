import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { router as soroswapRouter } from './routes/soroswap';
import { router as walletRouter } from './routes/wallet';
import { router as tradeRouter } from './routes/trade';
import { router as agentsRouter } from './routes/agents';

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'onboardr-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/soroswap', soroswapRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/trade', tradeRouter);
app.use('/api/agents', agentsRouter);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Onboardr Backend API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Soroswap TVL: http://localhost:${PORT}/api/soroswap/tvl`);
  console.log(`💰 Wallet API: http://localhost:${PORT}/api/wallet`);
  console.log(`🔄 Trade API: http://localhost:${PORT}/api/trade`);
  console.log(`🤖 Agents API: http://localhost:${PORT}/api/agents`);
  
  // Validate required environment variables
  if (!process.env.DUNE_API_KEY) {
    console.warn('⚠️  DUNE_API_KEY not found in environment variables');
  } else {
    console.log('✅ DUNE_API_KEY configured');
  }
});

export default app;