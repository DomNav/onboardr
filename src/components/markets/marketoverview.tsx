import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, BarChart3Icon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MarketIndex, formatPercentage } from '../../utils/stocksApi';

interface MarketOverviewProps {
  indices: MarketIndex[];
  className?: string;
}

// Enhanced chart data for market overview with more granular data points
const generateChartData = () => {
  const data = [];
  const baseValue = 4800; // Start closer to current S&P 500 value
  let currentValue = baseValue;
  
  // Generate 50 data points for smoother chart
  for (let i = 0; i < 50; i++) {
    // Create a more realistic market trend with upward bias
    const trend = 0.0005; // Slight upward trend
    const volatility = 0.02; // 2% daily volatility
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    // Apply trend and volatility
    currentValue = currentValue * (1 + trend + randomWalk);
    
    // Add some market cycles
    const cycle = Math.sin(i * 0.3) * 0.01; // Weekly cycles
    currentValue = currentValue * (1 + cycle);
    
    data.push({
      name: `Day ${i + 1}`,
      value: Math.round(currentValue)
    });
  }
  
  return data;
};

const chartData = generateChartData();

// Professional Recharts component
const MarketChart = ({ data }: { data: typeof chartData }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  return (
    <div className="w-full h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="hsl(var(--border))" 
            opacity={0.3}
          />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={false}
            hide={true}
          />
          <YAxis 
            domain={[minValue * 0.98, maxValue * 1.02]}
            axisLine={false}
            tickLine={false}
            tick={false}
            hide={true}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'S&P 500']}
            labelFormatter={() => ''}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            fillOpacity={1}
            fill="url(#marketGradient)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export function MarketOverview({ indices, className }: MarketOverviewProps) {
  const groupedByRegion = indices.reduce<Record<string, MarketIndex[]>>((acc, index) => {
    if (!acc[index.region]) {
      acc[index.region] = [];
    }
    acc[index.region].push(index);
    return acc;
  }, {});
  
  // Calculate overall market sentiment
  const totalChange = indices.reduce((sum, index) => sum + index.changePercent, 0);
  const averageChange = totalChange / indices.length;
  const isPositive = averageChange >= 0;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Market Chart Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="h-5 w-5 text-primary" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">S&P 500</p>
                <p className="text-sm text-muted-foreground">Global Market Index</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">5,123.41</p>
                <div className={cn(
                  "flex items-center text-sm",
                  isPositive ? "text-success" : "text-danger"
                )}>
                  {isPositive ? 
                    <ArrowUpIcon className="h-4 w-4 mr-1" /> : 
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  }
                  <span>{formatPercentage(averageChange)}</span>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="mb-4">
              <MarketChart data={chartData} />
            </div>
            
            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-semibold">2.4B</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="font-semibold">5,145.23</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="font-semibold">5,098.67</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Indices Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            Global Markets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-0.5">
            {Object.entries(groupedByRegion).map(([region, indices]) => (
              <div key={region} className="p-4">
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">{region}</h3>
                <div className="space-y-2">
                  {indices.map((index) => (
                    <div 
                      key={index.symbol}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{index.name}</span>
                        <span className="text-xs text-muted-foreground">{index.symbol}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{index.value.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}</span>
                        <span className={cn(
                          "flex items-center text-xs",
                          index.change >= 0 ? "text-success" : "text-danger"
                        )}>
                          {index.change >= 0 ? 
                            <ArrowUpIcon className="h-3 w-3 mr-1" /> : 
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          }
                          {formatPercentage(index.changePercent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 