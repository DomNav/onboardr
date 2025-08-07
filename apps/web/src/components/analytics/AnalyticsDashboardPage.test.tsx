import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboardPage } from './AnalyticsDashboardPage';
import { useDashboardData } from '@/hooks/useDashboardData';

// Mock the hooks
jest.mock('@/hooks/useDashboardData');
jest.mock('@/hooks/useAnalyticsPerformance', () => ({
  useAnalyticsPerformance: () => ({
    trackApiStart: jest.fn(),
    trackApiEnd: jest.fn(),
    trackChartRenderStart: jest.fn(),
    trackChartRenderEnd: jest.fn(),
    getCachedData: jest.fn(),
    getPerformanceMetrics: jest.fn(),
  })
}));

// Mock Recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Legend: () => <div />,
}));

const mockUseDashboardData = useDashboardData as jest.MockedFunction<typeof useDashboardData>;

const mockSWRData = {
  volumeChart: [
    { time: '00:00', value: 100 },
    { time: '01:00', value: 150 },
  ],
  tvlChart: [
    { time: '00:00', value: 1000 },
    { time: '01:00', value: 1200 },
  ],
  feesChart: [
    { time: '00:00', value: 10 },
    { time: '01:00', value: 15 },
  ],
  tokenPrices: [
    {
      symbol: 'XLM',
      name: 'Stellar Lumens',
      price: 0.12,
      change24h: 5.2,
      change7d: -2.1,
      volume24h: 1000000,
      marketCap: 3000000000,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      price: 1.0,
      change24h: 0.1,
      change7d: 0.05,
      volume24h: 500000,
      marketCap: 25000000000,
    },
  ],
  pairVolumes: [
    {
      pair: 'XLM/USDC',
      volume: 1000000,
      percentage: 60,
      color: '#00d4ff',
    },
    {
      pair: 'yXLM/XLM',
      volume: 666666,
      percentage: 40,
      color: '#7c3aed',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

describe('AnalyticsDashboardPage', () => {
  beforeEach(() => {
    mockUseDashboardData.mockReturnValue({
      data: mockSWRData,
      isLoading: false,
      error: undefined,
      mutate: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render analytics dashboard page', () => {
      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render timeframe switcher buttons', () => {
      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByText('24h')).toBeInTheDocument();
      expect(screen.getByText('7d')).toBeInTheDocument();
      expect(screen.getByText('30d')).toBeInTheDocument();
    });

    it('should render metric tabs', () => {
      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('TVL')).toBeInTheDocument();
      expect(screen.getByText('Fees')).toBeInTheDocument();
    });

    it('should render summary cards with mock data', async () => {
      render(<AnalyticsDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Volume Analytics (24h)')).toBeInTheDocument();
      });
    });

    it('should render token price table', async () => {
      render(<AnalyticsDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Token Prices')).toBeInTheDocument();
        expect(screen.getByText('XLM')).toBeInTheDocument();
        expect(screen.getByText('USDC')).toBeInTheDocument();
        expect(screen.getByText('Stellar Lumens')).toBeInTheDocument();
      });
    });

    it('should render pair volume pie chart', async () => {
      render(<AnalyticsDashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Volume Distribution')).toBeInTheDocument();
        expect(screen.getByText('XLM/USDC')).toBeInTheDocument();
        expect(screen.getByText('yXLM/XLM')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('should switch timeframes when clicking buttons', async () => {
      render(<AnalyticsDashboardPage />);
      
      const sevenDayButton = screen.getByLabelText('Select 7d time frame');
      fireEvent.click(sevenDayButton);
      
      await waitFor(() => {
        expect(mockUseDashboardData).toHaveBeenCalledWith('7d');
      });
    });

    it('should switch metrics when clicking tabs', async () => {
      render(<AnalyticsDashboardPage />);
      
      const tvlButton = screen.getByLabelText('Select TVL metric');
      fireEvent.click(tvlButton);
      
      await waitFor(() => {
        expect(screen.getByText('TVL Analytics (24h)')).toBeInTheDocument();
      });
    });

    it('should show different analytics for different metrics', async () => {
      render(<AnalyticsDashboardPage />);
      
      // Initially shows Volume
      expect(screen.getByText('Volume Analytics (24h)')).toBeInTheDocument();
      
      // Click TVL
      const tvlButton = screen.getByLabelText('Select TVL metric');
      fireEvent.click(tvlButton);
      
      await waitFor(() => {
        expect(screen.getByText('TVL Analytics (24h)')).toBeInTheDocument();
      });
      
      // Click Fees
      const feesButton = screen.getByLabelText('Select Fees metric');
      fireEvent.click(feesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Fees Analytics (24h)')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      mockUseDashboardData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByText('Loading chart...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state when error occurs', () => {
      const mockError = new Error('Network error');
      mockUseDashboardData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        mutate: jest.fn(),
      });

      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection.')).toBeInTheDocument();
    });

    it('should call mutate when retry button is clicked', () => {
      const mockMutate = jest.fn();
      const mockError = new Error('Network error');
      
      mockUseDashboardData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        mutate: mockMutate,
      });

      render(<AnalyticsDashboardPage />);
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AnalyticsDashboardPage />);
      
      expect(screen.getByLabelText('Select 24h time frame')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Volume metric')).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<AnalyticsDashboardPage />);
      
      const mainHeading = screen.getByRole('heading', { name: 'Analytics Dashboard' });
      expect(mainHeading).toBeInTheDocument();
    });
  });
});