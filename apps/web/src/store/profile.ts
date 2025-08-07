import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProfileMetadata {
  name: string;
  avatar: string;
  fiat: string;
  preferredCurrency: string;
  vectorKey: string;
}

export interface ProfileNFT {
  id: string;
  avatarUrl?: string;
}

export interface ProfileNFTState {
  // Profile NFT status
  hasProfileNFT: boolean;
  profileMetadata: ProfileMetadata | null;
  tokenId: number | null;
  profileNFT?: ProfileNFT;
  
  // Currency preferences
  preferredCurrency: 'USD' | 'CAD' | 'EUR' | 'XLM' | 'AQUA' | 'USDC' | 'EURC' | 'XRP';
  
  // Loading states
  isCheckingOwnership: boolean;
  isMinting: boolean;
  isUpdating: boolean;
  isHydrated: boolean;
  
  // Error states
  error: string | null;
  
  // API Token (for security features)
  apiToken: string | null;
  
  // MFA settings
  mfaEnabled: boolean;
  
  // Actions
  setHasProfileNFT: (hasNFT: boolean) => void;
  setProfileMetadata: (metadata: ProfileMetadata | null) => void;
  setTokenId: (id: number | null) => void;
  setProfileNFT: (nft: ProfileNFT | undefined) => void;
  setCurrency: (currency: 'USD' | 'CAD' | 'EUR' | 'XLM' | 'AQUA' | 'USDC' | 'EURC' | 'XRP') => void;
  setIsCheckingOwnership: (checking: boolean) => void;
  setIsMinting: (minting: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
  setIsHydrated: (hydrated: boolean) => void;
  setError: (error: string | null) => void;
  setApiToken: (token: string | null) => void;
  setMfaEnabled: (enabled: boolean) => void;
  
  // Computed actions
  checkOwnership: (address: string) => Promise<void>;
  mintProfile: (address: string, metadata: Omit<ProfileMetadata, 'vectorKey'>) => Promise<boolean>;
  updateProfile: (metadata: ProfileMetadata) => Promise<boolean>;
  clearProfile: () => void;
  reset: () => void;
}

// Helper function to check ownership via API with timeout
async function checkProfileOwnership(address: string): Promise<{ owns: boolean; metadata?: ProfileMetadata }> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`/api/profile/owns/${address}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If API fails, assume no NFT for better UX
      console.warn(`Profile ownership check failed with status ${response.status}`);
      return { owns: false };
    }
    
    const data = await response.json();
    return { owns: data.owns, metadata: data.metadata };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Profile ownership check timed out');
      return { owns: false }; // Assume no NFT on timeout
    }
    console.error('Failed to check profile ownership:', error);
    return { owns: false }; // Default to no NFT on error
  }
}

// Helper function to mint profile via API
async function mintProfileNFT(address: string, metadata: Omit<ProfileMetadata, 'vectorKey'>): Promise<{ success: boolean; xdr?: string; metadata?: ProfileMetadata }> {
  try {
    const response = await fetch('/api/profile/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: address,
        metadata,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to mint profile NFT:', error);
    throw error;
  }
}

export const useProfileStore = create<ProfileNFTState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasProfileNFT: false,
      profileMetadata: null,
      tokenId: null,
      profileNFT: undefined,
      preferredCurrency: 'USD',
      isCheckingOwnership: false,
      isMinting: false,
      isUpdating: false,
      isHydrated: false,
      error: null,
      apiToken: null,
      mfaEnabled: false,

      // Basic setters
      setHasProfileNFT: (hasNFT) => set({ hasProfileNFT: hasNFT }),
      setProfileMetadata: (metadata) => set({ profileMetadata: metadata }),
      setTokenId: (id) => set({ tokenId: id }),
      setProfileNFT: (nft) => set({ profileNFT: nft }),
      setCurrency: (currency) => set({ preferredCurrency: currency }),
      setIsCheckingOwnership: (checking) => set({ isCheckingOwnership: checking }),
      setIsMinting: (minting) => set({ isMinting: minting }),
      setIsUpdating: (updating) => set({ isUpdating: updating }),
      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),
      setError: (error) => set({ error }),
      setApiToken: (token) => set({ apiToken: token }),
      setMfaEnabled: (enabled) => set({ mfaEnabled: enabled }),

      // Check ownership action
      checkOwnership: async (address: string) => {
        const { setIsCheckingOwnership, setHasProfileNFT, setProfileMetadata, setError } = get();
        
        setIsCheckingOwnership(true);
        setError(null);
        
        try {
          const result = await checkProfileOwnership(address);
          setHasProfileNFT(result.owns);
          setProfileMetadata(result.metadata || null);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to check ownership');
          setHasProfileNFT(false);
          setProfileMetadata(null);
        } finally {
          setIsCheckingOwnership(false);
        }
      },

      // Mint profile action
      mintProfile: async (address: string, metadata: Omit<ProfileMetadata, 'vectorKey'>) => {
        const { setIsMinting, setError, setHasProfileNFT: _setHasProfileNFT, setProfileMetadata: _setProfileMetadata } = get();
        
        setIsMinting(true);
        setError(null);
        
        try {
          const result = await mintProfileNFT(address, metadata);
          
          if (result.success && result.xdr) {
            // Return the XDR for the frontend to handle signing
            // After successful signing and submission, the frontend should call setHasProfileNFT(true)
            return true;
          } else {
            throw new Error('Failed to prepare mint transaction');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to mint profile';
          setError(errorMessage);
          return false;
        } finally {
          setIsMinting(false);
        }
      },

      // Update profile action (for metadata changes)
      updateProfile: async (metadata: ProfileMetadata) => {
        const { setIsUpdating, setError, setProfileMetadata } = get();
        
        setIsUpdating(true);
        setError(null);
        
        try {
          // TODO: Implement profile update API endpoint
          // This would update the NFT metadata on-chain
          setProfileMetadata(metadata);
          return true;
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to update profile');
          return false;
        } finally {
          setIsUpdating(false);
        }
      },

      // Clear profile (for account deletion)
      clearProfile: () => set({
        hasProfileNFT: false,
        profileMetadata: null,
        tokenId: null,
        profileNFT: undefined,
        isCheckingOwnership: false,
        isMinting: false,
        isUpdating: false,
        error: null,
        apiToken: null,
        mfaEnabled: false,
      }),

      // Reset state
      reset: () => set({
        hasProfileNFT: false,
        profileMetadata: null,
        tokenId: null,
        profileNFT: undefined,
        preferredCurrency: 'USD',
        isCheckingOwnership: false,
        isMinting: false,
        isUpdating: false,
        isHydrated: false,
        error: null,
        apiToken: null,
        mfaEnabled: false,
      }),
    }),
    {
      name: 'profile-nft-store',
      // Only persist the essential data, not loading states
      partialize: (state) => ({
        hasProfileNFT: state.hasProfileNFT,
        profileMetadata: state.profileMetadata,
        tokenId: state.tokenId,
        profileNFT: state.profileNFT,
        preferredCurrency: state.preferredCurrency,
        apiToken: state.apiToken,
        mfaEnabled: state.mfaEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setIsHydrated(true);
        }
      },
    }
  )
);

// Selector hooks for common use cases
export const useProfileNFTStatus = () => useProfileStore((state) => ({
  hasProfileNFT: state.hasProfileNFT,
  isCheckingOwnership: state.isCheckingOwnership,
  error: state.error,
}));

export const useProfileMetadata = () => useProfileStore((state) => state.profileMetadata);

export const useMintingState = () => useProfileStore((state) => ({
  isMinting: state.isMinting,
  error: state.error,
}));