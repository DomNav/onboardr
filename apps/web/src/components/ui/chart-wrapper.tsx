'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { chartErrorMessages, ChartErrorProps } from '@/lib/chartValidation';
import { AlertCircle } from 'lucide-react';

interface ChartWrapperProps extends ChartErrorProps {
  isLoading?: boolean;
  hasError?: boolean;
  hasData?: boolean;
  children: React.ReactNode;
  height?: string;
}

/**
 * Wrapper component for charts that handles loading, error, and empty states
 * Ensures consistent UX across all chart components
 */
export function ChartWrapper({
  isLoading = false,
  hasError = false,
  hasData = true,
  error,
  emptyMessage,
  className,
  height = 'h-64',
  children
}: ChartWrapperProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', height, className)}>
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2', height, className)}>
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <div className="text-muted-foreground text-center">
          <p className="mb-1">{error || chartErrorMessages.loadError}</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!hasData) {
    return (
      <div className={cn('flex items-center justify-center', height, className)}>
        <div className="text-muted-foreground">
          {emptyMessage || chartErrorMessages.noData}
        </div>
      </div>
    );
  }

  // Render chart
  return <>{children}</>;
}

/**
 * Chart container with consistent styling
 */
export function ChartContainer({
  children,
  className,
  title
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      )}
      <div className="bg-card rounded-lg border p-4">
        {children}
      </div>
    </div>
  );
}