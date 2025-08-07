/**
 * CoinMarketCap API response types
 */

export interface CMCQuote {
  id: number;
  symbol: string;
  price: number;
  percentChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface CMCQuoteResponse {
  [id: string]: CMCQuote;
}

export interface CMCOhlcvCandle {
  timeOpen: string;
  timeClose: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CMCErrorResponse {
  status: 'error';
  message: string;
  errors?: any[];
}

// Token ID mappings for popular cryptocurrencies
export const TOKEN_ID_MAP: Record<string, number> = {
  // Major cryptocurrencies
  'BTC': 1,
  'ETH': 1027,
  'USDC': 3408,
  'USDT': 825,
  'BNB': 1839,
  'XRP': 52,
  'ADA': 2010,
  'SOL': 5426,
  'DOGE': 74,
  'DOT': 6636,
  'MATIC': 3890,
  'LINK': 1975,
  'UNI': 7083,
  'LTC': 2,
  'BCH': 1831,
  'XLM': 512, // Stellar Lumens
  
  // DeFi tokens
  'AAVE': 7278,
  'MKR': 1518,
  'COMP': 5692,
  'YFI': 5864,
  'SNX': 2586,
  'CRV': 6538,
  'SUSHI': 6758,
  '1INCH': 8104,
  
  // Layer 2 tokens
  'ARB': 11841,
  'OP': 11840,
};

// Reverse mapping for symbol lookup
export const ID_TO_SYMBOL_MAP: Record<number, string> = Object.fromEntries(
  Object.entries(TOKEN_ID_MAP).map(([symbol, id]) => [id, symbol])
);

export function getTokenId(symbol: string): number | undefined {
  return TOKEN_ID_MAP[symbol.toUpperCase()];
}

export function getTokenSymbol(id: number): string | undefined {
  return ID_TO_SYMBOL_MAP[id];
}