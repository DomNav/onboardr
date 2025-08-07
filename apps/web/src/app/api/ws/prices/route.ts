import { NextRequest } from 'next/server';

export const runtime = 'edge';

interface PriceMessage {
  pair: string;
  price: number;
  timestamp: number;
}

// Global state for price streaming
const globalState = {
  connections: new Map<string, { ws: WebSocket; subscriptions: Set<string> }>(),
  priceCache: new Map<string, PriceMessage>(),
  upstreamWs: null as WebSocket | null,
  reconnectTimeout: null as any,
};

function connectToUpstream() {
  try {
    const wsUrl = process.env.SOROSWAP_WS_URL || 'wss://api.soroswap.finance/prices';
    globalState.upstreamWs = new WebSocket(wsUrl);

    globalState.upstreamWs.onopen = () => {
      console.log('Connected to upstream price feed');
      if (globalState.reconnectTimeout) {
        clearTimeout(globalState.reconnectTimeout);
      }
    };

    globalState.upstreamWs.onmessage = (event) => {
      try {
        const message: PriceMessage = JSON.parse(event.data);
        
        // Update price cache
        globalState.priceCache.set(message.pair, message);
        
        // Broadcast to all subscribed clients
        for (const [_clientId, client] of globalState.connections) {
          if (client.subscriptions.has(message.pair) && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
          }
        }
      } catch (error) {
        console.error('Error parsing upstream message:', error);
      }
    };

    globalState.upstreamWs.onclose = (event) => {
      console.log('Upstream connection closed:', event.code, event.reason);
      globalState.upstreamWs = null;
      
      // Reconnect after delay
      globalState.reconnectTimeout = setTimeout(connectToUpstream, 5000);
      
      // Notify all clients about disconnection
      for (const [_clientId, client] of globalState.connections) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.close(1001, 'Upstream disconnected');
        }
      }
    };

    globalState.upstreamWs.onerror = (error) => {
      console.error('Upstream WebSocket error:', error);
    };

  } catch (error) {
    console.error('Failed to connect to upstream:', error);
    globalState.reconnectTimeout = setTimeout(connectToUpstream, 5000);
  }
}

// For Next.js Edge runtime, we'll use Server-Sent Events instead of WebSockets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pairs = searchParams.get('pairs')?.split(',') || [];

  if (pairs.length === 0) {
    return new Response('Missing pairs parameter', { status: 400 });
  }

  // Check if client wants WebSocket upgrade (browsers will set this)
  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader === 'websocket') {
    return new Response('WebSocket not supported in this runtime. Use Server-Sent Events.', { 
      status: 501,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Initialize upstream connection if needed
  if (!globalState.upstreamWs) {
    connectToUpstream();
  }

  // Create Server-Sent Events stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const clientId = Math.random().toString(36).substring(7);
      
      // Create mock WebSocket-like object for compatibility
      const mockWs = {
        readyState: 1, // OPEN
        send: (data: string) => {
          try {
            // Check if controller is still open before enqueuing
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } catch (error) {
            // Controller already closed, clean up this connection
            globalState.connections.delete(clientId);
          }
        },
        close: () => {
          try {
            if (controller.desiredSize !== null) {
              controller.close();
            }
          } catch (error) {
            // Already closed, ignore
          }
        }
      };

      // Register client
      globalState.connections.set(clientId, {
        ws: mockWs as any,
        subscriptions: new Set(pairs)
      });

      // Send cached prices immediately
      for (const pair of pairs) {
        const cachedPrice = globalState.priceCache.get(pair);
        if (cachedPrice) {
          mockWs.send(JSON.stringify(cachedPrice));
        }
      }

      // Cleanup on close
      const cleanup = () => {
        globalState.connections.delete(clientId);
      };

      // Set up cleanup timer (client will reconnect if needed)
      setTimeout(cleanup, 300000); // 5 minutes max connection time
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Fallback for development - mock price feed
if (process.env.NODE_ENV === 'development' && !process.env.SOROSWAP_WS_URL) {
  console.log('Starting mock price feed for development');
  
  const mockPairs = ['XLM/USDC', 'XLM/BTC', 'USDC/BTC'];
  const mockBasePrice = { 'XLM/USDC': 0.12, 'XLM/BTC': 0.000003, 'USDC/BTC': 0.000025 };
  
  setInterval(() => {
    for (const pair of mockPairs) {
      const basePrice = mockBasePrice[pair as keyof typeof mockBasePrice];
      const variance = 0.02; // 2% variance
      const change = (Math.random() - 0.5) * 2 * variance;
      const newPrice = basePrice * (1 + change);
      
      const message: PriceMessage = {
        pair,
        price: newPrice,
        timestamp: Date.now(),
      };
      
      // Update cache
      globalState.priceCache.set(pair, message);
      
      // Broadcast to clients
      for (const [clientId, client] of globalState.connections) {
        if (client.subscriptions.has(pair) && client.ws.readyState === 1) {
          try {
            client.ws.send(JSON.stringify(message));
          } catch (error) {
            // Connection is stale, remove it
            globalState.connections.delete(clientId);
          }
        }
      }
    }
  }, 3000); // Update every 3 seconds in dev mode
}

// Internal function for connection status (not exported to avoid Next.js conflicts)
function _getConnectionStatus() {
  const timestamps = Array.from(globalState.priceCache.values()).map(p => p.timestamp);
  const lastUpdate = timestamps.length > 0 ? Math.max(...timestamps) : null;
  
  return {
    upstreamConnected: globalState.upstreamWs?.readyState === 1, // Use numeric constant instead of WebSocket.OPEN
    clientConnections: globalState.connections.size,
    cachedPairs: globalState.priceCache.size,
    lastUpdate,
  };
}