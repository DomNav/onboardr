import { useEffect, useRef } from 'react';
import { TimeFrame } from '@/types/analytics';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  chartRenderTime: number;
  totalInteractionTime: number;
}

interface PerformanceCacheEntry {
  timeFrame: TimeFrame;
  data: any;
  timestamp: number;
  metrics: PerformanceMetrics;
}

// Simple in-memory cache for successful fetches (AI Agent Standards)
const performanceCache = new Map<string, PerformanceCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAnalyticsPerformance(timeFrame: TimeFrame) {
  const startTimeRef = useRef<number>(Date.now());
  const apiStartTimeRef = useRef<number>(0);
  const chartStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Track page load time
    startTimeRef.current = Date.now();
    
    // Performance observer for monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.startTime;
            
            // Track token usage and page load time (AI Agent Standards)
            if (loadTime > 3000) {
              console.warn('Slow page load detected', {
                loadTime,
                timeFrame,
                contextId: 'analytics-performance'
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      
      return () => observer.disconnect();
    }
    
    // Return undefined when PerformanceObserver is not available
    return undefined;
  }, [timeFrame]);

  const trackApiStart = () => {
    apiStartTimeRef.current = Date.now();
  };

  const trackApiEnd = (success: boolean, data?: any) => {
    const apiTime = Date.now() - apiStartTimeRef.current;
    
    // Cache successful fetches of identical timeframe data
    if (success && data) {
      const cacheKey = `analytics-${timeFrame}`;
      const cacheEntry: PerformanceCacheEntry = {
        timeFrame,
        data,
        timestamp: Date.now(),
        metrics: {
          pageLoadTime: Date.now() - startTimeRef.current,
          apiResponseTime: apiTime,
          chartRenderTime: 0, // Will be updated by chart components
          totalInteractionTime: Date.now() - startTimeRef.current
        }
      };
      
      performanceCache.set(cacheKey, cacheEntry);
      
      // Clean up old cache entries
      for (const [key, entry] of performanceCache.entries()) {
        if (Date.now() - entry.timestamp > CACHE_TTL) {
          performanceCache.delete(key);
        }
      }
    }

    // Log slow API responses
    if (apiTime > 1000) {
      console.warn('Slow API response', {
        responseTime: apiTime,
        timeFrame,
        contextId: 'analytics-api-performance'
      });
    }
  };

  const trackChartRenderStart = () => {
    chartStartTimeRef.current = Date.now();
  };

  const trackChartRenderEnd = () => {
    const renderTime = Date.now() - chartStartTimeRef.current;
    
    if (renderTime > 500) {
      console.warn('Slow chart render', {
        renderTime,
        timeFrame,
        contextId: 'analytics-chart-performance'
      });
    }
  };

  const getCachedData = (requestedTimeFrame: TimeFrame) => {
    const cacheKey = `analytics-${requestedTimeFrame}`;
    const cached = performanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    return null;
  };

  const getPerformanceMetrics = (): PerformanceMetrics | null => {
    const cacheKey = `analytics-${timeFrame}`;
    const cached = performanceCache.get(cacheKey);
    
    return cached?.metrics || null;
  };

  return {
    trackApiStart,
    trackApiEnd,
    trackChartRenderStart,
    trackChartRenderEnd,
    getCachedData,
    getPerformanceMetrics,
  };
}