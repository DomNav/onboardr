'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  Area,
  AreaChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { useVaultHistory } from '@/hooks/useDefindexMetrics';
import { formatTvl, formatApy } from '@/lib/defindex/client';
import { Loader2, TrendingUp, DollarSign } from 'lucide-react';

interface TimeSeriesChartProps {
  vaultId: string;
}

export default function TimeSeriesChart({ vaultId }: TimeSeriesChartProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [metric, setMetric] = useState<'tvl' | 'apy'>('tvl');
  const { data: history, isLoading } = useVaultHistory(vaultId, range);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No historical data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = history.map(h => ({
    date: new Date(h.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    tvl: h.tvl,
    apy: h.apy,
    volume: h.volume,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {metric === 'tvl' ? (
            <>
              <p className="text-sm">
                <span className="text-muted-foreground">TVL: </span>
                <span className="font-medium">{formatTvl(payload[0].value)}</span>
              </p>
              {payload[1] && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Volume: </span>
                  <span className="font-medium">{formatTvl(payload[1].value)}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm">
              <span className="text-muted-foreground">APY: </span>
              <span className="font-medium text-green-500">{formatApy(payload[0].value)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Historical Performance
              <Badge variant="outline">Vault {vaultId.slice(-3)}</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <Tabs value={metric} onValueChange={(v) => setMetric(v as any)}>
                <TabsList>
                  <TabsTrigger value="tvl" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    TVL
                  </TabsTrigger>
                  <TabsTrigger value="apy" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    APY
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex gap-1">
                {(['7d', '30d', '90d'] as const).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={range === r ? 'default' : 'outline'}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            {metric === 'tvl' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#tvlGradient)"
                  name="TVL"
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                  name="Volume"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="apy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="APY"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}