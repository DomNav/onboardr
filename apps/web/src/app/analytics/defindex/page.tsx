'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Users,
  RefreshCw,
  Info,
  ChevronRight,
  Shield,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useDefindexMetrics, 
  useDefindexVaults,
  useDefindexSnapshot 
} from '@/hooks/useDefindexMetrics';
import { 
  formatTvl, 
  formatApy, 
  formatVolume,
  getRiskColor 
} from '@/lib/defindex/client';
import VaultTable from '@/components/analytics/defindex/VaultTable';
import TimeSeriesChart from '@/components/analytics/defindex/TimeSeriesChart';
import MetricGrid from '@/components/analytics/defindex/MetricGrid';
import ComparisonToggle from '@/components/analytics/defindex/ComparisonToggle';

export default function DefindexAnalytics() {
  const { snapshot, vaults, comparison, isLoading, refetch } = useDefindexMetrics();
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Defindex Analytics
            <Badge variant="secondary" className="ml-2">Live</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time metrics and vault performance tracking
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ComparisonToggle 
            enabled={showComparison} 
            onToggle={setShowComparison}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total TVL</p>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {snapshot ? formatTvl(snapshot.totalTvl) : '$0'}
                </p>
                {comparison && showComparison && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">vs Soroswap:</span>
                    <span className={snapshot!.totalTvl > comparison.soroswap.totalTvl ? 'text-green-500' : 'text-red-500'}>
                      {snapshot!.totalTvl > comparison.soroswap.totalTvl ? (
                        <ArrowUpRight className="inline w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="inline w-3 h-3" />
                      )}
                      {Math.abs(((snapshot!.totalTvl - comparison.soroswap.totalTvl) / comparison.soroswap.totalTvl) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Average APY</p>
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-500">
                  {snapshot ? formatApy(snapshot.averageApy) : '0%'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Across {snapshot?.vaultCount || 0} vaults
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">24h Volume</p>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {snapshot ? formatVolume(snapshot.totalVolume24h) : '$0'}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+12.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Active Vaults</p>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {snapshot?.vaultCount || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Earning yield
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vault Table - 2 columns wide */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <VaultTable 
            vaults={vaults || []}
            onSelectVault={setSelectedVaultId}
            selectedVaultId={selectedVaultId}
          />
        </motion.div>

        {/* Side Panel - 1 column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['low', 'medium', 'high'].map((risk) => {
                  const count = vaults?.filter(v => v.risk === risk).length || 0;
                  const percentage = vaults ? (count / vaults.length) * 100 : 0;
                  
                  return (
                    <div key={risk} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`capitalize ${getRiskColor(risk as any)}`}>
                          {risk} Risk
                        </span>
                        <span className="text-muted-foreground">{count} vaults</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className={`h-2 rounded-full ${
                            risk === 'low' ? 'bg-green-500' :
                            risk === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between">
                Deposit to Vault
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Compare Vaults
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                Export Report
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">About Defindex</p>
                  <p className="text-xs text-muted-foreground">
                    Defindex provides automated vault strategies for optimized yield farming across the Stellar network.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chart Section */}
      {selectedVaultId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <TimeSeriesChart vaultId={selectedVaultId} />
        </motion.div>
      )}
    </div>
  );
}