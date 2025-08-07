import { parseTradeHops } from '@/lib/parseCommand';

describe('parseTradeHops', () => {
  describe('Valid inputs', () => {
    test('should parse simple two-hop trade with arrow', () => {
      const result = parseTradeHops('250 XLM → USDC');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '250',
      });
    });

    test('should parse three-hop trade with arrows', () => {
      const result = parseTradeHops('100 XLM → USDC → AQUA');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '100',
      });
    });

    test('should parse four-hop trade', () => {
      const result = parseTradeHops('50 BTC → USDC → XLM → AQUA');
      expect(result).toEqual({
        fromToken: 'BTC',
        toToken: 'AQUA',
        hops: ['BTC', 'USDC', 'XLM', 'AQUA'],
        amount: '50',
      });
    });

    test('should parse with "to" syntax', () => {
      const result = parseTradeHops('250 XLM to USDC to AQUA');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '250',
      });
    });

    test('should parse with mixed arrow and "to" syntax', () => {
      const result = parseTradeHops('100 XLM → USDC to AQUA');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '100',
      });
    });

    test('should handle different arrow types', () => {
      const result = parseTradeHops('75 XLM > USDC >> AQUA');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '75',
      });
    });

    test('should handle extra whitespace', () => {
      const result = parseTradeHops('  250   XLM   →   USDC   →   AQUA  ');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '250',
      });
    });

    test('should handle lowercase token names', () => {
      const result = parseTradeHops('100 xlm → usdc');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '100',
      });
    });

    test('should handle decimal amounts', () => {
      const result = parseTradeHops('250.5 XLM → USDC');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '250.5',
      });
    });

    test('should handle scientific notation amounts', () => {
      const result = parseTradeHops('1e6 XLM → USDC');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '1e6',
      });
    });
  });

  describe('Invalid inputs', () => {
    test('should return null for empty string', () => {
      const result = parseTradeHops('');
      expect(result).toBeNull();
    });

    test('should return null for whitespace only', () => {
      const result = parseTradeHops('   ');
      expect(result).toBeNull();
    });

    test('should return null when amount is missing', () => {
      const result = parseTradeHops('XLM → USDC');
      expect(result).toBeNull();
    });

    test('should return null when amount is not a number', () => {
      const result = parseTradeHops('abc XLM → USDC');
      expect(result).toBeNull();
    });

    test('should return null when amount is NaN', () => {
      const result = parseTradeHops('NaN XLM → USDC');
      expect(result).toBeNull();
    });

    test('should return null for single token only', () => {
      const result = parseTradeHops('250 XLM');
      expect(result).toBeNull();
    });

    test('should return null when only amount is provided', () => {
      const result = parseTradeHops('250');
      expect(result).toBeNull();
    });

    test('should return null for too many hops', () => {
      const result = parseTradeHops('250 XLM → USDC → AQUA → BTC → ETH');
      expect(result).toBeNull();
    });

    test('should return null for invalid token symbols (too short)', () => {
      const result = parseTradeHops('250 X → USDC');
      expect(result).toBeNull();
    });

    test('should return null for invalid token symbols (too long)', () => {
      const result = parseTradeHops('250 VERYLONGTOKEN → USDC');
      expect(result).toBeNull();
    });

    test('should return null for invalid token symbols (contains numbers)', () => {
      const result = parseTradeHops('250 XLM1 → USDC');
      expect(result).toBeNull();
    });

    test('should return null for invalid token symbols (contains special chars)', () => {
      const result = parseTradeHops('250 XLM$ → USDC');
      expect(result).toBeNull();
    });

    test('should return null when no separator found', () => {
      const result = parseTradeHops('250 XLM USDC');
      expect(result).toBeNull();
    });

    test('should return null for negative amounts', () => {
      const result = parseTradeHops('-100 XLM → USDC');
      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('should handle very small decimal amounts', () => {
      const result = parseTradeHops('0.000001 XLM → USDC');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '0.000001',
      });
    });

    test('should handle zero amount', () => {
      const result = parseTradeHops('0 XLM → USDC');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'USDC',
        hops: ['XLM', 'USDC'],
        amount: '0',
      });
    });

    test('should handle maximum valid hops (4 tokens)', () => {
      const result = parseTradeHops('100 BTC → USDC → XLM → AQUA');
      expect(result).toEqual({
        fromToken: 'BTC',
        toToken: 'AQUA',
        hops: ['BTC', 'USDC', 'XLM', 'AQUA'],
        amount: '100',
      });
    });

    test('should handle different casing consistently', () => {
      const result = parseTradeHops('100 btc → Usdc → xlm');
      expect(result).toEqual({
        fromToken: 'BTC',
        toToken: 'XLM',
        hops: ['BTC', 'USDC', 'XLM'],
        amount: '100',
      });
    });

    test('should handle tokens with valid edge lengths', () => {
      const result = parseTradeHops('100 BT → VERYLONGTK');
      expect(result).toEqual({
        fromToken: 'BT',
        toToken: 'VERYLONGTK',
        hops: ['BT', 'VERYLONGTK'],
        amount: '100',
      });
    });
  });

  describe('Real world examples', () => {
    test('should parse common Stellar tokens', () => {
      const result = parseTradeHops('1000 XLM → USDC → AQUA');
      expect(result).toEqual({
        fromToken: 'XLM',
        toToken: 'AQUA',
        hops: ['XLM', 'USDC', 'AQUA'],
        amount: '1000',
      });
    });

    test('should parse popular crypto tokens', () => {
      const result = parseTradeHops('0.5 BTC → USDT → ETH');
      expect(result).toEqual({
        fromToken: 'BTC',
        toToken: 'ETH',
        hops: ['BTC', 'USDT', 'ETH'],
        amount: '0.5',
      });
    });

    test('should parse stablecoin to stablecoin trade', () => {
      const result = parseTradeHops('1000 USDC → USDT');
      expect(result).toEqual({
        fromToken: 'USDC',
        toToken: 'USDT',
        hops: ['USDC', 'USDT'],
        amount: '1000',
      });
    });
  });
});