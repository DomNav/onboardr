import { getTxStatus, getExplorerUrl } from './soroban';

export interface TxStatus {
  hash: string;
  successful: boolean;
  pending: boolean;
  error?: string;
  explorerUrl: string;
  elapsedTime: number;
}

export interface TxPollerOptions {
  timeout?: number;        // Total timeout in ms (default: 90000 = 90s)
  interval?: number;       // Polling interval in ms (default: 3000 = 3s)
  onProgress?: (status: TxStatus) => void;  // Called on each poll
}

/**
 * Wait for transaction confirmation with polling
 * @param hash - Transaction hash to monitor
 * @param options - Polling configuration
 * @returns Promise that resolves when transaction is confirmed
 */
export async function waitForConfirmation(
  hash: string, 
  options: TxPollerOptions = {}
): Promise<TxStatus> {
  const {
    timeout = 90000,      // 90 seconds default
    interval = 3000,      // 3 seconds default
    onProgress
  } = options;
  
  const startTime = Date.now();
  const explorerUrl = getExplorerUrl(hash);
  
  console.log(`Starting transaction monitoring for ${hash}`);
  console.log(`Explorer URL: ${explorerUrl}`);
  
  while (Date.now() - startTime < timeout) {
    try {
      const status = await getTxStatus(hash);
      const elapsedTime = Date.now() - startTime;
      
      const txStatus: TxStatus = {
        hash,
        successful: status.successful,
        pending: status.pending,
        error: status.error,
        explorerUrl,
        elapsedTime
      };
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(txStatus);
      }
      
      // Transaction confirmed successfully
      if (status.successful) {
        console.log(`Transaction confirmed in ${elapsedTime}ms: ${hash}`);
        return txStatus;
      }
      
      // Transaction failed
      if (!status.pending && status.error) {
        console.error(`Transaction failed: ${status.error}`);
        throw new Error(`Transaction failed: ${status.error}`);
      }
      
      // Still pending, continue polling
      console.log(`Transaction pending (${Math.round(elapsedTime / 1000)}s): ${hash}`);
      
    } catch (error) {
      // If it's a timeout or definite failure, throw it
      if (error instanceof Error && error.message.includes('failed')) {
        throw error;
      }
      
      // For other errors (network issues, etc.), continue polling
      console.warn('Error checking transaction status, retrying...', error);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Timeout reached
  const elapsedTime = Date.now() - startTime;
  const timeoutStatus: TxStatus = {
    hash,
    successful: false,
    pending: true,
    error: `Timeout after ${Math.round(elapsedTime / 1000)}s`,
    explorerUrl,
    elapsedTime
  };
  
  console.error(`Transaction monitoring timeout: ${hash}`);
  throw new Error(`Timeout waiting for confirmation after ${Math.round(elapsedTime / 1000)}s`);
}

/**
 * Create a transaction poller with progress tracking
 * Useful for UI components that need to show progress
 */
export class TransactionPoller {
  private hash: string;
  private options: TxPollerOptions;
  private abortController: AbortController;
  private isPolling: boolean = false;
  
  constructor(hash: string, options: TxPollerOptions = {}) {
    this.hash = hash;
    this.options = options;
    this.abortController = new AbortController();
  }
  
  /**
   * Start polling for transaction confirmation
   */
  async poll(): Promise<TxStatus> {
    if (this.isPolling) {
      throw new Error('Poller is already running');
    }
    
    this.isPolling = true;
    
    try {
      return await this.pollWithAbort();
    } finally {
      this.isPolling = false;
    }
  }
  
  /**
   * Stop polling
   */
  abort(): void {
    console.log(`Aborting transaction polling: ${this.hash}`);
    this.abortController.abort();
    this.isPolling = false;
  }
  
  /**
   * Check if currently polling
   */
  get polling(): boolean {
    return this.isPolling;
  }
  
  private async pollWithAbort(): Promise<TxStatus> {
    const { timeout = 90000, interval = 3000, onProgress } = this.options;
    const startTime = Date.now();
    const explorerUrl = getExplorerUrl(this.hash);
    
    while (Date.now() - startTime < timeout && !this.abortController.signal.aborted) {
      try {
        const status = await getTxStatus(this.hash);
        const elapsedTime = Date.now() - startTime;
        
        const txStatus: TxStatus = {
          hash: this.hash,
          successful: status.successful,
          pending: status.pending,
          error: status.error,
          explorerUrl,
          elapsedTime
        };
        
        if (onProgress && !this.abortController.signal.aborted) {
          onProgress(txStatus);
        }
        
        if (status.successful) {
          return txStatus;
        }
        
        if (!status.pending && status.error) {
          throw new Error(`Transaction failed: ${status.error}`);
        }
        
      } catch (error) {
        if (this.abortController.signal.aborted) {
          throw new Error('Transaction monitoring aborted');
        }
        
        if (error instanceof Error && error.message.includes('failed')) {
          throw error;
        }
      }
      
      // Wait with abort check
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, interval);
        
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Transaction monitoring aborted'));
        });
      });
    }
    
    if (this.abortController.signal.aborted) {
      throw new Error('Transaction monitoring aborted');
    }
    
    throw new Error(`Timeout waiting for confirmation after ${Math.round((Date.now() - startTime) / 1000)}s`);
  }
}

// TODO: Add exponential backoff for failed polls
// TODO: Add support for monitoring multiple transactions
// TODO: Add transaction result caching to avoid redundant API calls