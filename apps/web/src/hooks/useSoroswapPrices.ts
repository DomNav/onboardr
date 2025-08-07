import { useEffect, useState, useCallback } from 'react';
import { getSoroswapWebSocket, PriceUpdate } from '@/lib/soroswap/websocket';

interface PriceData {
  [pair: string]: {
    price: number;
    volume24h: number;
    priceChange24h: number;
    lastUpdate: number;
  };
}

export function useSoroswapPrices(pairs: string[]) {
  const [prices, setPrices] = useState<PriceData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = getSoroswapWebSocket();

    const handlePrice = (update: PriceUpdate) => {
      setPrices(prev => ({
        ...prev,
        [update.pair]: {
          price: update.price,
          volume24h: update.volume24h,
          priceChange24h: update.priceChange24h,
          lastUpdate: update.timestamp,
        }
      }));
    };

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
      
      // Subscribe to all requested pairs
      pairs.forEach(pair => {
        ws.subscribe(pair);
      });
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleError = (err: any) => {
      setError(err?.message || 'WebSocket error');
    };

    const handleMaxReconnectFailed = () => {
      setError('Failed to connect to price feed after multiple attempts');
    };

    // Register event listeners
    ws.on('price', handlePrice);
    ws.on('connected', handleConnected);
    ws.on('disconnected', handleDisconnected);
    ws.on('error', handleError);
    ws.on('max_reconnect_failed', handleMaxReconnectFailed);

    // Subscribe to pairs if already connected
    if (ws.isConnected()) {
      pairs.forEach(pair => {
        ws.subscribe(pair);
      });
    }

    // Cleanup
    return () => {
      ws.off('price', handlePrice);
      ws.off('connected', handleConnected);
      ws.off('disconnected', handleDisconnected);
      ws.off('error', handleError);
      ws.off('max_reconnect_failed', handleMaxReconnectFailed);
      
      // Unsubscribe from pairs
      pairs.forEach(pair => {
        ws.unsubscribe(pair);
      });
    };
  }, [pairs]);

  const subscribeToPair = useCallback((pair: string) => {
    const ws = getSoroswapWebSocket();
    ws.subscribe(pair);
  }, []);

  const unsubscribeFromPair = useCallback((pair: string) => {
    const ws = getSoroswapWebSocket();
    ws.unsubscribe(pair);
  }, []);

  return {
    prices,
    isConnected,
    error,
    subscribeToPair,
    unsubscribeFromPair,
  };
}

// Hook for single pair price
export function useSoroswapPrice(pair: string) {
  const { prices, isConnected, error } = useSoroswapPrices([pair]);
  
  return {
    price: prices[pair]?.price || null,
    volume24h: prices[pair]?.volume24h || null,
    priceChange24h: prices[pair]?.priceChange24h || null,
    lastUpdate: prices[pair]?.lastUpdate || null,
    isConnected,
    error,
  };
}