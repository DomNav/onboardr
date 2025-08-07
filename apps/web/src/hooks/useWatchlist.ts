import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useWatchlistStore } from '@/store/watchlist';

export function useWatchlist() {
  const { data: session } = useSession();
  const {
    watchedTokens,
    isLoading,
    error,
    toggleWatch: storeToggleWatch,
    addToWatchlist: storeAddToWatchlist,
    removeFromWatchlist: storeRemoveFromWatchlist,
    isWatched,
    clearWatchlist,
    getWatchlistCount,
    getWatchlistArray,
    syncWithDatabase,
    setError
  } = useWatchlistStore();

  // Sync with database when user logs in
  useEffect(() => {
    if (session?.user?.id) {
      syncWithDatabase(session.user.id);
    }
  }, [session?.user?.id, syncWithDatabase]);

  // Wrapped actions that include user ID
  const toggleWatch = useCallback(async (tokenId: string) => {
    if (!session?.user?.id) {
      // If not logged in, just update local state
      await storeToggleWatch(tokenId);
    } else {
      await storeToggleWatch(tokenId, session.user.id);
    }
  }, [session?.user?.id, storeToggleWatch]);

  const addToWatchlist = useCallback(async (tokenId: string, tokenSymbol?: string) => {
    if (!session?.user?.id) {
      // If not logged in, just update local state
      await storeAddToWatchlist(tokenId);
    } else {
      await storeAddToWatchlist(tokenId, session.user.id, tokenSymbol);
    }
  }, [session?.user?.id, storeAddToWatchlist]);

  const removeFromWatchlist = useCallback(async (tokenId: string) => {
    if (!session?.user?.id) {
      // If not logged in, just update local state
      await storeRemoveFromWatchlist(tokenId);
    } else {
      await storeRemoveFromWatchlist(tokenId, session.user.id);
    }
  }, [session?.user?.id, storeRemoveFromWatchlist]);

  return {
    watchedTokens,
    isLoading,
    error,
    toggleWatch,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    clearWatchlist,
    getWatchlistCount,
    getWatchlistArray,
    setError,
    isAuthenticated: !!session?.user?.id
  };
}