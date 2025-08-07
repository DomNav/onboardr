import { POST } from '../app/api/trades/prep/route';
import { GET } from '../app/api/quotes/simulate/route';
import { NextRequest } from 'next/server';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import TradeQueueCard from '../components/TradeQueueCard';

describe('/api/quotes/simulate', () => {
  it('returns successful quote with amountOut defined', async () => {
    const url = new URL('http://localhost/api/quotes/simulate');
    url.searchParams.set('sellToken', 'XLM');
    url.searchParams.set('buyToken', 'USDC');
    url.searchParams.set('amountIn', '1000000000'); // 1000 XLM
    url.searchParams.set('slippageBps', '50'); // 0.5%

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.quote).toBeDefined();
    expect(data.quote.amountOut).toBeDefined();
    expect(data.quote.amountOut).toBe('950000000');
    expect(data.quote.route).toEqual(['XLM', 'USDC']);
    expect(data.quote.gas).toBe('100000');
  });

  it('returns 502 when router service fails', async () => {
    const url = new URL('http://localhost/api/quotes/simulate');
    url.searchParams.set('sellToken', 'ERROR_TOKEN');
    url.searchParams.set('buyToken', 'USDC');
    url.searchParams.set('amountIn', '1000000000');

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Router service unavailable');
  });

  it('returns 400 when required parameters are missing', async () => {
    const url = new URL('http://localhost/api/quotes/simulate');
    // Missing required parameters

    const request = new NextRequest(url);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid parameters');
  });
});

describe('TradeQueueCard Integration', () => {
  it('displays failed message when swap fails with HTTP 500', async () => {
    // Mock a failed transaction
    server.use(
      http.get('https://horizon-testnet.stellar.org/transactions/:hash', () => {
        return HttpResponse.json(
          { error: 'Transaction failed' },
          { status: 500 }
        );
      })
    );

    // Mock the trade queue with a failed swap
    const mockFailedSwap = {
      id: 'test-swap-1',
      from: 'XLM',
      to: 'USDC',
      amount: 100,
      timestamp: Date.now(),
      status: 'failed' as const
    };

    // Mock the store to return our failed swap
    const originalUseTradeQueueStore = require('../components/TradeQueueCard').useTradeQueueStore;
    const mockStore = {
      swaps: [mockFailedSwap],
      isExecuting: false,
      removeSwap: vi.fn(),
      clearSwaps: vi.fn(),
    };

    // Temporarily replace the store
    vi.doMock('../components/TradeQueueCard', () => ({
      ...require('../components/TradeQueueCard'),
      useTradeQueueStore: () => mockStore
    }));

    render(<TradeQueueCard />);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});