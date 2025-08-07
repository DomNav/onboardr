import { ParsedTradeHops } from '@/types/trade';

export interface ParsedCommand {
  cmd: 'swap' | 'metrics' | 'help' | 'tier' | 'kyc' | 'upgrade' | 'defindex' | 'unknown';
  args: string;
}

export type ParsedTrade = {
  amount: string;      // "100"
  sell: string;        // "XLM"
  buy: string;         // "USDC"
};

export type ParsedMultiTrade = {
  trades: ParsedTrade[];
  count: number;
};

// Asset aliases for common variations and natural language
const ASSET_ALIASES: Record<string, string> = {
  // USD variants
  'usdt': 'USDC',
  'usd': 'USDC',
  'dollar': 'USDC',
  'dollars': 'USDC',
  'usdc': 'USDC',
  
  // XLM variants
  'stellar': 'XLM',
  'lumens': 'XLM',
  'lumen': 'XLM',
  'xlm': 'XLM',
  
  // Other tokens
  'aqua': 'AQUA',
  'yxlm': 'yXLM',
  'yield': 'yXLM',
  'btc': 'BTC',
  'bitcoin': 'BTC',
  'eth': 'ETH',
  'ethereum': 'ETH',
  'xrp': 'XRP',
  'ripple': 'XRP'
};

/**
 * Enhanced parser that accepts natural language swap commands:
 *   /swap 100 XLM -> USDC
 *   swap 100 xlm for usdc  
 *   swap 50 xlm to aqua
 *   swap 2,500 XLM to USDC
 *   I want to swap 100 xlm for usdc
 *   can I trade 50 aqua to yxlm
 *   exchange 100 xlm for usdc
 */
export function parseTrade(input: string): ParsedTrade | null {
  // Enhanced pattern that handles natural language prefixes
  const patterns = [
    // Original strict pattern for exact commands
    /^\s*(?:\/)?\s*(?:trade|swap|sell|buy|exchange|convert)\s+([\d,]+(?:\.\d+)?)\s+([a-z0-9]{1,15})\s+(?:->|→|to|for|into)\s+([a-z0-9]{1,15})\s*$/i,
    
    // Natural language patterns with common prefixes
    /(?:i\s+want\s+to\s+|can\s+i\s+|please\s+|let\s+me\s+|i\s+need\s+to\s+|i'd\s+like\s+to\s+|could\s+you\s+)?(?:trade|swap|sell|buy|exchange|convert)\s+([\d,]+(?:\.\d+)?)\s+([a-z0-9]{1,15})\s+(?:->|→|to|for|into)\s+([a-z0-9]{1,15})/i,
    
    // Pattern for "100 xlm to usdc" without action words
    /([\d,]+(?:\.\d+)?)\s+([a-z0-9]{1,15})\s+(?:->|→|to|for|into)\s+([a-z0-9]{1,15})/i,
    
    // Pattern for more conversational style: "exchange/convert 100 xlm to usdc"
    /(?:exchange|convert|change)\s+([\d,]+(?:\.\d+)?)\s+([a-z0-9]{1,15})\s+(?:to|for|into)\s+([a-z0-9]{1,15})/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const [, amount, sellAsset, buyAsset] = match;
      
      // Clean amount (remove commas)
      const cleanAmount = amount.replace(/,/g, '');
      
      // Normalize asset names using aliases
      const sell = ASSET_ALIASES[sellAsset.toLowerCase()] || sellAsset.toUpperCase();
      const buy = ASSET_ALIASES[buyAsset.toLowerCase()] || buyAsset.toUpperCase();

      return {
        amount: cleanAmount,
        sell,
        buy,
      };
    }
  }

  return null;
}

/**
 * Parse multiple swaps from a single message:
 *   "swap 100 xlm for usdc and swap 2500 aqua to xlm"
 *   "sell 50 xlm to usdc, then swap 100 aqua for yxlm"
 *   "swap 100 xlm for usdc and also swap 500 aqua to usdc"
 *   "I want to swap 100 xlm for usdc and swap 100 aqua for xrp"
 *   "can I trade 50 xlm to usdc and also exchange 200 aqua for yxlm"
 */
export function parseMultiTrade(input: string): ParsedMultiTrade | null {
  // Split on conjunctions: and, then, also, plus, &, comma
  // More flexible pattern to handle "comma then" combinations
  const conjunctions = /\s*(?:,\s*then|,\s*and|,\s*also|\s+and\s+|\s+then\s+|\s+also\s+|\s+plus\s+|\s*&\s*|\s*,\s*)\s*/i;
  const segments = input.split(conjunctions);
  
  const trades: ParsedTrade[] = [];
  
  for (const segment of segments) {
    const trade = parseTrade(segment.trim());
    if (trade) {
      trades.push(trade);
    }
  }
  
  // Only return if we found at least 2 trades
  if (trades.length >= 2) {
    return {
      trades,
      count: trades.length
    };
  }
  
  return null;
}

