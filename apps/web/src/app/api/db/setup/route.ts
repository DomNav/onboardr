import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    // Check for admin token in header
    const adminToken = request.headers.get('x-admin-token');
    
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createClient();
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src/lib/supabase/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    const results = [];
    const errors = [];
    
    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          errors.push({ statement: statement.substring(0, 50) + '...', error });
        } else {
          results.push({ statement: statement.substring(0, 50) + '...', success: true });
        }
      } catch (err) {
        errors.push({ statement: statement.substring(0, 50) + '...', error: err });
      }
    }
    
    return NextResponse.json({ 
      message: 'Database setup completed',
      results,
      errors,
      totalStatements: statements.length,
      successCount: results.length,
      errorCount: errors.length
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'Failed to setup database' },
      { status: 500 }
    );
  }
}