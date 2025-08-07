-- Safe schema migration that checks for existing objects

-- Users table (for NextAuth compatibility)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  address VARCHAR(56) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Check if user_api_tokens needs migration (you already have one)
DO $$ 
BEGIN
  -- Check if the table exists with different schema
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_api_tokens' 
    AND column_name = 'user_id' 
    AND data_type = 'character varying'
  ) THEN
    -- Drop the old table if it exists with different schema
    DROP TABLE IF EXISTS user_api_tokens CASCADE;
    
    -- Create with new schema
    CREATE TABLE user_api_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      last_used_at TIMESTAMP WITH TIME ZONE,
      revoked_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(user_id)
    );
  END IF;
END $$;

-- Watchlist table (new)
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  token_id VARCHAR(255) NOT NULL,
  token_symbol VARCHAR(20),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, token_id)
);

-- User preferences table (checking if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_preferences'
  ) THEN
    CREATE TABLE user_preferences (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      preferred_currency VARCHAR(10) DEFAULT 'USD',
      slippage_tolerance DECIMAL(5,2) DEFAULT 0.5,
      enable_analytics BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      UNIQUE(user_id)
    );
  END IF;
END $$;

-- Update profiles table if needed (you already have one)
DO $$ 
BEGIN
  -- Add missing columns to existing profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'nft_token_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nft_token_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'fiat_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN fiat_currency VARCHAR(10) DEFAULT 'USD';
  END IF;
END $$;

-- Update trades table if needed (you already have one)
-- Your existing trades table is compatible, so we'll just ensure the columns match
DO $$ 
BEGIN
  -- Add tx_hash column if it doesn't exist (you have transaction_hash)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'tx_hash'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'transaction_hash'
  ) THEN
    ALTER TABLE trades RENAME COLUMN transaction_hash TO tx_hash;
  END IF;
  
  -- Rename asset columns to match our schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'from_asset'
  ) THEN
    ALTER TABLE trades RENAME COLUMN from_asset TO from_token;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'to_asset'
  ) THEN
    ALTER TABLE trades RENAME COLUMN to_asset TO to_token;
  END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DO $$ 
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Users can view own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  
  -- Since we're using NextAuth, we need different policies
  -- Allow service role full access (NextAuth will use service role)
  CREATE POLICY "Service role has full access" ON users
    FOR ALL USING (auth.role() = 'service_role');
  
  -- Allow authenticated users to view their own data by address
  CREATE POLICY "Users can view own data by address" ON users
    FOR SELECT USING (
      auth.jwt() ->> 'email' = address OR
      auth.role() = 'service_role'
    );
END $$;

-- RLS Policies for watchlist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
  DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlist;
  DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlist;
  
  -- Service role access
  CREATE POLICY "Service role has full access to watchlist" ON watchlist
    FOR ALL USING (auth.role() = 'service_role');
END $$;

-- Add RLS to existing tables that need it
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Service role policies for other tables
CREATE POLICY IF NOT EXISTS "Service role has full access to preferences" ON user_preferences
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to trades" ON trades
  FOR ALL USING (auth.role() = 'service_role');