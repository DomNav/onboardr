'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { 
  formatTvl, 
  formatApy, 
  formatVolume,
  getRiskColor,
  type VaultMetrics 
} from '@/lib/defindex/client';
import { useState } from 'react';

interface VaultTableProps {
  vaults: VaultMetrics[];
  onSelectVault?: (vaultId: string) => void;
  selectedVaultId?: string | null;
}

export default function VaultTable({ vaults, onSelectVault, selectedVaultId }: VaultTableProps) {
  const [expandedVault, setExpandedVault] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof VaultMetrics>('tvl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof VaultMetrics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedVaults = [...vaults].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Vaults</span>
          <Badge variant="secondary">{vaults.length} Total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Vault</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('tvl')}
              >
                <div className="flex items-center gap-1">
                  TVL
                  {sortField === 'tvl' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('apy')}
              >
                <div className="flex items-center gap-1">
                  APY
                  {sortField === 'apy' && (
                    sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                  )}
                </div>
              </TableHead>
              <TableHead>24h Change</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVaults.map((vault) => (
              <React.Fragment key={vault.id}>
                <TableRow 
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedVaultId === vault.id ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => onSelectVault?.(vault.id)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{vault.name}</p>
                      <p className="text-xs text-muted-foreground">{vault.symbol}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatTvl(vault.tvl)}</TableCell>
                  <TableCell>
                    <span className="text-green-500 font-medium">
                      {formatApy(vault.apy)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {vault.priceChange24h > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-500 text-sm">
                            +{vault.priceChange24h.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          <span className="text-red-500 text-sm">
                            {vault.priceChange24h.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getRiskColor(vault.risk)}
                    >
                      {vault.risk}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedVault(
                            expandedVault === vault.id ? null : vault.id
                          );
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        Deposit
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Expandable row for composition */}
                {expandedVault === vault.id && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="py-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Vault Composition</p>
                            <div className="flex gap-2 flex-wrap">
                              {vault.composition.map((token) => (
                                <Badge key={token.token} variant="secondary">
                                  {token.token}: {token.percentage}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">24h Volume</p>
                              <p className="font-medium">{formatVolume(vault.volume24h)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Strategy</p>
                              <p className="font-medium">Automated Rebalancing</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Management Fee</p>
                              <p className="font-medium">2%</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}