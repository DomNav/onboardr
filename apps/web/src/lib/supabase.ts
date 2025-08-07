import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

// Only create client if both URL and key are provided
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database schema for vector storage
export interface VectorMessage {
  id: string
  vector_key: string
  role: 'user' | 'assistant'
  content: string
  embedding: number[]
  timestamp: number
  created_at: string
}

// SQL for creating the messages table with pgvector
export const CREATE_MESSAGES_TABLE = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create messages table with vector embeddings
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vector_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create index for vector similarity search
  INDEX CONCURRENTLY IF NOT EXISTS messages_embedding_idx ON messages 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  
  -- Create index for efficient filtering by vector_key
  INDEX IF NOT EXISTS messages_vector_key_idx ON messages(vector_key);
  
  -- Create index for timestamp ordering
  INDEX IF NOT EXISTS messages_timestamp_idx ON messages(timestamp DESC);
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (TRUE);
`