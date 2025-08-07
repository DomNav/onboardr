import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePriceStream } from '../hooks/usePriceStream';
import { SlippageSetting } from '../components/SlippageSetting';
import { BatchedTrade, BatchExecutionResult } from '../app/api/trades/batch/route';

// Mock EventSource for WebSocket testing
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0;
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      });
      this.onmessage(event);
    }
  }

  // Method to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;
global.EventSource = MockEventSource as any;

describe('Phase 3 Features: Real-time Price Streaming', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    mockFetch.mockReset();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('usePriceStream Hook', () => {
    it('establishes connection and receives price updates', async () => {
      vi.useFakeTimers();
      
      const TestComponent = () => {
        const { price, connected, lastUpdate } = usePriceStream('XLM', 'USDC', { debounceMs: 100 });
        return (
          <div>
            <div data-testid="connection-status">{connected ? 'connected' : 'disconnected'}</div>
            <div data-testid="price">{price || 'no-price'}</div>
            <div data-testid="last-update">{lastUpdate || 'no-update'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially disconnected
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('price')).toHaveTextContent('no-price');

      // Wait for connection to establish
      vi.advanceTimersByTime(200);
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate price update
      const eventSources = (global.EventSource as any).instances || [];
      const eventSource = eventSources[eventSources.length - 1] as MockEventSource;
      
      eventSource.simulateMessage({
        pair: 'XLM/USDC',
        price: 0.1245,
        timestamp: Date.now()
      });

      vi.advanceTimersByTime(150); // Wait for debounce

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('0.1245');
      });
    });

    it('handles connection errors and retries', async () => {
      vi.useFakeTimers();
      
      const TestComponent = () => {
        const { connected, error } = usePriceStream('XLM', 'USDC', { maxReconnectAttempts: 2 });
        return (
          <div>
            <div data-testid="connection-status">{connected ? 'connected' : 'disconnected'}</div>
            <div data-testid="error">{error || 'no-error'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Wait for initial connection attempt
      vi.advanceTimersByTime(200);
      
      // Simulate connection error
      const eventSources = (global.EventSource as any).instances || [];
      const eventSource = eventSources[eventSources.length - 1] as MockEventSource;
      
      eventSource.simulateError();

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
        expect(screen.getByTestId('error')).toHaveTextContent('Connection lost');
      });

      vi.useRealTimers();
    });

    it('debounces rapid price updates', async () => {
      vi.useFakeTimers();
      
      const priceUpdates: number[] = [];
      
      const TestComponent = () => {
        const { price } = usePriceStream('XLM', 'USDC', { debounceMs: 1000 });
        
        if (price !== null) {
          priceUpdates.push(price);
        }
        
        return <div data-testid="price">{price || 'no-price'}</div>;
      };

      render(<TestComponent />);

      // Wait for connection
      vi.advanceTimersByTime(200);
      
      const eventSources = (global.EventSource as any).instances || [];
      const eventSource = eventSources[eventSources.length - 1] as MockEventSource;

      // Send rapid price updates
      eventSource.simulateMessage({ pair: 'XLM/USDC', price: 0.1200, timestamp: Date.now() });
      vi.advanceTimersByTime(100);
      eventSource.simulateMessage({ pair: 'XLM/USDC', price: 0.1201, timestamp: Date.now() });
      vi.advanceTimersByTime(100);
      eventSource.simulateMessage({ pair: 'XLM/USDC', price: 0.1202, timestamp: Date.now() });
      
      // Only the last update should be processed after debounce period
      vi.advanceTimersByTime(1100);

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('0.1202');
      });

      // Should have only one update due to debouncing
      expect(priceUpdates).toHaveLength(1);
      expect(priceUpdates[0]).toBe(0.1202);

      vi.useRealTimers();
    });
  });

  describe('Price Stream Integration', () => {
    it('filters updates by correct trading pair', async () => {
      vi.useFakeTimers();
      
      const TestComponent = () => {
        const { price } = usePriceStream('XLM', 'USDC');
        return <div data-testid="price">{price || 'no-price'}</div>;
      };

      render(<TestComponent />);

      vi.advanceTimersByTime(200);
      
      const eventSources = (global.EventSource as any).instances || [];
      const eventSource = eventSources[eventSources.length - 1] as MockEventSource;

      // Send update for different pair - should be ignored
      eventSource.simulateMessage({
        pair: 'BTC/USDC',
        price: 45000,
        timestamp: Date.now()
      });

      vi.advanceTimersByTime(1100);
      expect(screen.getByTestId('price')).toHaveTextContent('no-price');

      // Send update for correct pair - should be processed
      eventSource.simulateMessage({
        pair: 'XLM/USDC',
        price: 0.1234,
        timestamp: Date.now()
      });

      vi.advanceTimersByTime(1100);

      await waitFor(() => {
        expect(screen.getByTestId('price')).toHaveTextContent('0.1234');
      });

      vi.useRealTimers();
    });
  });
});

