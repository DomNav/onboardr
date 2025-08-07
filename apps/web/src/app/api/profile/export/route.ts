import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import archiver from 'archiver';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // TODO: Get user from session/auth
    const userId = 'demo-user'; // Replace with actual user ID from auth

    // Collect user data from various tables
    const [profileData, tradesData, metricsData, preferencesData] = await Promise.allSettled([
      // Profile data
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // Trade history
      supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Portfolio metrics
      supabase
        .from('portfolio_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      
      // User preferences
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);

    // Build export data object
    const exportData = {
      export_info: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: '1.0',
      },
      profile: profileData.status === 'fulfilled' ? profileData.value.data : null,
      trades: tradesData.status === 'fulfilled' ? tradesData.value.data : [],
      metrics: metricsData.status === 'fulfilled' ? metricsData.value.data : [],
      preferences: preferencesData.status === 'fulfilled' ? preferencesData.value.data : null,
    };

    // Ensure trades and metrics are arrays before any access
    if (!exportData.trades) exportData.trades = [];
    if (!exportData.metrics) exportData.metrics = [];

    // Create a zip file in memory
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create readable stream from archive
    const chunks: Uint8Array[] = [];
    
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    archive.on('error', (err) => {
      throw err;
    });

    // Add files to the archive
    archive.append(JSON.stringify(exportData, null, 2), { 
      name: 'profile-data.json' 
    });

    // Add individual data files for easier parsing
    if (exportData.trades.length > 0) {
      archive.append(JSON.stringify(exportData.trades, null, 2), { 
        name: 'trades.json' 
      });
    }

    if (exportData.metrics.length > 0) {
      archive.append(JSON.stringify(exportData.metrics, null, 2), { 
        name: 'portfolio-metrics.json' 
      });
    }

    // Add README
    const readme = `# Your Onboardr Data Export

This archive contains all your personal data from Onboardr, exported on ${new Date().toISOString()}.

## Files included:

- profile-data.json: Complete data export including profile, trades, metrics, and preferences
- trades.json: Your trading history (if any)
- portfolio-metrics.json: Your portfolio performance metrics (if any)

## Data Usage

This data is provided in JSON format for easy parsing and analysis. You can use this data with any JSON-compatible tools or import it into other applications.

## Privacy Notice

This export contains all your personal data. Please handle it securely and delete it when no longer needed.

For questions about your data, please contact support.
`;

    archive.append(readme, { name: 'README.txt' });

    // Finalize the archive
    await archive.finalize();

    // Wait for all chunks to be collected
    return new Promise<NextResponse>((resolve) => {
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        resolve(new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="onboardr-data-${userId}-${new Date().toISOString().split('T')[0]}.zip"`,
            'Content-Length': buffer.length.toString(),
          },
        }));
      });
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}