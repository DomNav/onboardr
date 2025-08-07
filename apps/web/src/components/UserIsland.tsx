'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import BalanceButton from '@/components/BalanceButton';
import WalletConnectionPill from '@/components/WalletConnectionPill';
import SettingsButton from '@/components/SettingsButton';
import TradesButton from '@/components/TradesButton';

export default function UserIsland() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 gap-1">
      <WalletConnectionPill />
      <BalanceButton />
      <TradesButton />
      <SettingsButton />
      
      <button
        onClick={toggleTheme}
        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
        suppressHydrationWarning
      >
        {!mounted ? (
          <Moon size={20} />
        ) : theme === 'dark' ? (
          <Sun size={20} />
        ) : (
          <Moon size={20} />
        )}
      </button>
    </div>
  );
}