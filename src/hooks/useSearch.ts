import { useState, useCallback, useMemo } from 'react';
import { mockTokens, Token } from '../utils/tokenData';
import { mockPools, Pool } from '../utils/mockPoolData';

export interface SearchResult {
  id: string;
  type: 'token' | 'pool' | 'protocol';
  title: string;
  subtitle: string;
  symbol?: string;
  price?: number;
  change24h?: number;
  tvl?: number;
  apr?: number;
  platform?: string;
  tokenType?: string;
  url: string;
}

export interface SearchState {
  query: string;
  isOpen: boolean;
  results: SearchResult[];
  isLoading: boolean;
}

export function useSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isOpen: false,
    results: [],
    isLoading: false
  });

  const searchTokens = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return mockTokens
      .filter((token: Token) => 
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.platform.toLowerCase().includes(lowerQuery) ||
        token.tokenType.toLowerCase().includes(lowerQuery)
      )
      .map((token: Token) => ({
        id: `token-${token.symbol}`,
        type: 'token' as const,
        title: token.symbol,
        subtitle: token.name,
        symbol: token.symbol,
        price: token.price,
        change24h: token.changePercent24h,
        platform: token.platform,
        tokenType: token.tokenType,
        url: `/currencies?token=${token.symbol}`
      }));
  }, []);

  const searchPools = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return mockPools
      .filter((pool: Pool) => 
        pool.symbol.toLowerCase().includes(lowerQuery) ||
        pool.name.toLowerCase().includes(lowerQuery) ||
        pool.type.toLowerCase().includes(lowerQuery)
      )
      .map((pool: Pool) => ({
        id: `pool-${pool.symbol}`,
        type: 'pool' as const,
        title: pool.symbol,
        subtitle: pool.name,
        symbol: pool.symbol,
        tvl: pool.tvl,
        apr: pool.apr,
        platform: pool.type === 'soroswap' ? 'Soroswap' : 'DeFindex',
        url: `/stocks?pool=${pool.symbol}`
      }));
  }, []);

  const searchProtocols = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    const protocols = [
      { name: 'Soroswap', description: 'Decentralized Exchange', url: '/markets' },
      { name: 'DeFindex', description: 'Lending Protocol', url: '/markets' }
    ];
    
    return protocols
      .filter(protocol => 
        protocol.name.toLowerCase().includes(lowerQuery) ||
        protocol.description.toLowerCase().includes(lowerQuery)
      )
      .map(protocol => ({
        id: `protocol-${protocol.name}`,
        type: 'protocol' as const,
        title: protocol.name,
        subtitle: protocol.description,
        platform: protocol.name,
        url: protocol.url
      }));
  }, []);

  const performSearch = useCallback(async (query: string) => {
    setSearchState(prev => ({ ...prev, isLoading: true, query }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const tokenResults = searchTokens(query);
    const poolResults = searchPools(query);
    const protocolResults = searchProtocols(query);
    
    const allResults = [...tokenResults, ...poolResults, ...protocolResults];
    
    setSearchState(prev => ({
      ...prev,
      results: allResults,
      isLoading: false,
      isOpen: query.length > 0
    }));
  }, [searchTokens, searchPools, searchProtocols]);

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      isOpen: false,
      results: [],
      isLoading: false
    });
  }, []);

  const openSearch = useCallback(() => {
    setSearchState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeSearch = useCallback(() => {
    setSearchState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...searchState,
    performSearch,
    clearSearch,
    openSearch,
    closeSearch
  };
} 