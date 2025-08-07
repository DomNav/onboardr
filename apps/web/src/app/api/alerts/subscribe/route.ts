import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const alertPrefs = await req.json();
    
    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Validate alert preferences
    const validKeys = ['trades', 'priceMoves', 'liquidations', 'weeklyDigest'];
    const filteredPrefs = Object.keys(alertPrefs)
      .filter(key => validKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = Boolean(alertPrefs[key]);
        return obj;
      }, {} as Record<string, boolean>);

    if (Object.keys(filteredPrefs).length === 0) {
      return NextResponse.json(
        { error: 'No valid alert preferences provided' },
        { status: 400 }
      );
    }

    // Update alert preferences in database
    const { error } = await supabase
      .from('alert_preferences')
      .upsert({
        user_id: userId,
        notify_trades: filteredPrefs.trades,
        notify_price_moves: filteredPrefs.priceMoves,
        notify_liquidations: filteredPrefs.liquidations,
        notify_weekly_digest: filteredPrefs.weeklyDigest,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update alert preferences' },
        { status: 500 }
      );
    }

    // TODO: Here you would typically trigger any necessary webhook calls
    // to external notification services (email, push notifications, etc.)

    return NextResponse.json({ 
      success: true,
      preferences: filteredPrefs
    });

  } catch (error) {
    console.error('Alert subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  try {
    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Fetch current alert preferences
    const { data, error } = await supabase
      .from('alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alert preferences' },
        { status: 500 }
      );
    }

    // Return preferences or defaults
    const preferences = data ? {
      trades: data.notify_trades,
      priceMoves: data.notify_price_moves,
      liquidations: data.notify_liquidations,
      weeklyDigest: data.notify_weekly_digest,
    } : {
      trades: true,
      priceMoves: true,
      liquidations: true,
      weeklyDigest: false,
    };

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Alert preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}