import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePoolData, mockPools } from '@/utils/mockPoolData';
import { PieChart, Cell, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Portfolio = () => {
  const pools = usePoolData(mockPools);
  
  // Mock DeFi portfolio data
  const portfolio = [
    { symbol: 'SORO / USDC', liquidity: 5000, costBasis: 1.25 },
    { symbol: 'DFX / USDT', liquidity: 3000, costBasis: 0.85 },
    { symbol: 'xUSDL / ETH', liquidity: 2000, costBasis: 2.15 },
    { symbol: 'SORO / ETH', liquidity: 1500, costBasis: 0.95 },
  ];
  
  // Calculate portfolio values
  const portfolioItems = portfolio.map(item => {
    const pool = pools.find(p => p.symbol === item.symbol);
    if (!pool) return null;
    
    const currentValue = pool.tvl * (item.liquidity / 1000000); // Simplified calculation
    const costBasis = item.costBasis * item.liquidity;
    const gain = currentValue - costBasis;
    const gainPercent = (gain / costBasis) * 100;
    
    return {
      ...item,
      name: pool.name,
      currentApr: pool.apr,
      currentValue,
      costBasis,
      gain,
      gainPercent
    };
  }).filter(Boolean);
  
  const totalValue = portfolioItems.reduce((sum, item) => sum + item.currentValue, 0);
  const totalCost = portfolioItems.reduce((sum, item) => sum + item.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;
  
  // Data for pie chart
  const pieData = portfolioItems.map(item => ({
    name: item.symbol,
    value: item.currentValue
  }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <PageLayout title="DeFi Portfolio">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                <div className="flex items-center">
                  <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${totalGain.toFixed(2)}
                  </p>
                  <p className={`ml-2 ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ({totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">Holdings</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Pool</th>
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-right py-2 px-4">Liquidity</th>
                    <th className="text-right py-2 px-4">APR</th>
                    <th className="text-right py-2 px-4">Value</th>
                    <th className="text-right py-2 px-4">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioItems.map((item) => (
                    <tr key={item.symbol} className="border-b">
                      <td className="py-3 px-4 font-medium">{item.symbol}</td>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-right">${item.liquidity.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{(item.currentApr * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-right">${item.currentValue.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className={item.gain >= 0 ? 'text-green-500' : 'text-red-500'}>
                          ${item.gain.toFixed(2)} ({item.gain >= 0 ? '+' : ''}{item.gainPercent.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Portfolio;