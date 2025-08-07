import React from 'react';
import { generateAvatarConfig } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';

interface AvatarInitialProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallback?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg'
};

export function AvatarInitial({ 
  name, 
  size = 'md', 
  className,
  fallback = '?'
}: AvatarInitialProps) {
  const config = generateAvatarConfig(name || fallback);
  

  
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shadow-sm',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.bgColor }}
    >
      {config.initials}
    </div>
  );
} 