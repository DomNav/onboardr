'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  Activity,
  Users
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
  subtitle?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  isLoading,
  subtitle 
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-muted-foreground">{icon}</div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+{change.toFixed(2)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500">{change.toFixed(2)}%</span>
                  </>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MetricGridProps {
  metrics: {
    tvl: string;
    apy: string;
    volume: string;
    vaults: number;
  };
  isLoading?: boolean;
}

export default function MetricGrid({ metrics, isLoading }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total TVL"
        value={metrics.tvl}
        change={12.5}
        icon={<DollarSign className="w-4 h-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Average APY"
        value={metrics.apy}
        icon={<Percent className="w-4 h-4" />}
        isLoading={isLoading}
        subtitle="Across all vaults"
      />
      <MetricCard
        title="24h Volume"
        value={metrics.volume}
        change={8.3}
        icon={<Activity className="w-4 h-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Active Vaults"
        value={metrics.vaults}
        icon={<Users className="w-4 h-4" />}
        isLoading={isLoading}
        subtitle="Earning yield"
      />
    </div>
  );
}