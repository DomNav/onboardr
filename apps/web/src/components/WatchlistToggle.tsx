'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WatchlistToggleProps {
  tokenId: string;
  tokenSymbol?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function WatchlistToggle({ 
  tokenId, 
  tokenSymbol,
  size = 'sm',
  showLabel = false,
  className
}: WatchlistToggleProps) {
  const { isWatched, toggleWatch, isLoading, error } = useWatchlist();
  const watched = isWatched(tokenId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleWatch(tokenId);
      
      if (!watched) {
        toast.success(`Added ${tokenSymbol || tokenId} to watchlist`);
      } else {
        toast.info(`Removed ${tokenSymbol || tokenId} from watchlist`);
      }
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (showLabel) {
    return (
      <Button
        variant={watched ? 'default' : 'outline'}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'gap-2',
          watched && 'bg-yellow-600 hover:bg-yellow-700',
          className
        )}
      >
        <Star 
          className={cn(
            iconSizes[size],
            watched && 'fill-current'
          )} 
        />
        {watched ? 'Watching' : 'Watch'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'rounded-full transition-all',
        watched && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star 
        className={cn(
          iconSizes[size],
          'transition-all',
          watched && 'fill-current'
        )} 
      />
    </Button>
  );
}