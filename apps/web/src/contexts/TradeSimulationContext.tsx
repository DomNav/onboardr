'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { TradeSimulation, SimQuote, TradeSimulationState, ParsedTradeHops } from '@/types/trade';

interface TradeSimulationContextType {
  state: TradeSimulationState;
  simulateTrade: (hops: ParsedTradeHops) => Promise<void>;
  confirmTrade: (simulationId: string) => void;
  rejectTrade: (simulationId: string) => void;
  clearSimulation: (simulationId: string) => void;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_SIMULATION'; payload: TradeSimulation | null }
  | { type: 'ADD_SIMULATION'; payload: TradeSimulation }
  | { type: 'UPDATE_SIMULATION'; payload: { id: string; updates: Partial<TradeSimulation> } }
  | { type: 'REMOVE_SIMULATION'; payload: string };

const initialState: TradeSimulationState = {
  simulations: [],
  currentSimulation: null,
  isLoading: false,
};

function tradeSimulationReducer(state: TradeSimulationState, action: Action): TradeSimulationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_CURRENT_SIMULATION':
      return { ...state, currentSimulation: action.payload };
    
    case 'ADD_SIMULATION':
      return {
        ...state,
        simulations: [...state.simulations, action.payload],
        currentSimulation: action.payload,
      };
    
    case 'UPDATE_SIMULATION':
      return {
        ...state,
        simulations: state.simulations.map(sim =>
          sim.id === action.payload.id ? { ...sim, ...action.payload.updates } : sim
        ),
        currentSimulation: state.currentSimulation?.id === action.payload.id
          ? { ...state.currentSimulation, ...action.payload.updates }
          : state.currentSimulation,
      };
    
    case 'REMOVE_SIMULATION':
      return {
        ...state,
        simulations: state.simulations.filter(sim => sim.id !== action.payload),
        currentSimulation: state.currentSimulation?.id === action.payload ? null : state.currentSimulation,
      };
    
    default:
      return state;
  }
}

const TradeSimulationContext = createContext<TradeSimulationContextType | undefined>(undefined);

export function TradeSimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tradeSimulationReducer, initialState);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const counterRef = useRef(0);

  // Generate deterministic IDs to avoid hydration mismatches
  const generateSimulationId = useCallback(() => {
    counterRef.current += 1;
    return `sim-${counterRef.current}`;
  }, []);

  const simulateTrade = useCallback(async (hops: ParsedTradeHops) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch('/api/quotes/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hops: hops.hops,
          amount: hops.amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch simulation');
      }

      const data = await response.json();
      
      const simulation: TradeSimulation = {
        id: generateSimulationId(),
        quotes: data.quotes,
        totalAmountIn: data.totalAmountIn,
        totalAmountOut: data.totalAmountOut,
        totalPriceImpact: data.totalPriceImpact,
        status: 'loading',
        timestamp: data.timestamp,
      };

      dispatch({ type: 'ADD_SIMULATION', payload: simulation });

      // Calculate total loading time (sum of all quote lifespans)
      const totalLoadTime = data.quotes.reduce((sum: number, quote: SimQuote) => 
        sum + (quote.estLifespanSec * 1000), 0
      );

      // Set timer to mark simulation as ready
      const timer = setTimeout(() => {
        dispatch({
          type: 'UPDATE_SIMULATION',
          payload: { id: simulation.id, updates: { status: 'ready' } }
        });
        timersRef.current.delete(simulation.id);
      }, totalLoadTime);

      timersRef.current.set(simulation.id, timer);

    } catch (error) {
      console.error('Trade simulation error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [generateSimulationId]);

  const confirmTrade = useCallback((simulationId: string) => {
    dispatch({
      type: 'UPDATE_SIMULATION',
      payload: { id: simulationId, updates: { status: 'confirmed' } }
    });
  }, []);

  const rejectTrade = useCallback((simulationId: string) => {
    dispatch({
      type: 'UPDATE_SIMULATION',
      payload: { id: simulationId, updates: { status: 'rejected' } }
    });
  }, []);

  const clearSimulation = useCallback((simulationId: string) => {
    // Clear any pending timers
    const timer = timersRef.current.get(simulationId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(simulationId);
    }
    
    dispatch({ type: 'REMOVE_SIMULATION', payload: simulationId });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      const timers = timersRef.current;
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value: TradeSimulationContextType = {
    state,
    simulateTrade,
    confirmTrade,
    rejectTrade,
    clearSimulation,
  };

  return (
    <TradeSimulationContext.Provider value={value}>
      {children}
    </TradeSimulationContext.Provider>
  );
}

export function useTradeSimulation() {
  const context = useContext(TradeSimulationContext);
  if (context === undefined) {
    throw new Error('useTradeSimulation must be used within a TradeSimulationProvider');
  }
  return context;
}