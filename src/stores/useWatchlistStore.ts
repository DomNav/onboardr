import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  watchedTokens: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleWatchlistToken: (symbol: string) => void
  isTokenWatched: (symbol: string) => boolean
  getWatchedTokens: () => string[]
  clearWatchlist: () => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedTokens: [],
      
      addToWatchlist: (symbol: string) => {
        const { watchedTokens } = get()
        if (!watchedTokens.includes(symbol)) {
          set({ watchedTokens: [...watchedTokens, symbol] })
        }
      },
      
      removeFromWatchlist: (symbol: string) => {
        const { watchedTokens } = get()
        set({ watchedTokens: watchedTokens.filter(token => token !== symbol) })
      },
      
      toggleWatchlistToken: (symbol: string) => {
        const { watchedTokens } = get()
        if (watchedTokens.includes(symbol)) {
          set({ watchedTokens: watchedTokens.filter(token => token !== symbol) })
        } else {
          set({ watchedTokens: [...watchedTokens, symbol] })
        }
      },
      
      isTokenWatched: (symbol: string) => {
        const { watchedTokens } = get()
        return watchedTokens.includes(symbol)
      },
      
      getWatchedTokens: () => {
        const { watchedTokens } = get()
        return watchedTokens
      },
      
      clearWatchlist: () => {
        set({ watchedTokens: [] })
      }
    }),
    {
      name: 'token-watchlist',
      version: 1,
    }
  )
)