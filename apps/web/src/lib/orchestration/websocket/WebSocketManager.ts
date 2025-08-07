/**
 * WebSocket Manager for real-time updates
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

export class WebSocketManager extends EventEmitter {
  private url: string;
  private ws?: WebSocket;
  private logger: Logger;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private isConnected: boolean = false;

  constructor(url: string, logger?: Logger) {
    super();
    this.url = url;
    this.logger = logger || new Logger('WebSocketManager');
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Note: In browser environment, we'd use WebSocket directly
        // For Node.js, we'd need to import 'ws' package
        if (typeof window !== 'undefined') {
          this.ws = new WebSocket(this.url);
          
          this.ws.onopen = () => {
            this.logger.info('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
            resolve();
          };

          this.ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              this.handleMessage(data);
            } catch (error) {
              this.logger.error('Failed to parse WebSocket message:', error);
            }
          };

          this.ws.onerror = (error) => {
            this.logger.error('WebSocket error:', error);
            this.emit('error', error);
          };

          this.ws.onclose = () => {
            this.logger.info('WebSocket disconnected');
            this.isConnected = false;
            this.emit('disconnected');
            this.attemptReconnect();
          };
        } else {
          // Server-side WebSocket would be handled differently
          this.logger.warn('WebSocket not available in server environment');
          resolve();
        }
      } catch (error) {
        this.logger.error('Failed to connect WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleMessage(data: any): void {
    const { type, payload } = data;
    this.emit(type, payload);
    this.emit('message', data);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.logger.info(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  send(type: string, payload: any): void {
    if (!this.isConnected || !this.ws) {
      this.logger.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message = JSON.stringify({ type, payload });
    this.ws.send(message);
  }

  broadcast(type: string, payload: any): void {
    this.send('broadcast', { type, payload });
  }

  sendToClient(clientId: string, type: string, payload: any): void {
    this.send('client:message', { clientId, type, payload });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.isConnected = false;
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}