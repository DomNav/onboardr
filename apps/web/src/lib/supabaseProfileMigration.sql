-- Profile ecosystem database schema
-- Run this in your Supabase SQL editor to set up the required tables

-- Enable RLS (Row Level Security) for all tables
SET row_security = on;

-- Create user_mfa_temp table for temporary MFA setup
CREATE TABLE IF NOT EXISTS user_mfa_temp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    backup_codes TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id)
);

-- Create user_mfa table for permanent MFA settings
CREATE TABLE IF NOT EXISTS user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    secret_hash TEXT NOT NULL,
    backup_codes TEXT[] NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at TIMESTAMPTZ
);

-- Create user_api_tokens table for API token management
CREATE TABLE IF NOT EXISTS user_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Create alert_preferences table for notification settings
CREATE TABLE IF NOT EXISTS alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    notify_trades BOOLEAN NOT NULL DEFAULT true,
    notify_price_moves BOOLEAN NOT NULL DEFAULT true,
    notify_liquidations BOOLEAN NOT NULL DEFAULT true,
    notify_weekly_digest BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table (if not exists) for enhanced profile data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    nickname TEXT,
    vector_key TEXT,
    preferred_currency TEXT DEFAULT 'USD',
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trades table (if not exists) for trade history
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    from_asset TEXT NOT NULL,
    to_asset TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    price DECIMAL,
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create portfolio_metrics table (if not exists) for portfolio tracking
CREATE TABLE IF NOT EXISTS portfolio_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_value DECIMAL NOT NULL,
    daily_pnl DECIMAL DEFAULT 0,
    assets JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create user_preferences table (if not exists) for general preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT 'system',
    preferred_currency TEXT DEFAULT 'USD',
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_user_id ON user_mfa_temp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_temp_expires_at ON user_mfa_temp(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_tokens_user_id ON user_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_preferences_user_id ON alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_metrics_user_date ON portfolio_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add RLS policies (adjust these based on your authentication system)
-- Note: Replace 'auth.uid()' with your actual user identification method

-- user_mfa_temp policies
ALTER TABLE user_mfa_temp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own MFA temp data" ON user_mfa_temp
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- user_mfa policies  
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own MFA settings" ON user_mfa
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- user_api_tokens policies
ALTER TABLE user_api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own API tokens" ON user_api_tokens
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- alert_preferences policies
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own alert preferences" ON alert_preferences
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- trades policies
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (user_id = current_setting('app.current_user', true));
CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user', true));

-- portfolio_metrics policies
ALTER TABLE portfolio_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own portfolio metrics" ON portfolio_metrics
    FOR SELECT USING (user_id = current_setting('app.current_user', true));
CREATE POLICY "Users can insert their own portfolio metrics" ON portfolio_metrics
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user', true));

-- user_preferences policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (user_id = current_setting('app.current_user', true));

-- Create storage bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' 
        AND auth.role() = 'authenticated'
    );

-- Create function to clean up expired MFA temp records
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_temp()
RETURNS void AS $$
BEGIN
    DELETE FROM user_mfa_temp WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_alert_preferences_updated_at
    BEFORE UPDATE ON alert_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some helper functions
CREATE OR REPLACE FUNCTION get_user_profile_summary(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', row_to_json(p.*),
        'preferences', row_to_json(up.*),
        'alerts', row_to_json(ap.*),
        'mfa_enabled', CASE WHEN um.enabled IS NOT NULL THEN um.enabled ELSE false END,
        'has_api_token', CASE WHEN uat.id IS NOT NULL THEN true ELSE false END
    ) INTO result
    FROM profiles p
    LEFT JOIN user_preferences up ON p.user_id = up.user_id
    LEFT JOIN alert_preferences ap ON p.user_id = ap.user_id
    LEFT JOIN user_mfa um ON p.user_id = um.user_id AND um.enabled = true
    LEFT JOIN user_api_tokens uat ON p.user_id = uat.user_id
    WHERE p.user_id = p_user_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_mfa_temp IS 'Temporary MFA setup data with expiration';
COMMENT ON TABLE user_mfa IS 'Permanent user MFA settings and backup codes';
COMMENT ON TABLE user_api_tokens IS 'User API tokens for programmatic access';
COMMENT ON TABLE alert_preferences IS 'User notification preferences';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE trades IS 'User trading history';
COMMENT ON TABLE portfolio_metrics IS 'Daily portfolio performance metrics';
COMMENT ON TABLE user_preferences IS 'General user preferences';

-- Sample data for testing (optional - remove in production)
/*
INSERT INTO profiles (user_id, nickname, preferred_currency, locale) 
VALUES ('demo-user', 'Demo User', 'USD', 'en')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO alert_preferences (user_id) 
VALUES ('demo-user')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preferences (user_id) 
VALUES ('demo-user')
ON CONFLICT (user_id) DO NOTHING;
*/