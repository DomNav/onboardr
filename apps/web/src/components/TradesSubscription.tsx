'use client';

import { useTradeSubscription } from '@/hooks/useTradeSubscription';

/**
 * This component manages the SSE connection for trade updates.
 * It doesn't render anything but ensures the trade subscription is active
 * whenever the app is running.
 */
export default function TradesSubscription() {
  useTradeSubscription();
  return null;
}