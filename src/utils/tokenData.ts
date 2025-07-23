export interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  tokenType: 'Stablecoin' | 'Native Token' | 'Other/Volatile';
  platform: 'Soroswap' | 'DeFindex' | 'Both';
  lastUpdated: Date;
  sparklineData?: number[];
}

export const mockTokens: Token[] = [
  // Stablecoins
  {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    change24h: 0.0001,
    changePercent24h: 0.01,
    marketCap: 32000000000,
    volume24h: 2500000000,
    tokenType: 'Stablecoin',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
  },
  {
    symbol: 'xUSDL',
    name: 'Synthetic USD',
    price: 1.00,
    change24h: 0.0005,
    changePercent24h: 0.05,
    marketCap: 850000000,
    volume24h: 45000000,
    tokenType: 'Stablecoin',
    platform: 'Soroswap',
    lastUpdated: new Date(),
    sparklineData: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    price: 1.00,
    change24h: -0.0002,
    changePercent24h: -0.02,
    marketCap: 95000000000,
    volume24h: 45000000000,
    tokenType: 'Stablecoin',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00]
  },
  
  // Native Tokens
  {
    symbol: 'SORO',
    name: 'Soroswap Token',
    price: 0.57,
    change24h: 0.012,
    changePercent24h: 2.1,
    marketCap: 28500000,
    volume24h: 1200000,
    tokenType: 'Native Token',
    platform: 'Soroswap',
    lastUpdated: new Date(),
    sparklineData: [0.55, 0.56, 0.54, 0.58, 0.57, 0.59, 0.57]
  },
  {
    symbol: 'DFX',
    name: 'Defindex Token',
    price: 1.38,
    change24h: -0.008,
    changePercent24h: -0.6,
    marketCap: 69000000,
    volume24h: 850000,
    tokenType: 'Native Token',
    platform: 'DeFindex',
    lastUpdated: new Date(),
    sparklineData: [1.40, 1.39, 1.42, 1.37, 1.41, 1.36, 1.38]
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3237.45,
    change24h: -27.89,
    changePercent24h: -0.85,
    marketCap: 389000000000,
    volume24h: 8500000000,
    tokenType: 'Native Token',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [3250, 3245, 3260, 3230, 3255, 3220, 3237]
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.75,
    change24h: 125.50,
    changePercent24h: 0.29,
    marketCap: 850000000000,
    volume24h: 25000000000,
    tokenType: 'Native Token',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [43100, 43200, 43050, 43300, 43150, 43400, 43250]
  },
  
  // Other/Volatile Tokens
  {
    symbol: 'LINK',
    name: 'Chainlink',
    price: 18.45,
    change24h: 0.67,
    changePercent24h: 3.76,
    marketCap: 10800000000,
    volume24h: 450000000,
    tokenType: 'Other/Volatile',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [17.80, 18.20, 17.90, 18.60, 18.10, 18.80, 18.45]
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    price: 12.34,
    change24h: -0.23,
    changePercent24h: -1.83,
    marketCap: 7400000000,
    volume24h: 280000000,
    tokenType: 'Other/Volatile',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [12.50, 12.40, 12.60, 12.30, 12.45, 12.20, 12.34]
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    price: 245.67,
    change24h: 8.45,
    changePercent24h: 3.56,
    marketCap: 3600000000,
    volume24h: 180000000,
    tokenType: 'Other/Volatile',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [237, 240, 235, 248, 242, 250, 245]
  },
  {
    symbol: 'COMP',
    name: 'Compound',
    price: 67.89,
    change24h: -1.23,
    changePercent24h: -1.78,
    marketCap: 680000000,
    volume24h: 45000000,
    tokenType: 'Other/Volatile',
    platform: 'Both',
    lastUpdated: new Date(),
    sparklineData: [69, 68.5, 69.5, 68, 68.8, 67.5, 67.89]
  }
];

export function formatCurrency(amount: number): string {
  if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(2)}B`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(2)}M`;
  } else if (amount >= 1e3) {
    return `$${(amount / 1e3).toFixed(2)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(4)}`;
  }
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function getTokenTypeColor(tokenType: Token['tokenType']): string {
  switch (tokenType) {
    case 'Stablecoin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Native Token':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Other/Volatile':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getWatchlistFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('token-watchlist');
  return stored ? JSON.parse(stored) : [];
}

export function saveWatchlistToStorage(watchlist: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token-watchlist', JSON.stringify(watchlist));
}

export function toggleWatchlistToken(symbol: string): string[] {
  const currentWatchlist = getWatchlistFromStorage();
  const newWatchlist = currentWatchlist.includes(symbol)
    ? currentWatchlist.filter(s => s !== symbol)
    : [...currentWatchlist, symbol];
  
  saveWatchlistToStorage(newWatchlist);
  return newWatchlist;
} 