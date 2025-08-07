// Transaction monitoring utilities for Stellar network
import { Horizon } from '@stellar/stellar-sdk';

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  details?: any; // Transaction response from Horizon
  error?: string;
  timestamp: number;
}

export class TransactionMonitor {
  private server: Horizon.Server;
  private listeners: Map<string, (status: TransactionStatus) => void> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(networkUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new Horizon.Server(networkUrl);
  }

  /**
   * Monitor a transaction hash for completion
   * @param hash Transaction hash to monitor
   * @param callback Function to call when status changes
   * @param timeoutMs Timeout in milliseconds (default: 60s)
   */
  async monitorTransaction(
    hash: string, 
    callback: (status: TransactionStatus) => void,
    timeoutMs: number = 60000
  ): Promise<void> {
    // Store callback for this transaction
    this.listeners.set(hash, callback);

    // Set up timeout
    const timeout = setTimeout(() => {
      this.cleanup(hash);
      callback({
        hash,
        status: 'timeout',
        error: 'Transaction monitoring timed out',
        timestamp: Date.now()
      });
    }, timeoutMs);
    
    this.timeouts.set(hash, timeout);

    // Initial status
    callback({
      hash,
      status: 'pending',
      timestamp: Date.now()
    });

    // Start polling
    this.pollTransaction(hash);
  }

  private async pollTransaction(hash: string): Promise<void> {
    try {
      const response = await this.server.transactions().transaction(hash).call();
      
      // Transaction found and successful
      const callback = this.listeners.get(hash);
      if (callback) {
        callback({
          hash,
          status: response.successful ? 'success' : 'failed',
          details: response,
          error: response.successful ? undefined : 'Transaction failed on network',
          timestamp: Date.now()
        });
      }
      
      this.cleanup(hash);
      
    } catch (error: any) {
      // Transaction not found yet, continue polling if it's a 404
      if (error.response?.status === 404) {
        // Wait 2 seconds before next poll
        setTimeout(() => {
          if (this.listeners.has(hash)) {
            this.pollTransaction(hash);
          }
        }, 2000);
      } else {
        // Real error occurred
        const callback = this.listeners.get(hash);
        if (callback) {
          callback({
            hash,
            status: 'failed',
            error: error.message || 'Failed to query transaction',
            timestamp: Date.now()
          });
        }
        this.cleanup(hash);
      }
    }
  }

  private cleanup(hash: string): void {
    this.listeners.delete(hash);
    const timeout = this.timeouts.get(hash);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(hash);
    }
  }

  /**
   * Stop monitoring a specific transaction
   */
  stopMonitoring(hash: string): void {
    this.cleanup(hash);
  }

  /**
   * Stop monitoring all transactions
   */
  stopAll(): void {
    const hashes = Array.from(this.listeners.keys());
    for (const hash of hashes) {
      this.cleanup(hash);
    }
  }
}

// Global monitor instance for the app
export const globalTransactionMonitor = new TransactionMonitor();

/**
 * Helper function to monitor a transaction with toast notifications
 */
export async function monitorTransactionWithToasts(
  hash: string,
  toast: any
): Promise<TransactionStatus> {
  return new Promise((resolve) => {
    let toastId: string | undefined;

    globalTransactionMonitor.monitorTransaction(hash, (status) => {
      // Dismiss previous toast
      if (toastId) {
        toast.dismiss(toastId);
      }

      switch (status.status) {
        case 'pending':
          toastId = toast.loading(`⏳ Monitoring transaction ${hash.substring(0, 8)}...`, {
            duration: Infinity
          });
          break;
          
        case 'success':
          toast.success(`✅ Transaction confirmed! ${hash.substring(0, 8)}...`);
          resolve(status);
          break;
          
        case 'failed':
          toast.error(`❌ Transaction failed: ${status.error}`);
          resolve(status);
          break;
          
        case 'timeout':
          toast.error(`⏰ Transaction monitoring timed out. Check manually: ${hash.substring(0, 8)}...`);
          resolve(status);
          break;
      }
    });
  });
}