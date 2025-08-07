import React from 'react';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataAlertProps {
  type: 'info' | 'error' | 'warning';
  title: string;
  children: React.ReactNode;
  className?: string;
}

const alertConfig = {
  info: {
    variant: 'default' as const,
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  },
  error: {
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  },
  warning: {
    variant: 'default' as const,
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  },
};

export function DataAlert({ type, title, children, className }: DataAlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <Alert 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}