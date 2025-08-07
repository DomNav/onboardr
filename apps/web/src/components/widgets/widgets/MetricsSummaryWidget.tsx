/**
 * Metrics Summary Widget
 * Displays TVL, Volume, and Fees with trend indicators
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLargeNumber } from '@/lib/formatters';

interface MetricsSummaryWidgetProps {
  data?: any;
  settings?: {
    showTrends?: boolean;
    showSparklines?: boolean;
    refreshInterval?: number;
  };
  onSettingsChange?: (settings: any) => void;
}

interface MetricCardProps {
  label: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function MetricCard({ label, value, change, icon, color, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="flex flex-col p-4 bg-muted/30 rounded-lg">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col p-4 bg-gradient-to-br from-background to-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn('p-1 rounded', color)}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {formatLargeNumber(value)}
        </span>
        
        {change !== undefined && (
          <span className={cn(
            'flex items-center text-xs font-medium',
            change >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {change >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-0.5" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-0.5" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function MetricsSummaryWidget({ 
  data, 
  settings = { showTrends: true } 
}: MetricsSummaryWidgetProps) {
  const metrics = useMemo(() => {
    if (!data?.metrics) {
      return {
        tvl: 0,
        volume24h: 0,
        fees24h: 0,
        tvlChange: 0,
        volumeChange: 0,
        feesChange: 0
      };
    }

    // Calculate percentage changes (mock for now)
    return {
      tvl: data.metrics.tvl || 0,
      volume24h: data.metrics.volume24h || 0,
      fees24h: (data.metrics.volume24h || 0) * 0.003, // 0.3% fee assumption
      tvlChange: 5.2,
      volumeChange: -2.1,
      feesChange: 8.7
    };
  }, [data]);

  const isLoading = !data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Total Value Locked"
        value={metrics.tvl}
        change={settings.showTrends ? metrics.tvlChange : undefined}
        icon={<DollarSign className="w-4 h-4 text-white" />}
        color="bg-blue-500/20"
        loading={isLoading}
      />
      
      <MetricCard
        label="24h Volume"
        value={metrics.volume24h}
        change={settings.showTrends ? metrics.volumeChange : undefined}
        icon={<Activity className="w-4 h-4 text-white" />}
        color="bg-teal-500/20"
        loading={isLoading}
      />
      
      <MetricCard
        label="24h Fees"
        value={metrics.fees24h}
        change={settings.showTrends ? metrics.feesChange : undefined}
        icon={<Zap className="w-4 h-4 text-white" />}
        color="bg-yellow-500/20"
        loading={isLoading}
      />
    </div>
  );
}