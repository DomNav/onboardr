/**
 * Chart data validation utilities for Recharts components
 * Ensures data is valid before rendering to prevent runtime errors
 */

/**
 * Generic chart data validation
 * Checks if data is a non-empty array
 */
export function isValidChartData<T>(data: T[] | null | undefined): data is T[] {
  return Array.isArray(data) && data.length > 0;
}

/**
 * Validates numeric chart data points
 * Ensures all required numeric fields are valid numbers
 */
export function validateNumericData<T extends Record<string, any>>(
  data: T[],
  numericFields: string[]
): boolean {
  if (!isValidChartData(data)) return false;
  
  return data.every(item => 
    numericFields.every(field => 
      typeof item[field] === 'number' && 
      !isNaN(item[field]) && 
      isFinite(item[field])
    )
  );
}

/**
 * Validates time series data
 * Ensures date/time fields are valid
 */
export function validateTimeSeriesData<T extends { time?: string | Date; date?: string | Date }>(
  data: T[]
): boolean {
  if (!isValidChartData(data)) return false;
  
  return data.every(item => {
    const timeValue = item.time || item.date;
    if (!timeValue) return false;
    
    // Check if it's a valid date
    const date = new Date(timeValue);
    return !isNaN(date.getTime());
  });
}

/**
 * Validates OHLCV (candlestick) data
 */
export function validateOHLCVData(data: any[]): boolean {
  if (!isValidChartData(data)) return false;
  
  return data.every(candle => 
    typeof candle.open === 'number' &&
    typeof candle.high === 'number' &&
    typeof candle.low === 'number' &&
    typeof candle.close === 'number' &&
    candle.high >= candle.low &&
    candle.high >= candle.open &&
    candle.high >= candle.close &&
    candle.low <= candle.open &&
    candle.low <= candle.close
  );
}

/**
 * Validates pie chart data
 */
export function validatePieChartData(data: any[]): boolean {
  if (!isValidChartData(data)) return false;
  
  return data.every(item => 
    typeof item.value === 'number' &&
    item.value >= 0 &&
    (typeof item.name === 'string' || typeof item.label === 'string')
  );
}

/**
 * Safe data transformation with validation
 * Returns empty array if data is invalid
 */
export function safeChartData<T>(
  data: T[] | null | undefined,
  validator?: (data: T[]) => boolean
): T[] {
  if (!isValidChartData(data)) return [];
  if (validator && !validator(data)) return [];
  return data;
}

/**
 * Chart error boundary component props
 */
export interface ChartErrorProps {
  error?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Standard chart error messages
 */
export const chartErrorMessages = {
  noData: 'No chart data available',
  invalidData: 'Invalid chart data format',
  loadError: 'Unable to load chart data',
  emptyData: 'No data to display',
} as const;