export default function parseCommand(input: string): ParsedCommand {
  // First, try to parse as multiple swaps
  const multiTradeResult = parseMultiTrade(input);
  if (multiTradeResult) {
    // Format multiple swaps as a special args format
    const tradesArgs = multiTradeResult.trades
      .map(t => `${t.amount} ${t.sell} → ${t.buy}`)
      .join(' | ');
    return { 
      cmd: 'swap', 
      args: `MULTI:${multiTradeResult.count}:${tradesArgs}` 
    };
  }

  // Then try single swap command (with or without slash)
  const tradeResult = parseTrade(input);
  if (tradeResult) {
    return { 
      cmd: 'swap', 
      args: `${tradeResult.amount} ${tradeResult.sell} → ${tradeResult.buy}` 
    };
  }

  // Handle slash commands
  if (input.startsWith('/')) {
    const [slash, ...rest] = input.trim().split(' ');
    const cmd = slash.slice(1).toLowerCase();
    const args = rest.join(' ');
    switch (cmd) {
      case 'swap':
      case 'metrics':
      case 'help':
      case 'tier':
      case 'kyc':
      case 'upgrade':
      case 'defindex':
        return { cmd: cmd as ParsedCommand['cmd'], args };
      default:
        return { cmd: 'unknown', args: input };
    }
  }

  // Handle natural language commands without slash
  const lowerInput = input.toLowerCase().trim();
  
  if (lowerInput.startsWith('help') || lowerInput === 'h') {
    return { cmd: 'help', args: '' };
  }
  
  if (lowerInput.startsWith('metrics') || lowerInput.startsWith('stats')) {
    const args = input.substring(input.indexOf(' ') + 1).trim();
    return { cmd: 'metrics', args };
  }
  
  // New command patterns
  if (lowerInput.includes('tier') || lowerInput.includes('subscription')) {
    return { cmd: 'tier', args: '' };
  }
  
  if (lowerInput.includes('kyc') || lowerInput.includes('verification')) {
    return { cmd: 'kyc', args: '' };
  }
  
  if (lowerInput.includes('upgrade') || lowerInput.includes('pro') || lowerInput.includes('elite')) {
    return { cmd: 'upgrade', args: '' };
  }
  
  if (lowerInput.includes('defindex') || lowerInput.includes('vault')) {
    return { cmd: 'defindex', args: '' };
  }

  // Additional fallback for very natural language
  // Try to extract swap intent from free-form text
  const naturalSwapPattern = /(?:want|need|like).*?(?:swap|trade|exchange|convert|sell|buy).*?([\d,]+(?:\.\d+)?)\s+([a-z0-9]{1,15}).*?(?:to|for|into).*?([a-z0-9]{1,15})/i;
  const naturalMatch = input.match(naturalSwapPattern);
  
  if (naturalMatch) {
    const [, amount, sellAsset, buyAsset] = naturalMatch;
    const cleanAmount = amount.replace(/,/g, '');
    const sell = ASSET_ALIASES[sellAsset.toLowerCase()] || sellAsset.toUpperCase();
    const buy = ASSET_ALIASES[buyAsset.toLowerCase()] || buyAsset.toUpperCase();
    
    return { 
      cmd: 'swap', 
      args: `${cleanAmount} ${sell} → ${buy}` 
    };
  }

  return { cmd: 'unknown', args: input };
}

// Parse swap hops from command like "/swap 250 XLM → USDC → AQUA"
export function parseTradeHops(args: string): ParsedTradeHops | null {
  try {
    // Remove any leading/trailing whitespace
    const cleanArgs = args.trim();
    
    // Extract amount (first token should be a number)
    const tokens = cleanArgs.split(/\s+/);
    const amount = tokens[0];
    
    if (!amount || isNaN(Number(amount))) {
      throw new Error('Invalid amount');
    }
    
    // Join remaining tokens and split by arrows or "to"
    const remaining = tokens.slice(1).join(' ');
    const hops = remaining
      .split(/[\s]*[→>-]+[\s]*|[\s]+to[\s]+/i)
      .map(token => token.trim().toUpperCase())
      .filter(token => token.length > 0);
    
    if (hops.length < 2) {
      throw new Error('Must specify at least 2 tokens for a swap');
    }
    
    if (hops.length > 4) {
      throw new Error('Maximum 4 hops supported');
    }
    
    // Validate token symbols (basic validation)
    for (const token of hops) {
      if (!/^[A-Z]{2,10}$/.test(token)) {
        throw new Error(`Invalid token symbol: ${token}`);
      }
    }
    
    return {
      fromToken: hops[0],
      toToken: hops[hops.length - 1],
      hops,
      amount,
    };
  } catch (error) {
    console.error('Failed to parse swap hops:', error);
    return null;
  }
}