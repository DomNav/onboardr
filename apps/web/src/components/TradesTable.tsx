'use client';

import { useTradeStore, TradeStatus } from '@/store/trades';
import TradeRow from './TradeRow';

interface TradesTableProps {
  status: TradeStatus;
}

export default function TradesTable({ status }: TradesTableProps) {
  const { trades } = useTradeStore();
  
  // Filter trades by status
  const filteredTrades = trades.filter(trade => trade.status === status);

  if (filteredTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <div className="text-2xl text-muted-foreground">
            {status === 'pending' && '⏳'}
            {status === 'executing' && '⚡'}
            {status === 'completed' && '✅'}
            {status === 'cancelled' && '❌'}
            {status === 'failed' && '💥'}
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No {status} trades
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {status === 'pending' && 'Queue up some trades to see them here.'}
          {status === 'executing' && 'No trades are currently being executed.'}
          {status === 'completed' && 'Completed trades will appear here.'}
          {status === 'cancelled' && 'Cancelled trades will appear here.'}
          {status === 'failed' && 'Failed trades will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/30 rounded-xl border border-border/30 shadow-sm">
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/20 sticky top-0 z-10">
            <tr className="border-b border-border/30">
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trade
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredTrades.map((trade, index) => (
              <TradeRow 
                key={trade.id} 
                trade={trade} 
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary footer */}
      <div className="px-4 py-3 bg-muted/10 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredTrades.length} {status} trade{filteredTrades.length !== 1 ? 's' : ''}
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}