export interface SimQuote {
  hop: string[];           // ["XLM","USDC"], ["USDC","AQUA"]
  amountIn: string;       // "250"
  amountOut: string;      // "248.1"
  priceImpact: number;    // 0.12
  feePct: number;         // 0.3
  estLifespanSec: number; // 12 - ms to fake loader
}

export interface TradeSimulation {
  id: string;
  quotes: SimQuote[];
  totalAmountIn: string;
  totalAmountOut: string;
  totalPriceImpact: number;
  status: 'loading' | 'ready' | 'confirmed' | 'rejected';
  timestamp: number;
}

export interface ParsedTradeHops {
  fromToken: string;
  toToken: string;
  hops: string[];
  amount: string;
}

export interface TradeSimulationState {
  simulations: TradeSimulation[];
  currentSimulation: TradeSimulation | null;
  isLoading: boolean;
}