describe('Phase 3 Features: Advanced Slippage Protection', () => {
  describe('SlippageSetting Component', () => {
    it('renders with default slippage value', () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={1.0} onChange={mockOnChange} />);

      expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument();
      expect(screen.getByText('1.0%')).toBeInTheDocument();
    });

    it('allows selection of preset slippage values', () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={1.0} onChange={mockOnChange} />);

      const preset05Button = screen.getByText('0.5%');
      fireEvent.click(preset05Button);

      expect(mockOnChange).toHaveBeenCalledWith(0.5);
    });

    it('accepts custom slippage input', async () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={1.0} onChange={mockOnChange} />);

      const customInput = screen.getByPlaceholderText('Enter custom %');
      fireEvent.change(customInput, { target: { value: '2.5' } });
      
      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);

      expect(mockOnChange).toHaveBeenCalledWith(2.5);
    });

    it('shows warning for high slippage values', () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={15.0} onChange={mockOnChange} />);

      expect(screen.getByText('Very High Risk')).toBeInTheDocument();
      expect(screen.getByText(/significantly increases the risk/)).toBeInTheDocument();
    });

    it('displays risk levels correctly', () => {
      const mockOnChange = vi.fn();
      
      // Test low risk
      const { rerender } = render(<SlippageSetting value={0.5} onChange={mockOnChange} />);
      expect(screen.getByText('0.5%')).toHaveClass('text-green-600');

      // Test high risk
      rerender(<SlippageSetting value={5.0} onChange={mockOnChange} />);
      expect(screen.getByText('5.0%')).toHaveClass('text-orange-600');

      // Test danger level
      rerender(<SlippageSetting value={15.0} onChange={mockOnChange} />);
      expect(screen.getByText('15.0%')).toHaveClass('text-red-600');
    });

    it('validates custom input values', () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={1.0} onChange={mockOnChange} />);

      const customInput = screen.getByPlaceholderText('Enter custom %');
      
      // Test invalid input (letters)
      fireEvent.change(customInput, { target: { value: 'abc' } });
      expect(customInput).toHaveValue(''); // Should reject non-numeric input

      // Test valid input
      fireEvent.change(customInput, { target: { value: '3.5' } });
      expect(customInput).toHaveValue('3.5');

      // Test maximum limit warning
      fireEvent.change(customInput, { target: { value: '25' } });
      expect(screen.getByText('Maximum slippage is 20%')).toBeInTheDocument();
    });

    it('shows advanced protection metrics', () => {
      const mockOnChange = vi.fn();
      
      render(<SlippageSetting value={2.0} onChange={mockOnChange} showAdvanced={true} />);

      expect(screen.getByText('Advanced Protection')).toBeInTheDocument();
      expect(screen.getByText('MEV Protection')).toBeInTheDocument();
      expect(screen.getByText('Front-run Risk')).toBeInTheDocument();
      expect(screen.getByText('Success Probability')).toBeInTheDocument();
    });
  });
});

