/**
 * Environment variable validation utilities
 */

export interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
}

export function validateSacNftEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missingVars: [],
    errors: []
  };

  // Required environment variables for SAC NFT minting
  const requiredVars = [
    'SPONSOR_SECRET_KEY',
    'SPONSOR_PUBLIC_KEY',
    'STELLAR_NETWORK'
  ];

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.missingVars.push(varName);
      result.isValid = false;
    }
  }

  // Validate SPONSOR_SECRET_KEY format if present
  if (process.env.SPONSOR_SECRET_KEY) {
    if (!process.env.SPONSOR_SECRET_KEY.startsWith('S') || process.env.SPONSOR_SECRET_KEY.length !== 56) {
      result.errors.push('SPONSOR_SECRET_KEY must be a valid Stellar secret key (starts with S, 56 characters)');
      result.isValid = false;
    }
  }

  // Validate SPONSOR_PUBLIC_KEY format if present
  if (process.env.SPONSOR_PUBLIC_KEY) {
    if (!process.env.SPONSOR_PUBLIC_KEY.startsWith('G') || process.env.SPONSOR_PUBLIC_KEY.length !== 56) {
      result.errors.push('SPONSOR_PUBLIC_KEY must be a valid Stellar public key (starts with G, 56 characters)');
      result.isValid = false;
    }
  }

  // Validate STELLAR_NETWORK value
  if (process.env.STELLAR_NETWORK && !['testnet', 'mainnet'].includes(process.env.STELLAR_NETWORK)) {
    result.errors.push('STELLAR_NETWORK must be either "testnet" or "mainnet"');
    result.isValid = false;
  }

  return result;
}

export function validateSupabaseEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missingVars: [],
    errors: []
  };

  // Required Supabase environment variables
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.missingVars.push(varName);
      result.isValid = false;
    }
  }

  // Validate SUPABASE_URL format
  if (process.env.SUPABASE_URL) {
    try {
      const url = new URL(process.env.SUPABASE_URL);
      if (!url.hostname.endsWith('.supabase.co')) {
        result.errors.push('SUPABASE_URL must be a valid Supabase project URL');
        result.isValid = false;
      }
    } catch {
      result.errors.push('SUPABASE_URL must be a valid URL');
      result.isValid = false;
    }
  }

  return result;
}

export function validateCoinMarketCapEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missingVars: [],
    errors: []
  };

  // Required CoinMarketCap environment variables
  const requiredVars = ['CMC_API_KEY'];

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      result.missingVars.push(varName);
      result.isValid = false;
    }
  }

  // Validate CMC_API_KEY format if present
  if (process.env.CMC_API_KEY) {
    if (process.env.CMC_API_KEY.length < 36) {
      result.errors.push('CMC_API_KEY must be a valid CoinMarketCap API key (minimum 36 characters)');
      result.isValid = false;
    }
  }

  return result;
}

export function getEnvironmentStatus() {
  const sacNft = validateSacNftEnvironment();
  const supabase = validateSupabaseEnvironment();
  const coinMarketCap = validateCoinMarketCapEnvironment();

  return {
    sacNft,
    supabase,
    coinMarketCap,
    overall: sacNft.isValid && supabase.isValid && coinMarketCap.isValid
  };
}