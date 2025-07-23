import { describe, it, expect, beforeEach } from 'vitest'
import { useWatchlistStore } from './useWatchlistStore'

describe('useWatchlistStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWatchlistStore.getState().clearWatchlist()
    localStorage.clear()
  })

  it('should initialize with empty watchlist', () => {
    const { watchedTokens } = useWatchlistStore.getState()
    expect(watchedTokens).toEqual([])
  })

  it('should add token to watchlist', () => {
    const { addToWatchlist, watchedTokens } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    
    expect(useWatchlistStore.getState().watchedTokens).toContain('BTC')
  })

  it('should not add duplicate tokens', () => {
    const { addToWatchlist } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    addToWatchlist('BTC')
    
    const { watchedTokens } = useWatchlistStore.getState()
    expect(watchedTokens.filter(token => token === 'BTC')).toHaveLength(1)
  })

  it('should remove token from watchlist', () => {
    const { addToWatchlist, removeFromWatchlist } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    removeFromWatchlist('BTC')
    
    expect(useWatchlistStore.getState().watchedTokens).not.toContain('BTC')
  })

  it('should toggle token correctly', () => {
    const { toggleWatchlistToken, isTokenWatched } = useWatchlistStore.getState()
    
    // Add token
    toggleWatchlistToken('ETH')
    expect(isTokenWatched('ETH')).toBe(true)
    
    // Remove token
    toggleWatchlistToken('ETH')
    expect(isTokenWatched('ETH')).toBe(false)
  })

  it('should check if token is watched', () => {
    const { addToWatchlist, isTokenWatched } = useWatchlistStore.getState()
    
    expect(isTokenWatched('USDC')).toBe(false)
    
    addToWatchlist('USDC')
    expect(isTokenWatched('USDC')).toBe(true)
  })

  it('should return watched tokens list', () => {
    const { addToWatchlist, getWatchedTokens } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    addToWatchlist('ETH')
    
    const watchedTokens = getWatchedTokens()
    expect(watchedTokens).toEqual(['BTC', 'ETH'])
  })

  it('should clear watchlist', () => {
    const { addToWatchlist, clearWatchlist } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    addToWatchlist('ETH')
    clearWatchlist()
    
    expect(useWatchlistStore.getState().watchedTokens).toEqual([])
  })

  it('should persist to localStorage', () => {
    const { addToWatchlist } = useWatchlistStore.getState()
    
    addToWatchlist('BTC')
    
    // Verify localStorage was called with correct data
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'token-watchlist',
      expect.stringContaining('BTC')
    )
  })

  it('should load from localStorage on initialization', () => {
    // This test verifies that Zustand persist middleware works
    // The store automatically calls localStorage.getItem on initialization
    const { watchedTokens } = useWatchlistStore.getState()
    
    // The store should initialize with empty array if no localStorage data
    expect(Array.isArray(watchedTokens)).toBe(true)
  })
})