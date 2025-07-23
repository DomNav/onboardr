import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePoolData, mockPools } from '@/utils/mockPoolData';
import { PoolCard } from '@/components/stocks/PoolCard';
import { StockChart } from '@/components/stocks/StockChart';

const Stocks = () => {
  const pools = usePoolData(mockPools);
  const [selectedPool, setSelectedPool] = React.useState(pools[0]);
  
  return (
    <PageLayout title="DeFi Pools">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold">All Pools</h2>
          <div className="space-y-4">
            {pools.map((pool) => (
              <PoolCard 
                key={pool.symbol} 
                pool={pool} 
                onClick={() => setSelectedPool(pool)}
                className={selectedPool.symbol === pool.symbol ? "ring-2 ring-primary" : ""}
              />
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-3 space-y-6">
          <StockChart 
            symbol={selectedPool.symbol} 
            name={selectedPool.name} 
            currentPrice={selectedPool.apr * 100}
            volatility={2.5}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">TVL</h3>
              <p className="text-xl font-semibold mt-1">
                ${(selectedPool.tvl / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">24h Volume</h3>
              <p className="text-xl font-semibold mt-1">
                ${(selectedPool.volume / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">APR</h3>
              <p className="text-xl font-semibold mt-1">
                {(selectedPool.apr * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow">
              <h3 className="font-medium text-sm text-muted-foreground">24h Change</h3>
              <p className={`text-xl font-semibold mt-1 ${selectedPool.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {selectedPool.change24h >= 0 ? '+' : ''}{selectedPool.change24h.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Stocks;
