'use client';

import { motion } from 'framer-motion';
import {
    Activity,
    DollarSign,
    TrendingDown,
    TrendingUp,
    Zap
} from 'lucide-react';
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface MetricWidgetProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
  subtitle?: string;
}

export function MetricWidget({ 
  title, 
  value, 
  change, 
  icon, 
  isLoading,
  subtitle 
}: MetricWidgetProps) {
  if (isLoading) {
    return (
      <Card className="h-24">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-6 w-20 mb-1" />
          <Skeleton className="h-3 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-24 hover:shadow-md transition-shadow">
        <CardContent className="p-4 h-full">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <div className="text-muted-foreground flex-shrink-0">{icon}</div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground truncate">{value}</p>
            <div className="flex items-center justify-between">
              {change !== undefined && (
                <div className="flex items-center gap-1">
                  {change > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">+{change.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">{change.toFixed(1)}%</span>
                    </>
                  )}
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground/70 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MetricWidgetGridProps {
  isLoading?: boolean;
  metrics?: {
    tvl: string;
    volume: string;
    fees: string;
    trades: string;
  };
}

export function MetricWidgetGrid({ isLoading = false, metrics }: MetricWidgetGridProps) {
  const [metricsData, setMetricsData] = React.useState(metrics);
  const [loading, setLoading] = React.useState(isLoading);

  React.useEffect(() => {
    if (!metrics && !isLoading) {
      // Fetch metrics from API
      setLoading(true);
      fetch('/api/metrics')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMetricsData(data.data);
          }
        })
        .catch(error => {
          console.error('Failed to fetch metrics:', error);
          // Use fallback data
          setMetricsData({
            tvl: '$2.4M',
            volume: '$156K',
            fees: '$1.2K',
            trades: '342'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [metrics, isLoading]);

  const displayMetrics = metricsData || {
    tvl: '$2.4M',
    volume: '$156K',
    fees: '$1.2K',
    trades: '342'
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricWidget
        title="Total TVL"
        value={displayMetrics.tvl}
        change={12.5}
        icon={<DollarSign className="w-4 h-4" />}
        isLoading={loading}
      />
      <MetricWidget
        title="24h Volume"
        value={displayMetrics.volume}
        change={8.3}
        icon={<Activity className="w-4 h-4" />}
        isLoading={loading}
      />
      <MetricWidget
        title="24h Fees"
        value={displayMetrics.fees}
        change={-2.1}
        icon={<Zap className="w-4 h-4" />}
        isLoading={loading}
      />
      <MetricWidget
        title="24h Trades"
        value={displayMetrics.trades}
        change={15.7}
        icon={<Activity className="w-4 h-4" />}
        isLoading={loading}
        subtitle="transactions"
      />
    </div>
  );
}