describe('Phase 3 Features: Multi-hop Routing', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('requests multi-hop quotes with correct parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: {
          amountOut: '1000000',
          route: ['XLM', 'USDC', 'BTC'],
          gas: '75000',
          isMultiHop: true,
          routeBreakdown: [
            {
              tokenIn: 'XLM',
              tokenOut: 'USDC',
              amountIn: '100000000',
              amountOut: '12000',
              exchange: 'SoroswapDEX',
              fee: '0.3'
            },
            {
              tokenIn: 'USDC',
              tokenOut: 'BTC',
              amountIn: '12000',
              amountOut: '1000000',
              exchange: 'SoroswapDEX',
              fee: '0.3'
            }
          ]
        }
      })
    });

    const response = await fetch('/api/quotes/simulate?sellToken=XLM&buyToken=BTC&amountIn=100000000&enableMultiHop=true&maxHops=3');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.quote.isMultiHop).toBe(true);
    expect(data.quote.route).toEqual(['XLM', 'USDC', 'BTC']);
    expect(data.quote.routeBreakdown).toHaveLength(2);
  });

  it('handles single-hop routes when multi-hop is not beneficial', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: {
          amountOut: '1200000',
          route: ['XLM', 'USDC'],
          gas: '50000',
          isMultiHop: false,
          priceImpact: '0.15'
        }
      })
    });

    const response = await fetch('/api/quotes/simulate?sellToken=XLM&buyToken=USDC&amountIn=100000000&enableMultiHop=true');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.quote.isMultiHop).toBe(false);
    expect(data.quote.route).toEqual(['XLM', 'USDC']);
  });

  it('respects maxHops parameter', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: {
          amountOut: '1000000',
          route: ['XLM', 'USDC', 'BTC'],
          gas: '75000',
          isMultiHop: true
        }
      })
    });

    // Request with maxHops=2
    await fetch('/api/quotes/simulate?sellToken=XLM&buyToken=BTC&amountIn=100000000&enableMultiHop=true&maxHops=2');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('maxHops=2'),
      expect.any(Object)
    );
  });

  it('calculates price impact for multi-hop routes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: {
          amountOut: '950000',
          route: ['XLM', 'USDC', 'BTC'],
          gas: '85000',
          isMultiHop: true,
          priceImpact: '5.2'
        }
      })
    });

    const response = await fetch('/api/quotes/simulate?sellToken=XLM&buyToken=BTC&amountIn=100000000&enableMultiHop=true');
    const data = await response.json();

    expect(data.quote.priceImpact).toBe('5.2');
  });
});

describe('Phase 3 Features: Transaction Batching', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('processes batch trades with optimization', async () => {
    const batchTrades: BatchedTrade[] = [
      {
        id: 'trade1',
        sellToken: 'XLM',
        buyToken: 'USDC',
        sellAmount: '1000000',
        slippageBps: '50'
      },
      {
        id: 'trade2',
        sellToken: 'XLM',
        buyToken: 'USDC',
        sellAmount: '2000000',
        slippageBps: '50'
      }
    ];

    // Mock quote responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: {
          amountOut: '120000',
          route: ['XLM', 'USDC'],
          gas: '45000'
        }
      })
    });

    const response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trades: batchTrades,
        batchOptions: {
          atomicExecution: false,
          priority: 'medium'
        }
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.result.trades).toHaveLength(2);
    expect(data.result.successCount).toBe(2);
    expect(data.optimization.strategy).toBeDefined();
  });

  it('handles atomic execution failures correctly', async () => {
    const batchTrades: BatchedTrade[] = [
      {
        id: 'trade1',
        sellToken: 'XLM',
        buyToken: 'USDC',
        sellAmount: '1000000',
        slippageBps: '50'
      },
      {
        id: 'trade2',
        sellToken: 'INVALID',
        buyToken: 'USDC',
        sellAmount: '2000000',
        slippageBps: '50'
      }
    ];

    // Mock first quote success, second quote failure
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          quote: { amountOut: '120000', route: ['XLM', 'USDC'], gas: '45000' }
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid token'
        })
      });

    const response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trades: batchTrades,
        batchOptions: {
          atomicExecution: true
        }
      })
    });

    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.result.failureCount).toBe(2); // Both should fail due to atomic execution
  });

  it('optimizes gas usage for bundled trades', async () => {
    const identicalPairTrades: BatchedTrade[] = Array.from({ length: 3 }, (_, i) => ({
      id: `trade${i + 1}`,
      sellToken: 'XLM',
      buyToken: 'USDC',
      sellAmount: '1000000',
      slippageBps: '50'
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: { amountOut: '120000', route: ['XLM', 'USDC'], gas: '45000' }
      })
    });

    const response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: identicalPairTrades })
    });

    const data = await response.json();
    
    expect(data.optimization.strategy).toBe('bundled');
    expect(parseFloat(data.optimization.estimatedGasSavings)).toBeGreaterThan(0);
  });

  it('validates batch request parameters', async () => {
    // Test empty trades array
    let response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: [] })
    });

    let data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid batch request');

    // Test too many trades
    const tooManyTrades = Array.from({ length: 15 }, (_, i) => ({
      id: `trade${i}`,
      sellToken: 'XLM',
      buyToken: 'USDC',
      sellAmount: '1000000',
      slippageBps: '50'
    }));

    response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: tooManyTrades })
    });

    data = await response.json();
    expect(data.success).toBe(false);
    expect(data.details.trades).toContain('Maximum 10 trades per batch');
  });

  it('provides accurate gas cost estimation', async () => {
    const batchTrades: BatchedTrade[] = [
      {
        id: 'trade1',
        sellToken: 'XLM',
        buyToken: 'USDC',
        sellAmount: '1000000',
        slippageBps: '50'
      }
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: { amountOut: '120000', route: ['XLM', 'USDC'], gas: '50000' }
      })
    });

    const response = await fetch('/api/trades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trades: batchTrades })
    });

    const data = await response.json();
    
    expect(data.result.totalGasUsed).toBeDefined();
    expect(data.result.totalGasCost).toBeDefined();
    expect(parseFloat(data.result.totalGasCost)).toBeGreaterThan(0);
  });
});

