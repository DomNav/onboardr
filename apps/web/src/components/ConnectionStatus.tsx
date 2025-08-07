'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface HealthStatus {
  status: string;
  openai_configured: boolean;
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus({ status: 'error', openai_configured: false });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
        Checking connection...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <WifiOff className="w-3 h-3" />
        Connection failed
      </div>
    );
  }

  const isHealthy = status.status === 'ok' && status.openai_configured;

  return (
    <div className={`flex items-center gap-2 text-xs ${isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
      {isHealthy ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {isHealthy ? 'AI Connected' : 'Limited Mode'}
    </div>
  );
}