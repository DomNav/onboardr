'use client';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick?: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      title="Settings"
    >
      <Settings size={20} />
    </button>
  );
}