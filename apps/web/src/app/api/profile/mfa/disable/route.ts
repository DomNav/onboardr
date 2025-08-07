import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Disable MFA for the user
    const { error } = await supabase
      .from('user_mfa')
      .update({ 
        enabled: false,
        disabled_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to disable MFA' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}