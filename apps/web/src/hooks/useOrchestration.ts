/**
 * Orchestration Hook
 * Connects components to the orchestration system
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OrchestrationData {
  metrics?: {
    tvl: number;
    volume24h: number;
    timestamp: number;
  };
  pools?: any[];
  vaults?: any[];
  tokens?: any[];
  topPairs?: any[];
}

interface OrchestrationStatus {
  connected: boolean;
  agents: Map<string, any>;
  activeAgents: number;
  lastUpdate: Date | null;
}

interface UseOrchestrationReturn {
  preloadedData: OrchestrationData | null;
  isConnected: boolean;
  status: OrchestrationStatus;
  refreshData: (agentId?: string) => Promise<void>;
  subscribe: (topic: string, callback: (data: any) => void) => () => void;
  executeAgent: (agentId: string, params?: any) => Promise<any>;
}

export function useOrchestration(): UseOrchestrationReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<OrchestrationStatus>({
    connected: false,
    agents: new Map(),
    activeAgents: 0,
    lastUpdate: null,
  });
  
  const queryClient = useQueryClient();
  const subscribers = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  // Fetch initial data from API
  const { data: preloadedData, refetch } = useQuery({
    queryKey: ['orchestration', 'data'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/orchestration/data');
        if (!response.ok) throw new Error('Failed to fetch orchestration data');
        return response.json();
      } catch (error) {
        console.error('Failed to fetch orchestration data:', error);
        
        // Return mock data as fallback
        return {
          metrics: {
            tvl: 15750000,
            volume24h: 3250000,
            timestamp: Date.now(),
          },
          pools: [],
          vaults: [],
          tokens: [],
          topPairs: [],
        };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';
    
    const socketInstance = io(websocketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to orchestration WebSocket');
      setIsConnected(true);
      
      // Request initial data
      socketInstance.emit('request:initial');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from orchestration WebSocket');
      setIsConnected(false);
    });

    // Handle initial data
    socketInstance.on('initial:data', (data: OrchestrationData) => {
      queryClient.setQueryData(['orchestration', 'data'], data);
      setStatus(prev => ({ ...prev, lastUpdate: new Date() }));
    });

    // Handle real-time updates
    socketInstance.on('data:update', (update: Partial<OrchestrationData>) => {
      queryClient.setQueryData(['orchestration', 'data'], (old: any) => ({
        ...old,
        ...update,
      }));
      
      // Notify subscribers
      notifySubscribers('data:update', update);
    });

    // Handle agent status updates
    socketInstance.on('agent:status', (agentStatus: any) => {
      setStatus(prev => ({
        ...prev,
        agents: new Map(Object.entries(agentStatus.agents)),
        activeAgents: agentStatus.activeAgents,
      }));
    });

    // Handle agent success/error events
    socketInstance.on('agent:success', ({ agentId, data }) => {
      notifySubscribers(`agent:${agentId}:success`, data);
    });

    socketInstance.on('agent:error', ({ agentId, error }) => {
      console.error(`Agent ${agentId} error:`, error);
      notifySubscribers(`agent:${agentId}:error`, error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  // Notify subscribers
  const notifySubscribers = useCallback((topic: string, data: any) => {
    const topicSubscribers = subscribers.current.get(topic);
    if (topicSubscribers) {
      topicSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }, []);

  // Subscribe to updates
  const subscribe = useCallback((topic: string, callback: (data: any) => void) => {
    if (!subscribers.current.has(topic)) {
      subscribers.current.set(topic, new Set());
    }
    
    subscribers.current.get(topic)!.add(callback);
    
    // Send subscription request to server
    if (socket && isConnected) {
      socket.emit('subscribe', { topic });
    }
    
    // Return unsubscribe function
    return () => {
      const topicSubscribers = subscribers.current.get(topic);
      if (topicSubscribers) {
        topicSubscribers.delete(callback);
        
        // If no more subscribers for this topic, unsubscribe from server
        if (topicSubscribers.size === 0 && socket && isConnected) {
          socket.emit('unsubscribe', { topic });
          subscribers.current.delete(topic);
        }
      }
    };
  }, [socket, isConnected]);

  // Refresh data
  const refreshData = useCallback(async (agentId?: string) => {
    if (socket && isConnected) {
      socket.emit('request:refresh', { agentId });
    } else {
      // Fallback to API refetch
      await refetch();
    }
  }, [socket, isConnected, refetch]);

  // Execute specific agent
  const executeAgent = useCallback(async (agentId: string, params?: any) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error('Not connected to orchestration system'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Agent execution timeout'));
      }, 30000);

      // Set up one-time listener for response
      const responseHandler = (response: any) => {
        clearTimeout(timeout);
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      };

      socket.once(`agent:${agentId}:response`, responseHandler);
      
      // Send execution request
      socket.emit('execute:agent', { agentId, params });
    });
  }, [socket, isConnected]);

  return {
    preloadedData,
    isConnected,
    status,
    refreshData,
    subscribe,
    executeAgent,
  };
}

// Export for use in other components
export type { OrchestrationData, OrchestrationStatus };