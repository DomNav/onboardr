import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';

// Error boundary component for testing
function TestErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" data-testid="error-boundary">
      <h2>Something went wrong:</h2>
      <pre data-testid="error-message">{error.message}</pre>
      <button onClick={resetErrorBoundary} data-testid="retry-button">
        Try again
      </button>
    </div>
  );
}

function handleError(error: Error, errorInfo: any) {
  console.error('Error caught by boundary:', error, errorInfo);
  
  // In a real app, you might send this to an error reporting service
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'exception', {
      description: error.message,
      fatal: false,
    });
  }
}

// Test components that throw errors
function ThrowingComponent({ shouldThrow = true, errorMessage = 'Test error' }: { 
  shouldThrow?: boolean; 
  errorMessage?: string;
}) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="working-component">Component working</div>;
}

function AsyncThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => setHasError(true), 100);
    }
  }, [shouldThrow]);

  if (hasError) {
    throw new Error('Async error occurred');
  }

  return <div data-testid="async-component">Async component loaded</div>;
}

function NetworkErrorComponent({ shouldFail = true }: { shouldFail?: boolean }) {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (shouldFail) {
          throw new Error('Network request failed');
        }
        setData({ message: 'Data loaded successfully' });
      } catch (err) {
        setError(err as Error);
      }
    };

    fetchData();
  }, [shouldFail]);

  if (error) throw error;

  return (
    <div data-testid="network-component">
      {data ? data.message : 'Loading...'}
    </div>
  );
}

