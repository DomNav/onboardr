import React, { createContext, useContext, ReactNode } from 'react';
import { useSearch, SearchResult } from '../hooks/useSearch';

interface SearchContextType {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const searchState = useSearch();

  return (
    <SearchContext.Provider value={searchState}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
} 