'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TierLevel = 'free' | 'pro' | 'elite';

export interface TierFeatures {
  maxConcurrentSwaps: number;
  dailyVolumeLimit: number; // in USD
  advancedCharts: boolean;
  priorityExecution: boolean;
  apiAccess: boolean;
  customAlerts: boolean;
  taxReporting: boolean;
}

interface SubscriptionState {
  tier: TierLevel;
  isKycVerified: boolean;
  features: TierFeatures;
  
  // Actions
  setTier: (tier: TierLevel) => void;
  setKycStatus: (verified: boolean) => void;
  canAddSwap: (currentQueueSize: number) => boolean;
  upgrade: (newTier: TierLevel) => void;
  getTierFeatures: (tier: TierLevel) => TierFeatures;
  resetToFree: () => void;
}

// Tier configuration
const TIER_CONFIG: Record<TierLevel, TierFeatures> = {
  free: {
    maxConcurrentSwaps: 2,
    dailyVolumeLimit: 1000,
    advancedCharts: false,
    priorityExecution: false,
    apiAccess: false,
    customAlerts: false,
    taxReporting: false,
  },
  pro: {
    maxConcurrentSwaps: 4,
    dailyVolumeLimit: 10000,
    advancedCharts: true,
    priorityExecution: false,
    apiAccess: true,
    customAlerts: true,
    taxReporting: false,
  },
  elite: {
    maxConcurrentSwaps: 8,
    dailyVolumeLimit: 100000,
    advancedCharts: true,
    priorityExecution: true,
    apiAccess: true,
    customAlerts: true,
    taxReporting: true,
  },
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      isKycVerified: false,
      features: TIER_CONFIG.free,
      
      setTier: (tier) => {
        const features = TIER_CONFIG[tier];
        set({ tier, features });
      },
      
      setKycStatus: (verified) => {
        set({ isKycVerified: verified });
        
        // If KYC is verified and user is elite, ensure they have full access
        if (verified && get().tier === 'elite') {
          set({ features: { ...TIER_CONFIG.elite } });
        }
      },
      
      canAddSwap: (currentQueueSize) => {
        const { features, tier, isKycVerified } = get();
        
        // Elite tier requires KYC verification
        if (tier === 'elite' && !isKycVerified) {
          return currentQueueSize < TIER_CONFIG.pro.maxConcurrentSwaps; // Downgrade to Pro limits
        }
        
        return currentQueueSize < features.maxConcurrentSwaps;
      },
      
      upgrade: (newTier) => {
        const features = TIER_CONFIG[newTier];
        set({ tier: newTier, features });
        
        // Emit event for other components to react
        window.dispatchEvent(new CustomEvent('tierUpgrade', { 
          detail: { tier: newTier, features } 
        }));
      },
      
      getTierFeatures: (tier) => {
        return TIER_CONFIG[tier];
      },
      
      resetToFree: () => {
        set({ 
          tier: 'free', 
          isKycVerified: false, 
          features: TIER_CONFIG.free 
        });
      },
    }),
    {
      name: 'subscription-storage',
      // Only persist tier and KYC status, derive features on load
      partialize: (state) => ({ 
        tier: state.tier, 
        isKycVerified: state.isKycVerified 
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, ensure features match the stored tier
        if (state) {
          state.features = TIER_CONFIG[state.tier];
        }
      },
    }
  )
);

// Helper hook for tier comparison
export function useSubscriptionTier() {
  const { tier, features, isKycVerified } = useSubscriptionStore();
  
  const isFreeTier = tier === 'free';
  const isProTier = tier === 'pro';
  const isEliteTier = tier === 'elite' && isKycVerified;
  
  const canUpgrade = tier !== 'elite' || !isKycVerified;
  
  return {
    tier,
    features,
    isKycVerified,
    isFreeTier,
    isProTier,
    isEliteTier,
    canUpgrade,
  };
}

// Helper to get tier display info
export function getTierDisplayInfo(tier: TierLevel) {
  const displays = {
    free: {
      name: 'Free',
      badge: '🆓',
      color: 'bg-gray-500',
      textColor: 'text-gray-100',
      description: 'Basic trading features',
    },
    pro: {
      name: 'Pro',
      badge: '⭐',
      color: 'bg-blue-600',
      textColor: 'text-blue-100',
      description: 'Advanced features & higher limits',
    },
    elite: {
      name: 'Elite',
      badge: '👑',
      color: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      textColor: 'text-yellow-100',
      description: 'Unlimited access with KYC',
    },
  };
  
  return displays[tier];
}