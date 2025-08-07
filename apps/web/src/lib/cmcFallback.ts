/**
 * Fallback data for CoinMarketCap API when API key is missing
 * This provides static demo data to prevent charts from breaking
 */

// Generate mock OHLCV data for the last 24 hours
export function generateMockOHLCVData() {
  const now = new Date();
  const data = [];
  
  // Generate 24 hourly candles
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const basePrice = 0.60 + (Math.random() * 0.1 - 0.05); // XLM around $0.60
    
    data.push({
      time_open: timestamp.toISOString(),
      time_close: new Date(timestamp.getTime() + 60 * 60 * 1000).toISOString(),
      open: basePrice,
      high: basePrice + Math.random() * 0.02,
      low: basePrice - Math.random() * 0.02,
      close: basePrice + (Math.random() * 0.02 - 0.01),
      volume: 1000000 + Math.random() * 500000,
      market_cap: basePrice * 30000000000, // 30B supply
      quote: {
        USD: {
          open: basePrice,
          high: basePrice + Math.random() * 0.02,
          low: basePrice - Math.random() * 0.02,
          close: basePrice + (Math.random() * 0.02 - 0.01),
          volume: 1000000 + Math.random() * 500000,
          market_cap: basePrice * 30000000000,
          timestamp: timestamp.toISOString()
        }
      }
    });
  }
  
  return {
    status: {
      timestamp: now.toISOString(),
      error_code: 0,
      error_message: null,
      elapsed: 10,
      credit_count: 0,
      notice: "Using fallback data - CMC_API_KEY not configured"
    },
    data: {
      quotes: data,
      id: 512,
      name: "Stellar",
      symbol: "XLM"
    }
  };
}

// Generate mock quotes data
export function generateMockQuotesData() {
  const mockData = {
    "512": { // XLM
      id: 512,
      name: "Stellar",
      symbol: "XLM",
      slug: "stellar",
      quote: {
        USD: {
          price: 0.6123,
          volume_24h: 234567890,
          volume_change_24h: 12.34,
          percent_change_1h: 0.52,
          percent_change_24h: 2.15,
          percent_change_7d: -3.21,
          percent_change_30d: 15.67,
          market_cap: 18369000000,
          market_cap_dominance: 0.45,
          fully_diluted_market_cap: 30615000000,
          last_updated: new Date().toISOString()
        }
      }
    },
    "1": { // BTC  
      id: 1,
      name: "Bitcoin",
      symbol: "BTC",
      slug: "bitcoin",
      quote: {
        USD: {
          price: 101234.56,
          volume_24h: 12345678900,
          volume_change_24h: 5.67,
          percent_change_1h: 0.12,
          percent_change_24h: 1.34,
          percent_change_7d: 8.90,
          percent_change_30d: 25.45,
          market_cap: 1987654321000,
          market_cap_dominance: 53.21,
          fully_diluted_market_cap: 2125678901000,
          last_updated: new Date().toISOString()
        }
      }
    },
    "1027": { // ETH
      id: 1027,
      name: "Ethereum", 
      symbol: "ETH",
      slug: "ethereum",
      quote: {
        USD: {
          price: 3456.78,
          volume_24h: 9876543210,
          volume_change_24h: 8.90,
          percent_change_1h: 0.34,
          percent_change_24h: 2.56,
          percent_change_7d: 12.34,
          percent_change_30d: 34.56,
          market_cap: 415678901234,
          market_cap_dominance: 18.76,
          fully_diluted_market_cap: 415678901234,
          last_updated: new Date().toISOString()
        }
      }
    }
  };
  
  return {
    status: {
      timestamp: new Date().toISOString(),
      error_code: 0,
      error_message: null,
      elapsed: 10,
      credit_count: 0,
      notice: "Using fallback data - CMC_API_KEY not configured"
    },
    data: mockData
  };
}

// Check if we should use fallback data
export function shouldUseFallback(): boolean {
  return !process.env.CMC_API_KEY || process.env.CMC_API_KEY.trim() === '';
}