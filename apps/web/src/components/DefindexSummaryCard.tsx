'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Percent, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';
import { simulateDefindexVaultCreation } from '@/lib/nft/simulateMint';

interface VaultData {
  name: string;
  tvl: number;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  strategies: string[];
}

const mockVaults: VaultData[] = [
  {
    name: 'Stable Yield',
    tvl: 2500000,
    apy: 8.5,
    risk: 'low',
    strategies: ['USDC Lending', 'BLND Rewards']
  },
  {
    name: 'Balanced Growth',
    tvl: 1800000,
    apy: 15.2,
    risk: 'medium',
    strategies: ['XLM Staking', 'Liquidity Provision']
  },
  {
    name: 'High Yield',
    tvl: 950000,
    apy: 28.7,
    risk: 'high',
    strategies: ['Yield Farming', 'Leveraged Positions']
  }
];

export function DefindexSummaryCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalTvl, setTotalTvl] = useState(0);
  const [avgApy, setAvgApy] = useState(0);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const router = useRouter();
  
  const usePlaceholderData = process.env.NEXT_PUBLIC_PLACEHOLDER_DATA === 'true';

  useEffect(() => {
    // Simulate loading DeFindex data
    if (usePlaceholderData) {
      setTimeout(() => {
        setVaults(mockVaults);
        setTotalTvl(mockVaults.reduce((acc, v) => acc + v.tvl, 0));
        setAvgApy(mockVaults.reduce((acc, v) => acc + v.apy, 0) / mockVaults.length);
        setIsLoading(false);
      }, 1500);
    } else {
      // Real API call would go here
      setIsLoading(false);
    }
  }, [usePlaceholderData]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              DeFindex Vaults
            </span>
            <Badge variant="secondary" className="text-xs">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            DeFindex Vaults
          </span>
          <Badge variant="secondary" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/20">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total TVL</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(totalTvl)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg APY</p>
            <p className="text-xl font-bold text-green-500">{avgApy.toFixed(1)}%</p>
          </div>
        </div>

        {/* Top Vaults */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Top Performing Vaults</p>
          {vaults.slice(0, 3).map((vault, index) => (
            <motion.div
              key={vault.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{vault.name}</p>
                  <Badge className={`text-xs ${getRiskColor(vault.risk)}`}>
                    {vault.risk}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatNumber(vault.tvl)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {vault.apy}% APY
                  </span>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </motion.div>
          ))}
        </div>

        {/* DeFindex Features */}
        <div className="p-3 bg-gradient-to-r from-teal-500/5 to-blue-500/5 rounded-xl border border-teal-500/10">
          <p className="text-xs font-medium text-foreground mb-2">DeFindex Benefits</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-1">
              <span className="text-teal-400 mt-0.5">•</span>
              Automated yield optimization across protocols
            </li>
            <li className="flex items-start gap-1">
              <span className="text-teal-400 mt-0.5">•</span>
              Risk-adjusted portfolio strategies
            </li>
            <li className="flex items-start gap-1">
              <span className="text-teal-400 mt-0.5">•</span>
              One-click diversification with index funds
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full text-teal-400 border-teal-400/30 hover:bg-teal-400/10 hover:border-teal-400/50"
          onClick={() => router.push('/analytics/defindex')}
        >
          View Full Analytics
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}