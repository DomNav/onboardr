export interface TradeQuote {
  id: string;
  pair: string;
  quantity: string;
  estimatedPrice: string;
  side: 'buy' | 'sell';
  timestamp: number;
  status: 'pending' | 'confirmed' | 'rejected';
}

export interface MetricPoint {
  timestamp: number;
  total2: number;
  btcDominance: number;
}

export interface PortfolioMetric {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// Animation preferences for accessibility
export interface AnimationConfig {
  duration: number;
  easing: string;
  reducedMotion: boolean;
}

// Token information for UI display
export interface TokenInfo {
  symbol: string;
  name: string;
  icon?: string;
  decimals: number;
  contract?: string;
}