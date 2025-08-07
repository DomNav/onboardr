'use client';

import { useState, useMemo } from 'react';
import { Copy, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DataAlert } from '@/components/ui/data-alert';
import { useWalletBalances, BalanceRow } from '@/lib/hooks/useWalletBalances';
import { useWallet } from '@/contexts/WalletContext';
import ToggleWrapped from './ToggleWrapped';
import { PriceBadge } from './PriceBadge';
import { toast } from 'sonner';

interface BalanceTableProps {
  showWrapped: boolean;
  onToggleWrapped: (showWrapped: boolean) => void;
}

export default function BalanceTable({ showWrapped, onToggleWrapped }: BalanceTableProps) {
  const { address, network } = useWallet();
  const { rows, loading, error, accountExists } = useWalletBalances(address, network);
  const [sortField, setSortField] = useState<'amount' | 'code'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter rows based on wrapped toggle
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (showWrapped) {
        return row.type === 'Wrapped';
      } else {
        return row.type === 'Native' || row.type === 'Stellar Classic Asset';
      }
    });
  }, [rows, showWrapped]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortField === 'amount') {
        aValue = parseFloat(a.amount) || 0;
        bValue = parseFloat(b.amount) || 0;
      } else {
        aValue = a.code;
        bValue = b.code;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredRows, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: 'amount' | 'code') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
          <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
        </div>
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
          <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
        </div>
        <DataAlert type="error" title="Unable to load">
          Details: {error}
        </DataAlert>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
          <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
        </div>
        <DataAlert type="info" title="Wallet not connected">
          Please connect your wallet to view balances.
        </DataAlert>
      </div>
    );
  }

  // Check for network mismatch (account not found on current network)
  if (!loading && !error && !accountExists && address && network) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
          <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Account not found on {network}</h4>
              <p className="text-sm text-amber-700 mt-1">
                Make sure Freighter is connected to the same network. Your wallet appears to be on a different network than the selected {network}.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check for empty state after filtering
  if (filteredRows.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
          <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
        </div>
        <DataAlert type="info" title="No data yet">
          Try again later.
        </DataAlert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your token&apos;s balance:</h3>
        <ToggleWrapped showWrapped={showWrapped} onToggle={onToggleWrapped} />
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Balance
                  {sortField === 'amount' && (
                    sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={`${row.code}-${row.issuer}`}>
                <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {row.code.charAt(0)}
                    </div>
                    {row.code}
                  </div>
                </TableCell>
                <TableCell>
                  <PriceBadge 
                    tokenSymbol={row.code} 
                    size="sm"
                    showMarketCap={true}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{truncateAddress(row.issuer)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(row.issuer)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell className="font-mono">{row.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, sortedRows.length)} of {sortedRows.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 