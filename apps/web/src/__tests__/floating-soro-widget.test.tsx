import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingSoroButton } from '@/components/FloatingSoroButton';
import { SoroSlideOver } from '@/components/SoroSlideOver';
import { WalletProvider } from '@/contexts/WalletContext';
import { TradeSimulationProvider } from '@/contexts/TradeSimulationContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the complex components
jest.mock('@/components/SoroChatPanel', () => {
  return function MockSoroChatPanel({ onTradeQuote, inputRef }: any) {
    return (
      <div data-testid="soro-chat-panel">
        <input ref={inputRef} data-testid="chat-input" placeholder="Chat with Soro..." />
        <button 
          onClick={() => onTradeQuote?.({ from: 'XLM', to: 'USDC', amount: 100 })}
          data-testid="mock-trade-button"
        >
          Mock Trade
        </button>
      </div>
    );
  };
});

jest.mock('@/components/TradeQueueCard', () => {
  return function MockTradeQueueCard() {
    return <div data-testid="trade-queue-card">Trade Queue</div>;
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>
    <CurrencyProvider>
      <TradeSimulationProvider>
        {children}
      </TradeSimulationProvider>
    </CurrencyProvider>
  </WalletProvider>
);

describe('Floating Soro Widget', () => {
  describe('FloatingSoroButton', () => {
    it('renders the floating button with correct accessibility attributes', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <FloatingSoroButton onClick={mockOnClick} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /open soro trading panel/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Open Soro trading panel');
    });

    it('calls onClick when button is clicked', () => {
      const mockOnClick = jest.fn();
      render(
        <TestWrapper>
          <FloatingSoroButton onClick={mockOnClick} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /open soro trading panel/i });
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('shows tooltip on hover', async () => {
      render(
        <TestWrapper>
          <FloatingSoroButton onClick={() => {}} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /open soro trading panel/i });
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Trade with Soro')).toBeInTheDocument();
      });
    });
  });

  describe('SoroSlideOver', () => {
    it('renders the slide-over when open', () => {
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Soro')).toBeInTheDocument();
      expect(screen.getByText('AI Trading Assistant')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={false} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close soro panel/i });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders SoroChatPanel inside the slide-over', () => {
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByTestId('soro-chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });

    it('handles trade quotes from SoroChatPanel', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      const mockTradeButton = screen.getByTestId('mock-trade-button');
      fireEvent.click(mockTradeButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Trade quote received in slide-over:',
        { from: 'XLM', to: 'USDC', amount: 100 }
      );

      consoleSpy.mockRestore();
    });

    it('shows quick commands information', () => {
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText('Quick commands:')).toBeInTheDocument();
      expect(screen.getByText('swap 100 xlm for usdc')).toBeInTheDocument();
      expect(screen.getByText('help')).toBeInTheDocument();
    });

    it('shows connection status when wallet is not connected', () => {
      render(
        <TestWrapper>
          <SoroSlideOver isOpen={true} onClose={() => {}} />
        </TestWrapper>
      );

      expect(screen.getByText('Connect your wallet to start trading')).toBeInTheDocument();
    });
  });
});