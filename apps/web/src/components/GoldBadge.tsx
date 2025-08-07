'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 'premium' | 'trending' | 'verified';

interface GoldBadgeProps {
  type?: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GoldBadge({ 
  type = 'premium',
  size = 'sm',
  className 
}: GoldBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badges = {
    premium: {
      icon: Crown,
      label: 'Premium',
      className: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0'
    },
    trending: {
      icon: TrendingUp,
      label: 'Trending',
      className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
    },
    verified: {
      icon: Shield,
      label: 'Verified',
      className: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0'
    }
  };

  const { icon: Icon, label, className: badgeClassName } = badges[type];

  return (
    <Badge 
      className={cn(
        sizeClasses[size],
        badgeClassName,
        'flex items-center gap-1 font-medium shadow-sm',
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{label}</span>
    </Badge>
  );
}