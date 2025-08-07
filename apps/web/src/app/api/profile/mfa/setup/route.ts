import { NextResponse } from 'next/server';
import speakeasy, { GenerateSecretOptions } from 'speakeasy';
import * as QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Onboardr:${userId}`,
      issuer: 'Onboardr DeFi',
      length: 32,
    } satisfies GenerateSecretOptions);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Hash the secret before storing
    const hashedSecret = await hash(secret.base32, 12);

    // Store in database (temporarily - will be confirmed on verification)
    const { error } = await supabase
      .from('user_mfa_temp')
      .upsert({
        user_id: userId,
        secret_hash: hashedSecret,
        backup_codes: backupCodes,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to setup MFA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}