import { waitForConfirmation, TransactionPoller } from '@/lib/txPoller';
import { getTxStatus } from '@/lib/soroban';
import { vi } from 'vitest';

// Mock the soroban module
vi.mock('@/lib/soroban', () => ({
  getTxStatus: vi.fn(),
  getExplorerUrl: vi.fn((hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`)
}));

describe('Transaction Status Polling', () => {
  const mockHash = 'test-tx-hash-123456789abcdef';
  const mockGetTxStatus = getTxStatus as vi.MockedFunction<typeof getTxStatus>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForConfirmation', () => {
    it('should resolve when transaction becomes successful', async () => {
      // Mock progression: pending → successful
      mockGetTxStatus
        .mockResolvedValueOnce({ successful: false, pending: true })
        .mockResolvedValueOnce({ successful: false, pending: true })
        .mockResolvedValueOnce({ successful: true, pending: false, ledger: 12345 });

      const promise = waitForConfirmation(mockHash, { timeout: 10000, interval: 1000 });

      // Fast-forward through polling intervals
      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;

      expect(result).toEqual({
        hash: mockHash,
        successful: true,
        pending: false,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockHash}`,
        elapsedTime: expect.any(Number)
      });

      expect(mockGetTxStatus).toHaveBeenCalledTimes(3);
    });

    it('should call onProgress callback during polling', async () => {
      const onProgress = vi.fn();
      
      mockGetTxStatus
        .mockResolvedValueOnce({ successful: false, pending: true })
        .mockResolvedValueOnce({ successful: true, pending: false });

      const promise = waitForConfirmation(mockHash, { 
        timeout: 10000, 
        interval: 1000,
        onProgress 
      });

      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenCalledWith({
        hash: mockHash,
        successful: false,
        pending: true,
        explorerUrl: expect.any(String),
        elapsedTime: expect.any(Number)
      });
    });

    it('should timeout after specified duration', async () => {
      // Mock always pending
      mockGetTxStatus.mockResolvedValue({ successful: false, pending: true });

      const promise = waitForConfirmation(mockHash, { timeout: 5000, interval: 1000 });

      // Fast-forward past timeout
      await vi.advanceTimersByTimeAsync(6000);

      await expect(promise).rejects.toThrow('Timeout waiting for confirmation');
      expect(mockGetTxStatus).toHaveBeenCalledTimes(5); // Called every 1s for 5s
    });

    it('should throw error when transaction fails', async () => {
      mockGetTxStatus.mockResolvedValue({ 
        successful: false, 
        pending: false, 
        error: 'Transaction failed due to insufficient funds' 
      });

      const promise = waitForConfirmation(mockHash, { timeout: 10000, interval: 1000 });

      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('Transaction failed: Transaction failed due to insufficient funds');
    });

    it('should continue polling on network errors', async () => {
      // Mock network error, then success
      mockGetTxStatus
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ successful: true, pending: false });

      const promise = waitForConfirmation(mockHash, { timeout: 10000, interval: 1000 });

      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result.successful).toBe(true);
      expect(mockGetTxStatus).toHaveBeenCalledTimes(2);
    });

    it('should use default timeout and interval', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: true, pending: false });

      const promise = waitForConfirmation(mockHash);
      const result = await promise;

      expect(result.successful).toBe(true);
      expect(mockGetTxStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('TransactionPoller', () => {
    it('should poll transaction until successful', async () => {
      mockGetTxStatus
        .mockResolvedValueOnce({ successful: false, pending: true })
        .mockResolvedValueOnce({ successful: true, pending: false });

      const poller = new TransactionPoller(mockHash, { timeout: 10000, interval: 1000 });
      
      expect(poller.polling).toBe(false);
      
      const promise = poller.poll();
      
      expect(poller.polling).toBe(true);
      
      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(poller.polling).toBe(false);
      expect(result.successful).toBe(true);
    });

    it('should be abortable', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: false, pending: true });

      const poller = new TransactionPoller(mockHash, { timeout: 10000, interval: 1000 });
      const promise = poller.poll();

      expect(poller.polling).toBe(true);

      // Abort after 1 second
      setTimeout(() => poller.abort(), 1000);
      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('Transaction monitoring aborted');
      expect(poller.polling).toBe(false);
    });

    it('should not allow multiple concurrent polls', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: false, pending: true });

      const poller = new TransactionPoller(mockHash);
      const promise1 = poller.poll();

      await expect(poller.poll()).rejects.toThrow('Poller is already running');

      poller.abort();
      await expect(promise1).rejects.toThrow('Transaction monitoring aborted');
    });

    it('should call onProgress callback', async () => {
      const onProgress = vi.fn();
      
      mockGetTxStatus
        .mockResolvedValueOnce({ successful: false, pending: true })
        .mockResolvedValueOnce({ successful: true, pending: false });

      const poller = new TransactionPoller(mockHash, { 
        timeout: 10000, 
        interval: 1000,
        onProgress 
      });

      const promise = poller.poll();
      await vi.advanceTimersByTimeAsync(2000);
      await promise;

      expect(onProgress).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout gracefully', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: false, pending: true });

      const poller = new TransactionPoller(mockHash, { timeout: 3000, interval: 1000 });
      const promise = poller.poll();

      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow('Timeout waiting for confirmation');
      expect(poller.polling).toBe(false);
    });

    it('should provide correct status information', async () => {
      const onProgress = vi.fn();
      
      mockGetTxStatus.mockResolvedValue({ 
        successful: false, 
        pending: true 
      });

      const poller = new TransactionPoller(mockHash, { 
        timeout: 5000, 
        interval: 1000,
        onProgress 
      });

      const promise = poller.poll();
      await vi.advanceTimersByTimeAsync(1000);
      poller.abort();

      await expect(promise).rejects.toThrow('aborted');

      expect(onProgress).toHaveBeenCalledWith({
        hash: mockHash,
        successful: false,
        pending: true,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${mockHash}`,
        elapsedTime: expect.any(Number)
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle immediate success', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: true, pending: false });

      const result = await waitForConfirmation(mockHash);

      expect(result.successful).toBe(true);
      expect(mockGetTxStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction not found (404)', async () => {
      // Simulate Horizon 404 response
      const notFoundError = new Error('Not found');
      (notFoundError as any).response = { status: 404 };
      
      mockGetTxStatus
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce({ successful: true, pending: false });

      const promise = waitForConfirmation(mockHash, { timeout: 5000, interval: 1000 });
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result.successful).toBe(true);
    });

    it('should handle very short timeouts', async () => {
      mockGetTxStatus.mockResolvedValue({ successful: false, pending: true });

      const promise = waitForConfirmation(mockHash, { timeout: 100, interval: 1000 });
      await vi.advanceTimersByTimeAsync(200);

      await expect(promise).rejects.toThrow('Timeout');
    });

    it('should calculate elapsed time correctly', async () => {
      const onProgress = vi.fn();
      
      mockGetTxStatus.mockResolvedValue({ successful: true, pending: false });

      const startTime = Date.now();
      await waitForConfirmation(mockHash, { onProgress });

      const call = onProgress.mock.calls[0][0];
      expect(call.elapsedTime).toBeGreaterThanOrEqual(0);
      expect(call.elapsedTime).toBeLessThan(1000); // Should be very quick in tests
    });
  });
});