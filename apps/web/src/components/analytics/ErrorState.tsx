'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Wifi, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
  className?: string;
}

// Error categorization for better user experience
function categorizeError(error: Error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout') || message.includes('abort')) {
    return {
      type: 'timeout',
      icon: Wifi,
      title: 'Connection Timeout',
      description: 'The request took too long to complete. Please check your connection and try again.',
      severity: 'warning'
    };
  }
  
  if (message.includes('rate limit') || message.includes('429')) {
    return {
      type: 'ratelimit',
      icon: Shield,
      title: 'Too Many Requests',
      description: 'Please wait a moment before trying again.',
      severity: 'info'
    };
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return {
      type: 'network',
      icon: Wifi,
      title: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      severity: 'error'
    };
  }
  
  if (message.includes('server') || message.includes('500')) {
    return {
      type: 'server',
      icon: AlertCircle,
      title: 'Server Error',
      description: 'The server encountered an error. Please try again in a few minutes.',
      severity: 'error'
    };
  }
  
  // Generic error
  return {
    type: 'generic',
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    severity: 'error'
  };
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  className 
}) => {
  const errorInfo = categorizeError(error);
  const Icon = errorInfo.icon;
  
  const severityColors = {
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400'
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-4",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn("rounded-full p-3 bg-muted/20", severityColors[errorInfo.severity as keyof typeof severityColors])}>
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {errorInfo.title}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {errorInfo.description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onRetry} 
          variant="default"
          className="flex items-center gap-2"
          aria-label="Retry loading analytics data"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
        
        {errorInfo.type === 'network' && (
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            aria-label="Refresh the page"
          >
            Refresh Page
          </Button>
        )}
      </div>

      {/* Technical details (hidden by default, for debugging) */}
      <details className="mt-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          Technical Details
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-left overflow-auto max-w-md">
          {error.message}
        </pre>
      </details>
    </div>
  );
};