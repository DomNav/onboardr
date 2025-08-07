import { createClient } from '@/utils/supabase/client';

export interface WatchlistItem {
  id?: string;
  user_id: string;
  token_id: string;
  token_symbol?: string;
  added_at?: string;
}

// Client-side functions
export async function addToWatchlist(userId: string, tokenId: string, tokenSymbol?: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist')
    .insert({
      user_id: userId,
      token_id: tokenId,
      token_symbol: tokenSymbol
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
  
  return data;
}

export async function removeFromWatchlist(userId: string, tokenId: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('token_id', tokenId);
  
  if (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
  
  return data || [];
}

// Server-side function for initial load
// NOTE: This function requires server-side imports and should be moved to a separate file
// when server-side functionality is needed
// export async function getServerWatchlist(userId: string): Promise<WatchlistItem[]> {
//   const supabase = createServerClient();
//   
//   const { data, error } = await supabase
//     .from('watchlist')
//     .select('*')
//     .eq('user_id', userId)
//     .order('added_at', { ascending: false });
//   
//   if (error) {
//     console.error('Error fetching server watchlist:', error);
//     return [];
//   }
//   
//   return data || [];
// }