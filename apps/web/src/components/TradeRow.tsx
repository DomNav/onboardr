'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Clock, Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { Trade, TradeStatus } from '@/store/trades';
import { formatDistance } from 'date-fns';

interface TradeRowProps {
  trade: Trade;
  index: number;
}

export default function TradeRow({ trade, index }: TradeRowProps) {
  const getStatusIcon = (status: TradeStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'executing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'executing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const handleStellarExpertClick = () => {
    if (trade.txHash) {
      window.open(`https://stellar.expert/explorer/public/tx/${trade.txHash}`, '_blank');
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
    >
      {/* Trade Summary */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">
            {trade.summary}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(trade.createdAt)}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(trade.status)}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(trade.status)}`}>
            {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
          </span>
        </div>
      </td>

      {/* TX Hash / Actions */}
      <td className="py-3 px-4">
        {trade.txHash ? (
          <button
            onClick={handleStellarExpertClick}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            title="View on StellarExpert"
          >
            <span className="font-mono">
              {trade.txHash.slice(0, 8)}...{trade.txHash.slice(-4)}
            </span>
            <ExternalLink className="h-3 w-3 group-hover:text-cyan-500" />
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {trade.status === 'pending' ? 'Queued' : '—'}
          </span>
        )}
      </td>
    </motion.tr>
  );
}