import { EventEmitter } from 'events';

const SOROSWAP_WS_URL = process.env.NEXT_PUBLIC_SOROSWAP_WS_URL || 'wss://api.soroswap.finance/prices';

export interface PriceUpdate {
  pair: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: number;
}

export interface OrderBookUpdate {
  pair: string;
  bids: Array<[number, number]>; // [price, amount]
  asks: Array<[number, number]>; // [price, amount]
  timestamp: number;
}

export class SoroswapWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscribedPairs: Set<string> = new Set();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    super();
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(SOROSWAP_WS_URL);

      this.ws.onopen = () => {
        console.log('Soroswap WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emit('connected');
        
        // Resubscribe to previously subscribed pairs
        this.subscribedPairs.forEach(pair => {
          this.subscribe(pair);
        });

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'price':
        this.emit('price', data.data as PriceUpdate);
        break;
      case 'orderbook':
        this.emit('orderbook', data.data as OrderBookUpdate);
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  subscribe(pair: string) {
    this.subscribedPairs.add(pair);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        pairs: [pair]
      }));
    }
  }

  unsubscribe(pair: string) {
    this.subscribedPairs.delete(pair);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        pairs: [pair]
      }));
    }
  }

  subscribeToOrderBook(pair: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_orderbook',
        pair
      }));
    }
  }

  unsubscribeFromOrderBook(pair: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe_orderbook',
        pair
      }));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscribedPairs.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: SoroswapWebSocket | null = null;

export function getSoroswapWebSocket(): SoroswapWebSocket {
  if (!wsInstance) {
    wsInstance = new SoroswapWebSocket();
  }
  return wsInstance;
}

export function closeSoroswapWebSocket() {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}