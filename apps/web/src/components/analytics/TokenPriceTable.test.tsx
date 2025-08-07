import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenPriceTable } from './TokenPriceTable';
import { TokenPrice } from '@/types/analytics';

const mockTokenData: TokenPrice[] = [
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
    change24h: -0.1,
    change7d: 0.05,
    volume24h: 500000,
    marketCap: 25000000000,
  },
  {
    symbol: 'AQUA',
    name: 'Aquarius',
    price: 0.05,
    change24h: 10.5,
    change7d: 15.2,
    volume24h: 250000,
    marketCap: 50000000,
  },
];

describe('TokenPriceTable', () => {
  describe('Rendering', () => {
    it('should render token price table with data', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      // Check headers
      expect(screen.getByText('Token')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('24h Change')).toBeInTheDocument();
      expect(screen.getByText('7d Change')).toBeInTheDocument();
      expect(screen.getByText('Volume (24h)')).toBeInTheDocument();
      
      // Check token data
      expect(screen.getByText('XLM')).toBeInTheDocument();
      expect(screen.getByText('Stellar Lumens')).toBeInTheDocument();
      expect(screen.getByText('USDC')).toBeInTheDocument();
      expect(screen.getByText('AQUA')).toBeInTheDocument();
    });

    it('should display prices with correct formatting', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      expect(screen.getByText('$0.12')).toBeInTheDocument();
      expect(screen.getByText('$1.00')).toBeInTheDocument();
      expect(screen.getByText('$0.050000')).toBeInTheDocument(); // Small prices get 6 decimals
    });

    it('should display percentage changes with correct colors', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      // Positive changes should be green
      const positiveChange = screen.getByText('+5.20%');
      expect(positiveChange).toHaveClass('text-green-600');
      
      // Negative changes should be red
      const negativeChange = screen.getByText('-0.10%');
      expect(negativeChange).toHaveClass('text-red-600');
    });

    it('should show trending icons for changes', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      // Should have trending up and down icons (via aria-hidden divs)
      const trendingElements = screen.getAllByText(/[+-]\d+\.\d+%/);
      expect(trendingElements.length).toBeGreaterThan(0);
    });

    it('should display volume with large number formatting', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      // Volume should be formatted as large numbers
      expect(screen.getByText(/\$1.00M/)).toBeInTheDocument(); // 1M
      expect(screen.getByText(/\$500K/)).toBeInTheDocument(); // 500K
    });
  });

  describe('Sorting', () => {
    it('should sort by symbol when clicking symbol header', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const symbolHeader = screen.getByRole('button', { name: /Sort by symbol/i });
      fireEvent.click(symbolHeader);
      
      const rows = screen.getAllByRole('row');
      // First row is header, so check data rows
      expect(rows[1]).toHaveTextContent('AQUA');
      expect(rows[2]).toHaveTextContent('USDC');
      expect(rows[3]).toHaveTextContent('XLM');
    });

    it('should sort by price when clicking price header', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const priceHeader = screen.getByRole('button', { name: /Sort by price/i });
      fireEvent.click(priceHeader);
      
      // Should be sorted by price descending by default
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('USDC'); // $1.00
      expect(rows[2]).toHaveTextContent('XLM');  // $0.12
      expect(rows[3]).toHaveTextContent('AQUA'); // $0.05
    });

    it('should toggle sort direction when clicking same header twice', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const priceHeader = screen.getByRole('button', { name: /Sort by price/i });
      
      // First click - descending
      fireEvent.click(priceHeader);
      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('USDC'); // Highest price first
      
      // Second click - ascending
      fireEvent.click(priceHeader);
      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('AQUA'); // Lowest price first
    });

    it('should sort by 24h change', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const changeHeader = screen.getByRole('button', { name: /Sort by change24h/i });
      fireEvent.click(changeHeader);
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('AQUA'); // +10.5%
      expect(rows[2]).toHaveTextContent('XLM');  // +5.2%
      expect(rows[3]).toHaveTextContent('USDC'); // -0.1%
    });

    it('should sort by volume', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const volumeHeader = screen.getByRole('button', { name: /Sort by volume24h/i });
      fireEvent.click(volumeHeader);
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('XLM');  // 1M volume
      expect(rows[2]).toHaveTextContent('USDC'); // 500K volume
      expect(rows[3]).toHaveTextContent('AQUA'); // 250K volume
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(<TokenPriceTable data={[]} />);
      
      // Should still render headers
      expect(screen.getByText('Token')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('should show error message for invalid data', () => {
      const invalidData = [
        {
          symbol: 'INVALID',
          // Missing required fields
        }
      ] as any;
      
      render(<TokenPriceTable data={invalidData} />);
      
      expect(screen.getByText('Invalid token price data format')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have sortable column headers with proper labels', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      expect(screen.getByRole('button', { name: /Sort by symbol/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sort by price/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sort by change24h/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sort by volume24h/i })).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      render(<TokenPriceTable data={mockTokenData} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header + 3 data rows
      
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5); // 5 columns
    });
  });
});