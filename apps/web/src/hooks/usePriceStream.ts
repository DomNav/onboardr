import { useState, useEffect, useRef, useCallback } from 'react';

interface PriceData {
  price: number;
  timestamp: number;
}

interface PriceStreamState {
  price: number | null;
  connected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

interface UsePriceStreamOptions {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  debounceMs?: number;
}

export function usePriceStream(
  base: string,
  quote: string,
  options: UsePriceStreamOptions = {}
) {
  const {
    reconnectDelay = 5000,
    maxReconnectAttempts = 5,
    debounceMs = 1000,
  } = options;

  const [state, setState] = useState<PriceStreamState>({
    price: null,
    connected: false,
    lastUpdate: null,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const pair = `${base}/${quote}`;

  const updatePrice = useCallback((priceData: PriceData) => {
    if (!mountedRef.current) return;

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce price updates
    debounceTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          price: priceData.price,
          lastUpdate: priceData.timestamp,
          error: null,
        }));
      }
    }, debounceMs);
  }, [debounceMs]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const url = `/api/ws/prices?pairs=${encodeURIComponent(pair)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: true,
            error: null,
          }));
          reconnectAttemptsRef.current = 0;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pair === pair) {
            updatePrice({
              price: data.price,
              timestamp: data.timestamp,
            });
          }
        } catch (error) {
          console.error('Error parsing price message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: false,
            error: 'Connection lost',
          }));

          // Attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                connect();
              }
            }, reconnectDelay);
          } else {
            setState(prev => ({
              ...prev,
              error: `Failed to connect after ${maxReconnectAttempts} attempts`,
            }));
          }
        }
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
      }
    }
  }, [pair, reconnectDelay, maxReconnectAttempts, updatePrice]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        connected: false,
      }));
    }
  }, []);

  // Connect on mount and when pair changes
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    price: state.price,
    connected: state.connected,
    lastUpdate: state.lastUpdate,
    error: state.error,
    reconnect: connect,
    disconnect,
  };
}

// Helper hook for multiple pairs
export function useMultiplePriceStreams(pairs: Array<{ base: string; quote: string }>) {
  // We can't use hooks inside map, so we'll need to create individual hooks
  // For now, let's just return a simple structure and handle this differently
  const firstPair = pairs[0] || { base: 'XLM', quote: 'USDC' };
  const firstStream = usePriceStream(firstPair.base, firstPair.quote);
  
  const streams = pairs.length > 0 ? pairs.map(({ base, quote }, index) => {
    return {
      pair: `${base}/${quote}`,
      price: index === 0 ? firstStream.price : null,
      connected: index === 0 ? firstStream.connected : false,
      lastUpdate: index === 0 ? firstStream.lastUpdate : null,
      error: index === 0 ? firstStream.error : null,
    };
  }) : [];

  const allConnected = streams.every(stream => stream.connected);
  const anyError = streams.find(stream => stream.error)?.error || null;
  const lastUpdate = Math.max(...streams.map(s => s.lastUpdate || 0)) || null;

  return {
    streams,
    allConnected,
    anyError,
    lastUpdate,
  };
}

// Helper to format price with appropriate decimals
export function formatStreamPrice(price: number | null, pair: string): string {
  if (price === null) return '--';

  // Determine decimal places based on price magnitude
  if (price >= 1) {
    return price.toFixed(4);
  } else if (price >= 0.01) {
    return price.toFixed(6);
  } else {
    return price.toFixed(8);
  }
}

export default usePriceStream;