'use client';

import React from 'react';
import { DataPoint, Metric } from '@/types/analytics';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatLargeNumber } from '@/lib/formatters';

// Chart loading fallback (reused from MetricsCard)
export const ChartLoader = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <BarChart3 className="h-4 w-4 animate-pulse" />
      Loading chart...
    </div>
  </div>
);

// Chart component (no longer lazy-loaded to avoid issues)
interface LineChartComponentProps {
  data: DataPoint[];
  color: string;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, color }) => {
  // We'll import recharts directly since the lazy loading was causing issues
  const [chartModule, setChartModule] = React.useState<any>(null);
  
  React.useEffect(() => {
    import("recharts").then(module => {
      setChartModule(module);
    });
  }, []);
  
  if (!chartModule) {
    return <ChartLoader />;
  }
  
  const { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } = chartModule;
  
  // Detect dark mode from document
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#d1d5db' : '#666';
  const bgColor = isDark ? '#374151' : 'white';
  const borderColor = isDark ? '#4b5563' : 'hsl(var(--border))';
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <XAxis 
          dataKey="time" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: textColor }}
          height={40}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: textColor }}
          domain={['dataMin - 10', 'dataMax + 10']}
          width={60}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
            color: textColor
          }}
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          strokeWidth={3}
          dot={false}
          activeDot={{ 
            r: 5, 
            fill: color,
            strokeWidth: 2,
            stroke: bgColor
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Helper function to format tooltip values (identical to MetricsCard)
export const formatTooltipValue = (value: number, metric: Metric): string => {
  return metric === "volume"
    ? formatLargeNumber(value * 1_000)
    : metric === "tvl"
    ? formatLargeNumber(value * 10_000)
    : `$${value.toFixed(2)}`;
};

// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

interface MetricSummaryCardProps {
  metric: Metric;
  value: string;
  change: number;
  timeFrame: string;
  icon: React.ReactNode;
}

export const MetricSummaryCard: React.FC<MetricSummaryCardProps> = ({
  metric,
  value,
  change,
  timeFrame,
  icon
}) => (
  <div className="p-4 rounded-lg bg-card border dark:bg-card dark:border-border">
    <div className="flex items-center gap-2 mb-2">
      <div aria-hidden="true">{icon}</div>
      <span className="text-sm font-medium text-muted-foreground capitalize">
        {timeFrame} {metric} {metric === 'tvl' ? 'locked' : 'activity'}
      </span>
    </div>
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
      <span className="text-xl sm:text-2xl font-semibold text-foreground dark:text-foreground">
        {value}
      </span>
      <div className={cn(
        "flex items-center gap-1 text-sm",
        change >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      )}>
        {change >= 0 ? (
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
        )}
        <span aria-label={`${change >= 0 ? 'Increased' : 'Decreased'} by ${Math.abs(change).toFixed(2)} percent`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>
    </div>
  </div>
);

interface PeakLowGridProps {
  metric: Metric;
  data: DataPoint[];
  timeFrame: string;
}

export const PeakLowGrid: React.FC<PeakLowGridProps> = ({
  metric,
  data,
  timeFrame
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-xs text-muted-foreground mb-1">Peak {timeFrame}</p>
          <p className="text-sm font-semibold text-foreground">N/A</p>
        </div>
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-xs text-muted-foreground mb-1">Low {timeFrame}</p>
          <p className="text-sm font-semibold text-foreground">N/A</p>
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const peak = Math.max(...values);
  const low = Math.min(...values);

  const formatValue = (value: number): string => {
    return metric === "volume"
      ? formatLargeNumber(value * 1_000)
      : metric === "tvl"
      ? formatLargeNumber(value * 10_000)
      : `$${value.toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-3 rounded-lg bg-card border">
        <p className="text-xs text-muted-foreground mb-1">Peak {timeFrame}</p>
        <p className="text-sm font-semibold text-foreground">
          {formatValue(peak)}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-card border">
        <p className="text-xs text-muted-foreground mb-1">Low {timeFrame}</p>
        <p className="text-sm font-semibold text-foreground">
          {formatValue(low)}
        </p>
      </div>
    </div>
  );
};

interface MetricChartSectionProps {
  metric: Metric;
  data: DataPoint[];
  timeFrame: string;
  icon: React.ReactNode;
}

export const MetricChartSection: React.FC<MetricChartSectionProps> = ({
  metric,
  data,
  timeFrame,
  icon
}) => {
  // Calculate current value and percentage change
  const currentValue = data && data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data && data.length > 1 ? data[data.length - 2].value : currentValue;
  const percentageChange = calculatePercentageChange(currentValue, previousValue);

  // Format the display value
  const displayValue = metric === "volume"
    ? formatLargeNumber(currentValue * 1_000)
    : metric === "tvl"
    ? formatLargeNumber(currentValue * 10_000)
    : `$${currentValue.toFixed(2)}`;

  // Chart colors
  const chartColor = {
    volume: "hsl(var(--chart-1))",
    tvl: "hsl(var(--chart-2))",
    fees: "hsl(var(--chart-3))"
  }[metric];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <MetricSummaryCard
        metric={metric}
        value={displayValue}
        change={percentageChange}
        timeFrame={timeFrame}
        icon={icon}
      />

      {/* Main Chart */}
      <div className="h-64 w-full p-4 rounded-lg border bg-card">
        <LineChartComponent 
          data={data} 
          color={chartColor} 
        />
      </div>

      {/* Peak/Low Grid */}
      <PeakLowGrid
        metric={metric}
        data={data}
        timeFrame={timeFrame}
      />
    </div>
  );
};