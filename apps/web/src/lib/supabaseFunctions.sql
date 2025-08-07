-- Supabase SQL functions for vector similarity search

-- Function to search for similar messages using cosine similarity
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

-- Function to get conversation statistics
CREATE OR REPLACE FUNCTION get_conversation_stats(target_vector_key text)
RETURNS TABLE (
  total_messages bigint,
  user_messages bigint,
  assistant_messages bigint,
  first_message_timestamp bigint,
  last_message_timestamp bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE role = 'user') as user_messages,
    COUNT(*) FILTER (WHERE role = 'assistant') as assistant_messages,
    MIN(timestamp) as first_message_timestamp,
    MAX(timestamp) as last_message_timestamp
  FROM messages
  WHERE vector_key = target_vector_key;
$$;

-- Function to cleanup old messages (keep only N most recent)
CREATE OR REPLACE FUNCTION cleanup_old_messages(
  target_vector_key text,
  keep_count int DEFAULT 100
)
RETURNS int
LANGUAGE sql
AS $$
  WITH messages_to_delete AS (
    SELECT id
    FROM messages
    WHERE vector_key = target_vector_key
    ORDER BY timestamp DESC
    OFFSET keep_count
  )
  DELETE FROM messages
  WHERE id IN (SELECT id FROM messages_to_delete);
  
  -- Return number of deleted messages
  SELECT COUNT(*)::int FROM messages_to_delete;
$$;

-- Index for better performance on vector operations
-- (These should be run separately as they may take time on large datasets)

-- CONCURRENTLY option allows the index to be built without locking the table
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_embedding_cosine_idx 
-- ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- For exact similarity searches, you might want to add:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_embedding_l2_idx 
-- ON messages USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Composite index for efficient filtering + vector search
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_vector_key_embedding_idx 
-- ON messages (vector_key) INCLUDE (embedding);