'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const tabs = [
  { href: '/balance', label: 'Balance' },
  { href: '/swap',    label: 'Swap'    },
  { href: '/pools',   label: 'Pools'   },
  { href: '/soro',    label: 'Soro AI' },
  { href: '/info',    label: 'Info'    },
];

export default function Nav() {
  const { theme, setTheme } = useTheme();
  
  return (
    <nav className="flex gap-4 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
      {tabs.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className="hover:underline font-medium"
        >
          {t.label}
        </Link>
      ))}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
        className="ml-auto px-2 py-1 hover:bg-white/10 rounded transition-colors"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </nav>
  );
}