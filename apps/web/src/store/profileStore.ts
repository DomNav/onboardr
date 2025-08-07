import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AlertPrefs = {
  trades: boolean;
  priceMoves: boolean;
  liquidations: boolean;
  weeklyDigest: boolean;
};

export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'zh';
export type Currency = 'USD' | 'CAD' | 'EUR' | 'XLM' | 'AQUA' | 'USDC' | 'EURC' | 'XRP';

export interface ProfileNFT {
  id: string;
  avatarUrl?: string;
  nickname?: string;
  vectorKey?: string;
}

export interface ProfileState {
  // Core profile data
  profileNFT?: ProfileNFT;
  preferredCurrency: Currency;
  locale: Locale;
  
  // Preferences
  alertPrefs: AlertPrefs;
  
  // Security
  mfaEnabled: boolean;
  apiToken?: string;
  
  // Actions
  setProfileNFT: (nft: ProfileNFT) => void;
  updateAvatar: (avatarUrl: string) => void;
  updateNickname: (nickname: string) => void;
  setPreferredCurrency: (currency: Currency) => void;
  setLocale: (locale: Locale) => void;
  setAlertPrefs: (prefs: Partial<AlertPrefs>) => void;
  setMfaEnabled: (enabled: boolean) => void;
  setApiToken: (token?: string) => void;
  clearProfile: () => void;
}

const defaultAlertPrefs: AlertPrefs = {
  trades: true,
  priceMoves: true,
  liquidations: true,
  weeklyDigest: false,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, _get) => ({
      // Initial state
      preferredCurrency: 'USD',
      locale: 'en',
      alertPrefs: defaultAlertPrefs,
      mfaEnabled: false,
      
      // Actions
      setProfileNFT: (nft: ProfileNFT) => 
        set({ profileNFT: nft }),
      
      updateAvatar: (avatarUrl: string) => 
        set((state) => ({
          profileNFT: { ...state.profileNFT!, avatarUrl }
        })),
      
      updateNickname: (nickname: string) => 
        set((state) => ({
          profileNFT: { ...state.profileNFT!, nickname }
        })),
      
      setPreferredCurrency: (currency: Currency) => 
        set({ preferredCurrency: currency }),
      
      setLocale: (locale: Locale) => {
        set({ locale });
        // Set locale cookie for SSR
        if (typeof document !== 'undefined') {
          document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year
        }
      },
      
      setAlertPrefs: (prefs: Partial<AlertPrefs>) => 
        set((state) => ({
          alertPrefs: { ...state.alertPrefs, ...prefs }
        })),
      
      setMfaEnabled: (enabled: boolean) => 
        set({ mfaEnabled: enabled }),
      
      setApiToken: (token?: string) => 
        set({ apiToken: token }),
      
      clearProfile: () => 
        set({
          profileNFT: undefined,
          preferredCurrency: 'USD',
          locale: 'en',
          alertPrefs: defaultAlertPrefs,
          mfaEnabled: false,
          apiToken: undefined,
        }),
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        profileNFT: state.profileNFT,
        preferredCurrency: state.preferredCurrency,
        locale: state.locale,
        alertPrefs: state.alertPrefs,
        mfaEnabled: state.mfaEnabled,
        apiToken: state.apiToken,
      }),
    }
  )
);