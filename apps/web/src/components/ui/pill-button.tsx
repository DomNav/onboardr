import React from 'react';
import { cn } from '@/lib/utils';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  active = false,
  children,
  className,
  ...props
}) => {
  return (
    <button
      {...props}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
        active 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
};

interface PillContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PillContainer: React.FC<PillContainerProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      {children}
    </div>
  );
};