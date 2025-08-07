// Supabase-based MCP (Model Context Protocol) implementation with pgvector
import { supabase, VectorMessage } from './supabase'
import * as mockMcp from './mcp'

export interface VectorStore {
  id: string;
  name: string;
  vectorKey: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 * @param text - Text to embed
 * @returns Embedding vector
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Get or create a vector store for the given vectorKey
 * @param vectorKey - Unique key from Profile NFT metadata
 */
export async function getVectorStore(vectorKey: string): Promise<VectorStore> {
  if (!vectorKey) {
    throw new Error('vectorKey is required for MCP vector store');
  }

  // Fall back to mock implementation if Supabase not configured
  if (!supabase) {
    console.log('Supabase not configured, falling back to mock MCP store');
    const mockStore = await mockMcp.getVectorStore(vectorKey);
    return {
      id: mockStore.id,
      name: mockStore.name,
      vectorKey
    };
  }

  // Vector store is conceptual - we just return metadata
  const store: VectorStore = {
    id: vectorKey,
    name: `profile_${vectorKey.slice(0, 8)}`,
    vectorKey
  };

  console.log(`Using Supabase vector store for vectorKey: ${vectorKey.slice(0, 8)}...`);
  return store;
}

/**
 * Store a message in the user's vector store with embedding
 * @param vectorStore - The user's vector store
 * @param message - Message to store
 */
export async function storeMessage(vectorStore: VectorStore, message: Message): Promise<void> {
  // Fall back to mock implementation if Supabase not configured
  if (!supabase) {
    const mockStore = { id: vectorStore.id, name: vectorStore.name };
    return mockMcp.storeMessage(mockStore, message);
  }

  try {
    // Generate embedding for the message content
    const embedding = await generateEmbedding(message.content);

    // Insert message with embedding into Supabase
    const { error } = await supabase
      .from('messages')
      .insert({
        vector_key: vectorStore.vectorKey,
        role: message.role,
        content: message.content,
        embedding,
        timestamp: message.timestamp || Date.now()
      });

    if (error) {
      console.error('Failed to store message in Supabase:', error);
      throw error;
    }

    console.log(`Stored message in Supabase vector store ${vectorStore.id}: ${message.content.slice(0, 50)}...`);
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

/**
 * Retrieve recent conversation history for context
 * @param vectorStore - The user's vector store
 * @param limit - Number of recent messages to retrieve
 */
export async function getConversationHistory(vectorStore: VectorStore, limit: number = 10): Promise<Message[]> {
  // Fall back to mock implementation if Supabase not configured
  if (!supabase) {
    const mockStore = { id: vectorStore.id, name: vectorStore.name };
    return mockMcp.getConversationHistory(mockStore, limit);
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, timestamp')
      .eq('vector_key', vectorStore.vectorKey)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch conversation history:', error);
      return [];
    }

    // Return messages in chronological order (oldest first)
    return (data || [])
      .reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
}

/**
 * Search for relevant context using vector similarity
 * @param vectorStore - The user's vector store
 * @param query - Search query
 * @param limit - Number of similar messages to return
 * @param threshold - Similarity threshold (0-1, higher = more similar)
 */
export async function searchContext(
  vectorStore: VectorStore, 
  query: string, 
  limit: number = 5,
  threshold: number = 0.7
): Promise<Message[]> {
  // Fall back to mock implementation if Supabase not configured
  if (!supabase) {
    const mockStore = { id: vectorStore.id, name: vectorStore.name };
    return mockMcp.searchContext(mockStore, query);
  }

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using pgvector
    const { data, error } = await supabase.rpc('search_similar_messages', {
      query_embedding: queryEmbedding,
      target_vector_key: vectorStore.vectorKey,
      match_threshold: threshold,
      match_count: limit
    });

    if (error) {
      console.error('Failed to search context:', error);
      // Fallback to recent messages if vector search fails
      return getConversationHistory(vectorStore, limit);
    }

    return (data || []).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    }));
  } catch (error) {
    console.error('Error searching context:', error);
    // Fallback to recent messages if search fails
    return getConversationHistory(vectorStore, limit);
  }
}

/**
 * Bulk insert messages with embeddings (useful for migration or initialization)
 * @param vectorKey - The vector key for the messages
 * @param messages - Array of messages to insert
 */
export async function bulkStoreMessages(vectorKey: string, messages: Message[]): Promise<void> {
  // Fall back to individual inserts if Supabase not configured
  if (!supabase) {
    const store = await getVectorStore(vectorKey);
    for (const message of messages) {
      await storeMessage(store, message);
    }
    return;
  }

  try {
    // Generate embeddings in batches to avoid rate limits
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      batches.push(messages.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Generate embeddings for the batch
      const embeddings = await Promise.all(
        batch.map(msg => generateEmbedding(msg.content))
      );

      // Prepare data for insertion
      const insertData = batch.map((msg, index) => ({
        vector_key: vectorKey,
        role: msg.role,
        content: msg.content,
        embedding: embeddings[index],
        timestamp: msg.timestamp || Date.now()
      }));

      // Insert batch into Supabase
      const { error } = await supabase
        .from('messages')
        .insert(insertData);

      if (error) {
        console.error('Failed to bulk insert messages:', error);
        throw error;
      }

      // Rate limiting - wait between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Bulk stored ${messages.length} messages for vectorKey: ${vectorKey.slice(0, 8)}...`);
  } catch (error) {
    console.error('Error in bulk store:', error);
    throw error;
  }
}

/**
 * Clear all messages for a vector store (for testing)
 * @param vectorKey - The vectorKey to clear
 */
export async function clearVectorStore(vectorKey: string): Promise<void> {
  // Fall back to mock implementation if Supabase not configured
  if (!supabase) {
    return mockMcp.clearVectorStore(vectorKey);
  }

  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('vector_key', vectorKey);

    if (error) {
      console.error('Failed to clear vector store:', error);
      throw error;
    }

    console.log(`Cleared vector store for vectorKey: ${vectorKey.slice(0, 8)}...`);
  } catch (error) {
    console.error('Error clearing vector store:', error);
    throw error;
  }
}

/**
 * Get message count for a vector store
 * @param vectorKey - The vectorKey to count messages for
 */
export async function getMessageCount(vectorKey: string): Promise<number> {
  // Fall back to simple count if Supabase not configured
  if (!supabase) {
    // Mock implementation doesn't have a direct count function
    // but we can simulate it by getting history and counting
    const mockStore = { id: vectorKey, name: `profile_${vectorKey.slice(0, 8)}` };
    const history = await mockMcp.getConversationHistory(mockStore, 1000);
    return history.length;
  }

  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('vector_key', vectorKey);

    if (error) {
      console.error('Failed to get message count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
}