describe('Error Boundary Testing', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Basic Error Handling', () => {
    it('catches and displays synchronous errors', () => {
      render(
        <TestErrorBoundary>
          <ThrowingComponent errorMessage="Sync error test" />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Sync error test');
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('allows components to work normally when no error occurs', () => {
      render(
        <TestErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('provides retry functionality', () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <TestErrorBoundary>
          <ThrowingComponent errorMessage="Retry test error" />
        </TestErrorBoundary>
      );

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Async Error Handling', () => {
    it('catches errors from useEffect and async operations', async () => {
      render(
        <TestErrorBoundary>
          <AsyncThrowingComponent />
        </TestErrorBoundary>
      );

      // Initially should show the component
      expect(screen.getByTestId('async-component')).toBeInTheDocument();

      // Wait for async error to occur
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should now show error boundary
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Async error occurred');
    });

    it('handles network errors appropriately', () => {
      render(
        <TestErrorBoundary>
          <NetworkErrorComponent shouldFail={true} />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Network request failed');
    });
  });

  describe('Complex Error Scenarios', () => {
    it('handles multiple nested components with errors', () => {
      function NestedComponents() {
        return (
          <div>
            <div>
              <ThrowingComponent errorMessage="Nested component error" />
            </div>
          </div>
        );
      }

      render(
        <TestErrorBoundary>
          <NestedComponents />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Nested component error');
    });

    it('isolates errors within boundary scope', () => {
      function MultipleComponents() {
        return (
          <div>
            <TestErrorBoundary>
              <ThrowingComponent errorMessage="First error" />
            </TestErrorBoundary>
            <div data-testid="sibling-component">Sibling component</div>
          </div>
        );
      }

      render(<MultipleComponents />);

      // Error boundary should catch the error
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('First error');
      
      // Sibling component should still render
      expect(screen.getByTestId('sibling-component')).toBeInTheDocument();
    });
  });

  describe('Error Reporting and Logging', () => {
    it('calls error handler with correct parameters', () => {
      const mockErrorHandler = vi.fn();
      
      function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
        return (
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={mockErrorHandler}
          >
            {children}
          </ErrorBoundary>
        );
      }

      render(
        <CustomErrorBoundary>
          <ThrowingComponent errorMessage="Logging test error" />
        </CustomErrorBoundary>
      );

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logging test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('integrates with analytics when available', () => {
      const mockGtag = vi.fn();
      (window as any).gtag = mockGtag;

      render(
        <TestErrorBoundary>
          <ThrowingComponent errorMessage="Analytics test error" />
        </TestErrorBoundary>
      );

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: 'Analytics test error',
        fatal: false,
      });

      // Clean up
      delete (window as any).gtag;
    });
  });

  describe('Error Recovery Strategies', () => {
    it('supports automatic retry after timeout', async () => {
      let attemptCount = 0;
      
      function RetryingComponent() {
        attemptCount++;
        
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        
        return <div data-testid="success-component">Success after retries</div>;
      }

      function AutoRetryBoundary({ children }: { children: React.ReactNode }) {
        const [key, setKey] = React.useState(0);
        
        return (
          <ErrorBoundary
            key={key}
            FallbackComponent={({ resetErrorBoundary }) => (
              <div data-testid="auto-retry-fallback">
                <button 
                  onClick={() => {
                    setKey(k => k + 1);
                    resetErrorBoundary();
                  }}
                  data-testid="auto-retry-button"
                >
                  Auto Retry
                </button>
              </div>
            )}
          >
            {children}
          </ErrorBoundary>
        );
      }

      render(
        <AutoRetryBoundary>
          <RetryingComponent />
        </AutoRetryBoundary>
      );

      expect(screen.getByTestId('auto-retry-fallback')).toBeInTheDocument();

      // Retry twice
      fireEvent.click(screen.getByTestId('auto-retry-button'));
      fireEvent.click(screen.getByTestId('auto-retry-button'));

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
      expect(attemptCount).toBe(3);
    });

    it('provides graceful degradation for partial failures', () => {
      function PartiallyFailingComponent({ shouldFailPartially = true }: { shouldFailPartially?: boolean }) {
        return (
          <div>
            <div data-testid="working-section">This section works</div>
            <ErrorBoundary
              FallbackComponent={() => (
                <div data-testid="failed-section-fallback">
                  This section failed, but here&apos;s a fallback
                </div>
              )}
            >
              {shouldFailPartially && <ThrowingComponent errorMessage="Partial failure" />}
            </ErrorBoundary>
          </div>
        );
      }

      render(<PartiallyFailingComponent />);

      expect(screen.getByTestId('working-section')).toBeInTheDocument();
      expect(screen.getByTestId('failed-section-fallback')).toBeInTheDocument();
    });
  });

  describe('Production Error Handling', () => {
    it('sanitizes sensitive information from error messages', () => {
      function SensitiveDataComponent() {
        const sensitiveData = 'secret-api-key-12345';
        throw new Error(`Failed to process data: ${sensitiveData}`);
      }

      function SanitizingErrorBoundary({ children }: { children: React.ReactNode }) {
        return (
          <ErrorBoundary
            FallbackComponent={({ error }) => {
              // Sanitize error message in production
              const sanitizedMessage = error.message.replace(/secret-api-key-\w+/g, '[REDACTED]');
              
              return (
                <div data-testid="sanitized-error">
                  <div data-testid="sanitized-message">{sanitizedMessage}</div>
                </div>
              );
            }}
          >
            {children}
          </ErrorBoundary>
        );
      }

      render(
        <SanitizingErrorBoundary>
          <SensitiveDataComponent />
        </SanitizingErrorBoundary>
      );

      expect(screen.getByTestId('sanitized-message')).toHaveTextContent('Failed to process data: [REDACTED]');
      expect(screen.getByTestId('sanitized-message')).not.toHaveTextContent('secret-api-key-12345');
    });

    it('provides user-friendly error messages', () => {
      function TechnicalErrorComponent() {
        throw new Error('TypeError: Cannot read property "foo" of undefined at line 42');
      }

      function UserFriendlyErrorBoundary({ children }: { children: React.ReactNode }) {
        return (
          <ErrorBoundary
            FallbackComponent={({ error }) => {
              const userFriendlyMessage = 'Something went wrong. Please try again or contact support.';
              
              return (
                <div data-testid="user-friendly-error">
                  <div data-testid="user-message">{userFriendlyMessage}</div>
                  <details>
                    <summary>Technical details</summary>
                    <div data-testid="technical-details">{error.message}</div>
                  </details>
                </div>
              );
            }}
          >
            {children}
          </ErrorBoundary>
        );
      }

      render(
        <UserFriendlyErrorBoundary>
          <TechnicalErrorComponent />
        </UserFriendlyErrorBoundary>
      );

      expect(screen.getByTestId('user-message')).toHaveTextContent('Something went wrong. Please try again or contact support.');
      expect(screen.getByTestId('technical-details')).toHaveTextContent('TypeError: Cannot read property "foo" of undefined at line 42');
    });
  });
});