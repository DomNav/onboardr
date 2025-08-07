// Supabase database migration utilities
import { supabase, CREATE_MESSAGES_TABLE } from './supabase'

/**
 * Initialize the Supabase database schema for vector storage
 * This should be run once when setting up the project
 */
export async function initializeDatabase(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }

  try {
    console.log('Initializing Supabase database schema...');

    // Execute the table creation SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: CREATE_MESSAGES_TABLE
    });

    if (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }

    console.log('✅ Database schema initialized successfully');

    // Test the connection by creating the search function
    await createSearchFunction();

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create the vector similarity search function
 */
async function createSearchFunction(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const searchFunctionSQL = `
    CREATE OR REPLACE FUNCTION search_similar_messages(
      query_embedding vector(1536),
      target_vector_key text,
      match_threshold float DEFAULT 0.7,
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id uuid,
      vector_key text,
      role text,
      content text,
      timestamp bigint,
      similarity float
    )
    LANGUAGE sql STABLE
    AS $$
      SELECT
        id,
        vector_key,
        role,
        content,
        timestamp,
        1 - (embedding <=> query_embedding) AS similarity
      FROM messages
      WHERE 
        vector_key = target_vector_key
        AND 1 - (embedding <=> query_embedding) > match_threshold
      ORDER BY embedding <=> query_embedding ASC
      LIMIT match_count;
    $$;
  `;

  const { error } = await supabase.rpc('exec_sql', {
    sql: searchFunctionSQL
  });

  if (error) {
    console.error('Failed to create search function:', error);
    throw error;
  }

  console.log('✅ Vector similarity search function created');
}

/**
 * Verify that the database is properly configured
 */
export async function verifyDatabaseSetup(): Promise<boolean> {
  if (!supabase) {
    console.error('❌ Supabase client not configured');
    return false;
  }

  try {
    // Check if messages table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'messages');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return false;
    }

    if (!tables || tables.length === 0) {
      console.error('❌ Messages table not found');
      return false;
    }

    // Check if pgvector extension is enabled
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('extname')
      .eq('extname', 'vector');

    if (extError) {
      console.warn('Could not verify pgvector extension:', extError);
    }

    if (!extensions || extensions.length === 0) {
      console.error('❌ pgvector extension not found');
      return false;
    }

    // Test basic operations
    const testVectorKey = 'test_setup_verification';
    
    // Try to insert a test message
    const testMessage = {
      vector_key: testVectorKey,
      role: 'user',
      content: 'Test message for setup verification',
      embedding: new Array(1536).fill(0), // Zero vector for testing
      timestamp: Date.now()
    };

    const { error: insertError } = await supabase
      .from('messages')
      .insert(testMessage);

    if (insertError) {
      console.error('❌ Failed to insert test message:', insertError);
      return false;
    }

    // Clean up test message
    await supabase
      .from('messages')
      .delete()
      .eq('vector_key', testVectorKey);

    console.log('✅ Database setup verification passed');
    return true;

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

/**
 * Get database statistics and health info
 */
export async function getDatabaseStats(): Promise<{
  totalMessages: number;
  uniqueVectorKeys: number;
  oldestMessage: number | null;
  newestMessage: number | null;
}> {
  if (!supabase) {
    return {
      totalMessages: 0,
      uniqueVectorKeys: 0,
      oldestMessage: null,
      newestMessage: null
    };
  }

  try {
    // Get total message count
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get unique vector keys count (simplified approach)
    const { data: vectorKeys } = await supabase
      .from('messages')
      .select('vector_key')
      .then(result => {
        if (result.error) return { data: [] };
        const unique = new Set(result.data?.map(row => row.vector_key) || []);
        return { data: Array.from(unique) };
      });

    // Get timestamp range
    const { data: timestampRange } = await supabase
      .from('messages')
      .select('timestamp')
      .order('timestamp', { ascending: true })
      .limit(1)
      .single();

    const { data: newestTimestamp } = await supabase
      .from('messages')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      totalMessages: totalMessages || 0,
      uniqueVectorKeys: vectorKeys?.length || 0,
      oldestMessage: timestampRange?.timestamp || null,
      newestMessage: newestTimestamp?.timestamp || null
    };

  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      totalMessages: 0,
      uniqueVectorKeys: 0,
      oldestMessage: null,
      newestMessage: null
    };
  }
}