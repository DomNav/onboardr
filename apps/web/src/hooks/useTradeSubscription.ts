'use client';

import { useEffect, useRef } from 'react';
import { useTradeStore } from '@/store/trades';
import { toast } from 'sonner';

interface TradeUpdate {
  id: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';
  txHash?: string;
}

interface SSEMessage {
  type: 'connected' | 'heartbeat' | 'trade_update';
  data?: TradeUpdate;
  message?: string;
  timestamp?: number;
}

export function useTradeSubscription() {
  const { updateStatus, trades } = useTradeStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const connect = () => {
    if (eventSourceRef.current || isConnectedRef.current) {
      return; // Already connected or connecting
    }

    try {
      const eventSource = new EventSource('/api/trades/subscribe');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔌 Trade subscription connected');
        isConnectedRef.current = true;
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('✅ Trade updates ready');
              break;
              
            case 'heartbeat':
              // Silent heartbeat
              break;
              
            default:
              // Assume it's a trade update if no type specified
              const update = message as unknown as TradeUpdate;
              if (update.id && update.status) {
                handleTradeUpdate(update);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('🔌 Trade subscription error:', error);
        isConnectedRef.current = false;
        
        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect trade subscription...');
          connect();
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    isConnectedRef.current = false;
  };

  const handleTradeUpdate = (update: TradeUpdate) => {
    // Find the trade to get its summary for notifications
    const trade = trades.find(t => t.id === update.id);
    if (!trade) return;

    // Update the trade status
    updateStatus(update.id, update.status, update.txHash);

    // Send toast notification based on status
    switch (update.status) {
      case 'executing':
        toast.info(`🔄 Executing: ${trade.summary}`);
        break;
        
      case 'completed':
        toast.success(`✅ Trade completed: ${trade.summary}`, {
          action: update.txHash ? {
            label: 'View TX',
            onClick: () => window.open(`https://stellar.expert/explorer/public/tx/${update.txHash}`, '_blank')
          } : undefined
        });
        break;
        
      case 'failed':
        toast.error(`❌ Trade failed: ${trade.summary}`);
        break;
        
      case 'cancelled':
        toast.warning(`⚠️ Trade cancelled: ${trade.summary}`);
        break;
    }
  };

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    isConnected: isConnectedRef.current
  };
}