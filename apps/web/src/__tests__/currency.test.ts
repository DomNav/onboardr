import { CURRENCIES, findCurrencyByCode, getCurrencyDisplayText, DEFAULT_CURRENCY } from '@/lib/currencies';
import { formatPrice, formatPriceWithFallback, convertUSDToCurrency } from '@/lib/formatPrice';

describe('Currency Utilities', () => {
  describe('findCurrencyByCode', () => {
    it('should find USD currency', () => {
      const usd = findCurrencyByCode('USD');
      expect(usd).toBeDefined();
      expect(usd?.code).toBe('USD');
      expect(usd?.symbol).toBe('$');
    });

    it('should find EUR currency', () => {
      const eur = findCurrencyByCode('EUR');
      expect(eur).toBeDefined();
      expect(eur?.code).toBe('EUR');
      expect(eur?.symbol).toBe('€');
    });

    it('should return undefined for invalid currency code', () => {
      const invalid = findCurrencyByCode('INVALID');
      expect(invalid).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const usd = findCurrencyByCode('usd');
      expect(usd?.code).toBe('USD');
    });
  });

  describe('getCurrencyDisplayText', () => {
    it('should format currency display text correctly', () => {
      const usd = findCurrencyByCode('USD');
      const displayText = getCurrencyDisplayText(usd!);
      expect(displayText).toBe('$ USD · United States Dollar');
    });
  });

  describe('DEFAULT_CURRENCY', () => {
    it('should be USD', () => {
      expect(DEFAULT_CURRENCY.code).toBe('USD');
      expect(DEFAULT_CURRENCY.symbol).toBe('$');
    });
  });

  describe('CURRENCIES array', () => {
    it('should contain at least 100 currencies', () => {
      expect(CURRENCIES.length).toBeGreaterThanOrEqual(100);
    });

    it('should have unique currency codes', () => {
      const codes = CURRENCIES.map(c => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(CURRENCIES.length);
    });
  });
});

describe('Price Formatting', () => {
  const usdCurrency = findCurrencyByCode('USD')!;
  const eurCurrency = findCurrencyByCode('EUR')!;
  const jpyCurrency = findCurrencyByCode('JPY')!;

  describe('formatPrice', () => {
    it('should format USD price correctly', () => {
      const result = formatPrice(1234.56, usdCurrency);
      expect(result).toBe('$1,234.56');
    });

    it('should format EUR price correctly', () => {
      const result = formatPrice(100, eurCurrency);
      expect(result).toBe('€85.00');
    });

    it('should format JPY price correctly', () => {
      const result = formatPrice(1, jpyCurrency);
      expect(result).toBe('¥110.50');
    });

    it('should handle custom formatting options', () => {
      const result = formatPrice(1234.56, usdCurrency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        showSymbol: false,
        showCode: true
      });
      expect(result).toBe('1,235 USD');
    });
  });

  describe('formatPriceWithFallback', () => {
    it('should format price normally when exchange rate is available', () => {
      const result = formatPriceWithFallback(100, eurCurrency);
      expect(result).toBe('€85.00');
    });

    it('should fallback to USD for unknown currencies', () => {
      const unknownCurrency = { code: 'UNKNOWN', symbol: '?', name: 'Unknown', numericCode: '999' };
      const result = formatPriceWithFallback(100, unknownCurrency);
      expect(result).toBe('$100.00');
    });

    it('should return "—" on error', () => {
      // Mock a function that throws an error
      const originalFormatPrice = formatPrice;
      jest.spyOn(require('@/lib/formatPrice'), 'formatPrice').mockImplementation(() => {
        throw new Error('Format error');
      });

      const result = formatPriceWithFallback(100, usdCurrency);
      expect(result).toBe('—');

      // Restore original function
      jest.restoreAllMocks();
    });
  });

  describe('convertUSDToCurrency', () => {
    it('should convert USD to EUR correctly', () => {
      const result = convertUSDToCurrency(100, 'EUR');
      expect(result).toBe(85);
    });

    it('should convert USD to JPY correctly', () => {
      const result = convertUSDToCurrency(1, 'JPY');
      expect(result).toBe(110.5);
    });

    it('should return null for unknown currency', () => {
      const result = convertUSDToCurrency(100, 'UNKNOWN');
      expect(result).toBeNull();
    });
  });
}); 