import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addToWatchlist as addToDb, removeFromWatchlist as removeFromDb, getUserWatchlist } from '@/lib/supabase/watchlist';

interface WatchlistState {
  // State
  watchedTokens: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  toggleWatch: (tokenId: string, userId?: string) => Promise<void>;
  addToWatchlist: (tokenId: string, userId?: string, tokenSymbol?: string) => Promise<void>;
  removeFromWatchlist: (tokenId: string, userId?: string) => Promise<void>;
  isWatched: (tokenId: string) => boolean;
  clearWatchlist: () => void;
  getWatchlistCount: () => number;
  getWatchlistArray: () => string[];
  syncWithDatabase: (userId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      // Initial state
      watchedTokens: new Set<string>(),
      isLoading: false,
      error: null,

      // Toggle watch status
      toggleWatch: async (tokenId: string, userId?: string) => {
        const { watchedTokens, addToWatchlist, removeFromWatchlist } = get();
        if (watchedTokens.has(tokenId)) {
          await removeFromWatchlist(tokenId, userId);
        } else {
          await addToWatchlist(tokenId, userId);
        }
      },

      // Add to watchlist
      addToWatchlist: async (tokenId: string, userId?: string, tokenSymbol?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Update local state immediately for optimistic UI
          set((state) => ({
            watchedTokens: new Set(state.watchedTokens).add(tokenId),
          }));
          
          // Sync with database if user is authenticated
          if (userId) {
            await addToDb(userId, tokenId, tokenSymbol);
          }
          
          set({ isLoading: false });
        } catch (error) {
          // Revert local state on error
          set((state) => {
            const newSet = new Set(state.watchedTokens);
            newSet.delete(tokenId);
            return { 
              watchedTokens: newSet,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to add to watchlist'
            };
          });
          throw error;
        }
      },

      // Remove from watchlist
      removeFromWatchlist: async (tokenId: string, userId?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Update local state immediately for optimistic UI
          set((state) => {
            const newSet = new Set(state.watchedTokens);
            newSet.delete(tokenId);
            return { watchedTokens: newSet };
          });
          
          // Sync with database if user is authenticated
          if (userId) {
            await removeFromDb(userId, tokenId);
          }
          
          set({ isLoading: false });
        } catch (error) {
          // Revert local state on error
          set((state) => ({
            watchedTokens: new Set(state.watchedTokens).add(tokenId),
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
          }));
          throw error;
        }
      },

      // Check if token is watched
      isWatched: (tokenId: string) => {
        return get().watchedTokens.has(tokenId);
      },

      // Clear all watchlist
      clearWatchlist: () => {
        set({ watchedTokens: new Set<string>() });
      },

      // Get count of watched tokens
      getWatchlistCount: () => {
        return get().watchedTokens.size;
      },

      // Get array of watched token IDs
      getWatchlistArray: () => {
        return Array.from(get().watchedTokens);
      },
      
      // Sync local state with database
      syncWithDatabase: async (userId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const watchlistItems = await getUserWatchlist(userId);
          const tokenIds = watchlistItems.map(item => item.token_id);
          
          set({ 
            watchedTokens: new Set(tokenIds),
            isLoading: false 
          });
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sync watchlist'
          });
        }
      },
      
      // Set error state
      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'onboardr-watchlist',
      // Custom storage to handle Set serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              watchedTokens: new Set(state.watchedTokens || []),
            },
          };
        },
        setItem: (name, value) => {
          const { state } = value as { state: WatchlistState };
          const str = JSON.stringify({
            state: {
              ...state,
              watchedTokens: Array.from(state.watchedTokens),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);