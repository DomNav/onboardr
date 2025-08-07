import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { token, secret } = await req.json();
    
    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required' },
        { status: 400 }
      );
    }

    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      token,
      window: 2, // Allow 2 time steps (60 seconds) of drift
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Get temporary MFA data
    const { data: tempData, error: tempError } = await supabase
      .from('user_mfa_temp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tempError || !tempData) {
      return NextResponse.json(
        { error: 'MFA setup session expired' },
        { status: 400 }
      );
    }

    // Hash the secret for permanent storage
    const hashedSecret = await hash(secret, 12);

    // Move to permanent MFA table
    const { error: mfaError } = await supabase
      .from('user_mfa')
      .upsert({
        user_id: userId,
        secret_hash: hashedSecret,
        backup_codes: tempData.backup_codes,
        enabled: true,
        created_at: new Date().toISOString(),
      });

    if (mfaError) {
      console.error('Database error:', mfaError);
      return NextResponse.json(
        { error: 'Failed to enable MFA' },
        { status: 500 }
      );
    }

    // Clean up temporary data
    await supabase
      .from('user_mfa_temp')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}