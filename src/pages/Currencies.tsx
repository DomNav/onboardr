import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { TokenTable } from '@/components/currencies/TokenTable';
import { TokenCard } from '@/components/currencies/TokenCard';
import { useTokens } from '@/hooks/useTokens';
import { useWatchlistStore } from '@/stores/useWatchlistStore';
import { Star, TrendingUp, TrendingDown, Search, Grid, List, DollarSign, Clock } from 'lucide-react';
import { Token, formatCurrency, formatPercentage } from '@/utils/tokenData';


const Currencies = () => {
  const { tokens, filterTokensByType, filterTokensByPlatform, searchTokens } = useTokens();
  const { getWatchedTokens } = useWatchlistStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<Token['tokenType'] | 'All'>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<Token['platform'] | 'All'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Filter tokens
  let filteredTokens = tokens;
  
  if (searchQuery) {
    filteredTokens = searchTokens(searchQuery);
  }
  
  if (selectedType !== 'All') {
    filteredTokens = filterTokensByType(selectedType).filter(token => 
      searchQuery === '' || token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (selectedPlatform !== 'All') {
    filteredTokens = filterTokensByPlatform(selectedPlatform).filter(token => 
      (searchQuery === '' || token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
       token.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedType === 'All' || token.tokenType === selectedType)
    );
  }

  const watchedTokensList = tokens.filter(token => getWatchedTokens().includes(token.symbol));

  // Calculate summary statistics
  const totalMarketCap = tokens.reduce((sum, token) => sum + token.marketCap, 0);
  const totalVolume24h = tokens.reduce((sum, token) => sum + token.volume24h, 0);
  const positiveTokens = tokens.filter(token => token.changePercent24h > 0).length;
  const negativeTokens = tokens.filter(token => token.changePercent24h < 0).length;


  return (
    <PageLayout title="Currencies">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border card-hover-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Total Market Cap</p>
                <p className="text-2xl font-bold text-card-foreground dark:text-card-foreground">{formatCurrency(totalMarketCap)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
            </div>
          </div>
          
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border card-hover-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">24h Volume</p>
                <p className="text-2xl font-bold text-card-foreground dark:text-card-foreground">{formatCurrency(totalVolume24h)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border card-hover-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Gainers</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{positiveTokens}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border card-hover-effect">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Losers</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{negativeTokens}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-card dark:bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background dark:bg-background border border-input dark:border-input rounded-md focus:ring-2 focus:ring-ring dark:focus:ring-ring focus:border-ring dark:focus:border-ring text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
                />
              </div>
              
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as Token['tokenType'] | 'All')}
                className="px-3 py-2 bg-background dark:bg-background border border-input dark:border-input rounded-md focus:ring-2 focus:ring-ring dark:focus:ring-ring focus:border-ring dark:focus:border-ring text-foreground dark:text-foreground"
              >
                <option value="All">All Types</option>
                <option value="Stablecoin">Stablecoin</option>
                <option value="Native Token">Native Token</option>
                <option value="Other/Volatile">Other/Volatile</option>
              </select>
              
              <select 
                value={selectedPlatform} 
                onChange={(e) => setSelectedPlatform(e.target.value as Token['platform'] | 'All')}
                className="px-3 py-2 bg-background dark:bg-background border border-input dark:border-input rounded-md focus:ring-2 focus:ring-ring dark:focus:ring-ring focus:border-ring dark:focus:border-ring text-foreground dark:text-foreground"
              >
                <option value="All">All Platforms</option>
                <option value="Soroswap">Soroswap</option>
                <option value="DeFindex">DeFindex</option>
                <option value="Both">Both</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground' 
                    : 'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-secondary dark:hover:bg-secondary'
                }`}
              >
                <List className="h-4 w-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground' 
                    : 'bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-secondary dark:hover:bg-secondary'
                }`}
              >
                <Grid className="h-4 w-4" />
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        {watchedTokensList.length > 0 && (
          <div className="bg-card dark:bg-card p-6 rounded-lg shadow-sm border border-border dark:border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-card-foreground dark:text-card-foreground">
              <Star className="h-5 w-5 text-yellow-400" />
              Watchlist ({watchedTokensList.length})
            </h2>
            {viewMode === 'table' ? (
              <TokenTable tokens={watchedTokensList} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {watchedTokensList.map((token) => (
                  <TokenCard
                    key={token.symbol}
                    token={token}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Tokens Section */}
        <div className="bg-card dark:bg-card p-6 rounded-lg shadow-sm border border-border dark:border-border">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground dark:text-card-foreground">All Tokens ({filteredTokens.length})</h2>
          
          {filteredTokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tokens found matching your criteria.</p>
            </div>
          ) : viewMode === 'table' ? (
            <TokenTable tokens={filteredTokens} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.symbol}
                  token={token}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Currencies;