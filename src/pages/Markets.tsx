import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { MarketOverview } from '../components/markets/marketoverview';
import { useMarketIndices, mockIndices } from '../utils/stocksApi';

const Markets = () => {
  const indices = useMarketIndices(mockIndices);
  
  return (
    <PageLayout title="Markets Overview">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketOverview indices={indices} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Stats</h2>
          <div className="grid gap-4">
            {indices.slice(0, 4).map((index) => (
              <div key={index.symbol} className="bg-card rounded-lg p-4 shadow-sm border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">{index.name}</h3>
                    <p className="text-muted-foreground text-xs">{index.region}</p>
                  </div>
                  <div className={`text-sm font-bold ${index.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                    {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-lg font-bold">{index.value.toFixed(2)}</span>
                  <span className={`ml-2 text-xs ${index.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Markets;
