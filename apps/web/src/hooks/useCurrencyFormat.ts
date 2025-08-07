import { useCurrency } from '@/contexts/CurrencyContext';
import { formatPrice, formatPriceWithFallback, convertUSDToCurrency } from '@/lib/formatPrice';

/**
 * Hook that provides currency formatting utilities with the current currency context
 */
export function useCurrencyFormat() {
  const { currency } = useCurrency();

  return {
    currency,
    formatPrice: (amount: number, options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showSymbol?: boolean;
      showCode?: boolean;
    }) => formatPrice(amount, currency, options),
    formatPriceWithFallback: (amount: number, options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showSymbol?: boolean;
      showCode?: boolean;
    }) => formatPriceWithFallback(amount, currency, options),
    convertUSD: (usdAmount: number) => convertUSDToCurrency(usdAmount, currency.code),
  };
} 