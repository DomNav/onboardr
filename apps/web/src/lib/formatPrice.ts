import { Currency } from './currencies';

// Mock exchange rates - in a real app, this would come from an API
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.5,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  BRL: 5.25,
  MXN: 20.5,
  KRW: 1150,
  SGD: 1.35,
  HKD: 7.8,
  SEK: 8.5,
  NOK: 8.8,
  DKK: 6.3,
  PLN: 3.8,
  TRY: 8.5,
  RUB: 75.5,
  ZAR: 14.5,
  THB: 32.5,
  MYR: 4.15,
  IDR: 14250,
  PHP: 50.5,
  ILS: 3.25,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.30,
  BHD: 0.38,
  OMR: 0.38,
  JOD: 0.71,
  LBP: 1500,
  EGP: 15.7,
  NGN: 410,
  KES: 108,
  GHS: 5.85,
  UGX: 3500,
  TZS: 2300,
  ETB: 43.5,
  MAD: 9.0,
  TND: 2.75,
  DZD: 135,
  LYD: 4.5,
  SDG: 55.5,
  CZK: 21.5,
  HUF: 300,
  RON: 4.15,
  BGN: 1.63,
  HRK: 6.3,
  RSD: 100,
  UAH: 27.5,
  BYN: 2.5,
  KZT: 425,
  UZS: 10500,
  AZN: 1.7,
  GEL: 3.1,
  AMD: 520,
  MDL: 17.5,
  ALL: 100,
  MKD: 51.5,
  BAM: 1.63,
  MNT: 2850,
  KGS: 84.5,
  TJS: 11.3,
  TMT: 3.5,
  AFN: 77.5,
  PKR: 155,
  BDT: 85.5,
  LKR: 200,
  NPR: 120,
  BTN: 74.5,
  MMK: 1650,
  LAK: 9500,
  KHR: 4050,
  VND: 23000,
  MOP: 8.0,
  TWD: 28.0,
  HNL: 24.5,
  GTQ: 7.75,
  BZD: 2.0,
  SVC: 8.75,
  NIO: 35.5,
  CRC: 625,
  PAB: 1.0,
  PYG: 7000,
  UYU: 43.5,
  ARS: 95.5,
  CLP: 750,
  PEN: 3.95,
  BOB: 6.9,
  COP: 3800,
  VES: 2500000,
  GYD: 210,
  SRD: 21.5,
  TTD: 6.75,
  JMD: 150,
  HTG: 100,
  DOP: 58.5,
  CUC: 1.0,
  CUP: 25.0,
  XCD: 2.7,
  BBD: 2.0,
  AWG: 1.8,
  ANG: 1.8,
  KYD: 0.83,
  BMD: 1.0,
  FJD: 2.1,
  WST: 2.6,
  TOP: 2.3,
  SBD: 8.1,
  VUV: 110,
  NZD: 1.4,
  PGK: 3.5,
  CDF: 2000,
  XAF: 550,
  XOF: 550,
  XPF: 110,
  KMF: 440,
  DJF: 178,
  GNF: 10200,
  MGA: 3900,
  MUR: 40.5,
  SCR: 13.5,
  SOS: 580,
  SSP: 55.5,
  ERN: 15.0,
  STN: 20.5,
  CVE: 95.5,
  GMD: 52.5,
  GIP: 0.73,
  FKP: 0.73,
  SHP: 0.73,
  IMP: 0.73,
  JEP: 0.73,
  GGP: 0.73,
  AOA: 650,
  BWP: 10.8,
  LSL: 14.5,
  NAD: 14.5,
  SZL: 14.5,
  ZMW: 18.5,
  MWK: 815,
  ZWL: 350,
  BIF: 2000,
  RWF: 1000,
  MZN: 60.5,
};

/**
 * Format a price in the selected currency
 * @param amount - The amount in USD
 * @param currency - The target currency
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
    showCode = false
  } = options;

  // Get exchange rate (fallback to USD if not available)
  const exchangeRate = MOCK_EXCHANGE_RATES[currency.code] || 1;
  const convertedAmount = amount * exchangeRate;

  // Format the number
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formattedNumber = formatter.format(convertedAmount);

  // Build the result string
  let result = '';
  
  if (showSymbol) {
    result += currency.symbol;
  }
  
  result += formattedNumber;
  
  if (showCode) {
    result += ` ${currency.code}`;
  }

  return result;
}

/**
 * Format a price with fallback to USD if conversion fails
 * @param amount - The amount in USD
 * @param currency - The target currency
 * @param options - Formatting options
 * @returns Formatted price string or "—" if conversion fails
 */
export function formatPriceWithFallback(
  amount: number,
  currency: Currency,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    showCode?: boolean;
  } = {}
): string {
  try {
    // Check if we have exchange rate data
    const exchangeRate = MOCK_EXCHANGE_RATES[currency.code];
    if (!exchangeRate) {
      // Fallback to USD if no exchange rate available
      return formatPrice(amount, { code: 'USD', symbol: '$', name: 'United States Dollar', numericCode: '840' }, options);
    }
    
    return formatPrice(amount, currency, options);
  } catch (error) {
    console.warn('Failed to format price:', error);
    return '—';
  }
}

/**
 * Convert USD amount to target currency
 * @param usdAmount - Amount in USD
 * @param targetCurrency - Target currency code
 * @returns Converted amount or null if conversion fails
 */
export function convertUSDToCurrency(usdAmount: number, targetCurrency: string): number | null {
  const exchangeRate = MOCK_EXCHANGE_RATES[targetCurrency];
  if (!exchangeRate) {
    return null;
  }
  return usdAmount * exchangeRate;
} 