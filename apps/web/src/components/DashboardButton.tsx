'use client';

import { BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/analytics');
  };

  return (
    <button 
      onClick={handleClick}
      className="ml-2 flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors duration-200"
    >
      <BarChart3 className="size-4" /> 
      Dashboard
    </button>
  );
}
