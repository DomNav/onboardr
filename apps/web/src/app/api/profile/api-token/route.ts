import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { withAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const supabase = createClient();

    // Generate a secure random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');
    const tokenHash = await hash(token, 12);

    // Store the hashed token in database
    const { error } = await supabase
      .from('user_api_tokens')
      .upsert({
        user_id: userId,
        token_hash: tokenHash,
        created_at: new Date().toISOString(),
        last_used_at: null,
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to generate API token' },
        { status: 500 }
      );
    }

      // Return the raw token (only time it's shown)
      return NextResponse.json({ token });

    } catch (error) {
      console.error('API token generation error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE() {
  return withAuth(async (session) => {
    try {
      const userId = session.user.id;
      const supabase = createClient();

    // Delete the API token
    const { error } = await supabase
      .from('user_api_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to revoke API token' },
        { status: 500 }
      );
    }

      return NextResponse.json({ success: true });

    } catch (error) {
      console.error('API token revocation error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}