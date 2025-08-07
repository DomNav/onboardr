'use client';

import React from 'react';
import { PairVolume } from '@/types/analytics';
import { ChartLoader } from './ChartComponents';
import { formatLargeNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

// Chart data validation helper
function validateChartData(data: PairVolume[]): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every(pair => 
    typeof pair.pair === 'string' &&
    typeof pair.volume === 'number' &&
    typeof pair.percentage === 'number' &&
    typeof pair.color === 'string' &&
    pair.volume >= 0 &&
    pair.percentage >= 0
  );
}

// Pie chart component (no longer lazy-loaded to avoid issues)
interface PieChartComponentProps {
  data: PairVolume[];
}

const PieChartComponent: React.FC<PieChartComponentProps> = ({ data }) => {
  const [chartModule, setChartModule] = React.useState<any>(null);
  
  React.useEffect(() => {
    import("recharts").then(module => {
      setChartModule(module);
    });
  }, []);
  
  if (!chartModule) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = chartModule;
  
  // Detect dark mode from document
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDark ? 'hsl(var(--foreground))' : '#1F2937';
  const bgColor = 'hsl(var(--card))';
  const borderColor = 'hsl(var(--border))';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="percentage"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            <span key="value" style={{ color: textColor, fontWeight: 'bold' }}>
              {value.toFixed(1)}%
            </span>,
            <span key="label" style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '11px' }}>
              Share
            </span>
          ]}
          labelFormatter={(pair: string) => (
            <span style={{ color: textColor, fontWeight: 'bold' }}>{pair}</span>
          )}
          contentStyle={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: textColor,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value: string) => (
            <span style={{ color: textColor, fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

interface PairVolumePieChartProps {
  data: PairVolume[];
  className?: string;
}

export const PairVolumePieChart: React.FC<PairVolumePieChartProps> = ({ 
  data, 
  className 
}) => {
  // Validate data before rendering
  if (!validateChartData(data)) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-center", className)}>
        <div className="text-muted-foreground">
          Invalid pair volume data format
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 text-center", className)}>
        <div className="text-muted-foreground">
          No pair volume data available
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart */}
      <div className="bg-card rounded-lg border">
          <div className="h-64 w-full p-4" role="img" aria-label="Pair volume distribution chart">
            <PieChartComponent data={data} />
          </div>
      </div>

      {/* Legend with volume details */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Volume Breakdown</h4>
        <div className="space-y-2">
          {data.map((pair) => (
            <div 
              key={pair.pair}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pair.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-foreground">
                  {pair.pair}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-foreground">
                  ${formatLargeNumber(pair.volume)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pair.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};