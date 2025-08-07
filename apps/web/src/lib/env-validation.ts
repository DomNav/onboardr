// Environment variable validation
export function validateEnv() {
  const required = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate format of certain variables
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.warn('NEXTAUTH_SECRET should be at least 32 characters for security');
  }

  if (process.env.STELLAR_NETWORK && !['testnet', 'mainnet'].includes(process.env.STELLAR_NETWORK)) {
    throw new Error('STELLAR_NETWORK must be either "testnet" or "mainnet"');
  }

  return true;
}

// Optional: Call this in your app initialization
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}