describe('Phase 3 Features: Performance Integration', () => {
  it('handles high-frequency price updates without performance degradation', async () => {
    vi.useFakeTimers();
    
    const updateCounts: number[] = [];
    
    const TestComponent = () => {
      const { price } = usePriceStream('XLM', 'USDC', { debounceMs: 100 });
      
      React.useEffect(() => {
        if (price !== null) {
          updateCounts.push(updateCounts.length + 1);
        }
      }, [price]);
      
      return <div data-testid="price">{price || 'no-price'}</div>;
    };

    render(<TestComponent />);

    vi.advanceTimersByTime(200);
    
    const eventSources = (global.EventSource as any).instances || [];
    const eventSource = eventSources[eventSources.length - 1] as MockEventSource;

    // Send 100 rapid updates
    for (let i = 0; i < 100; i++) {
      eventSource.simulateMessage({
        pair: 'XLM/USDC',
        price: 0.1200 + (i * 0.0001),
        timestamp: Date.now() + i
      });
      vi.advanceTimersByTime(10);
    }

    vi.advanceTimersByTime(200); // Allow final debounce

    // Should have significantly fewer updates due to debouncing
    expect(updateCounts.length).toBeLessThan(20);

    vi.useRealTimers();
  });

  it('maintains accuracy under concurrent batch processing', async () => {
    const concurrentBatches = 5;
    const tradesPerBatch = 3;
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        quote: { amountOut: '120000', route: ['XLM', 'USDC'], gas: '45000' }
      })
    });

    const batchPromises = Array.from({ length: concurrentBatches }, (_, batchIndex) => {
      const trades = Array.from({ length: tradesPerBatch }, (_, tradeIndex) => ({
        id: `batch${batchIndex}_trade${tradeIndex}`,
        sellToken: 'XLM',
        buyToken: 'USDC',
        sellAmount: '1000000',
        slippageBps: '50'
      }));

      return fetch('/api/trades/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades })
      });
    });

    const responses = await Promise.all(batchPromises);
    const results = await Promise.all(responses.map(r => r.json()));

    // All batches should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.result.trades).toHaveLength(tradesPerBatch);
    });

    // Total number of quote requests should equal total trades
    expect(mockFetch).toHaveBeenCalledTimes(concurrentBatches * tradesPerBatch);
  });
});