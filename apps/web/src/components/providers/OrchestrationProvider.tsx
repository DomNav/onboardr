/**
 * Orchestration Provider
 * Automatically starts orchestration when app loads
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const [isStarted, setIsStarted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only start orchestration once
    if (isStarted) return;

    // Check if orchestration is enabled
    if (process.env.NEXT_PUBLIC_ORCHESTRATION_ENABLED !== 'true') {
      console.log('Orchestration disabled via environment variable');
      return;
    }

    const startOrchestration = async () => {
      try {
        console.log('🚀 Starting orchestration system...');
        
        // Call the start API
        const response = await fetch('/api/orchestration/start');
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Orchestration started successfully:', data.status);
          setIsStarted(true);
          setStatus(data.status);
          
          // Start polling for status updates
          startStatusPolling();
        } else {
          console.error('❌ Failed to start orchestration:', data.error);
        }
      } catch (error) {
        console.error('❌ Error starting orchestration:', error);
      }
    };

    // Start orchestration after a short delay
    const timer = setTimeout(startOrchestration, 2000);
    
    return () => clearTimeout(timer);
  }, [isStarted]);

  const startStatusPolling = () => {
    const pollStatus = async () => {
      try {
        const response = await fetch('/api/orchestration/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error fetching orchestration status:', error);
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollStatus, 30000);
    
    // Cleanup on unmount
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => clearInterval(interval));
    }
  };

  // Optional: Show orchestration status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && status) {
      console.log('📊 Orchestration Status:', {
        running: status.running,
        agents: status.agents?.length || 0,
        activeAgents: status.activeAgents || 0
      });
    }
  }, [status]);

  return <>{children}</>;
}