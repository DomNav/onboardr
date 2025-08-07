'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavTab {
  href: string;
  label: string;
  external?: boolean;
}

interface SegmentedNavProps {
  tabs: NavTab[];
}

export default function SegmentedNav({ tabs }: SegmentedNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, external?: boolean) => {
    if (external) return false;
    return pathname === href;
  };

  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 gap-1">
      {tabs.map((tab) => {
        const active = isActive(tab.href, tab.external);
        
        return (
          <Link
            key={tab.href}
            href={tab.href}
            target={tab.external ? '_blank' : undefined}
            rel={tab.external ? 'noopener noreferrer' : undefined}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${active 
                ? 'bg-white text-purple-700 shadow-sm' 
                : 'text-white/90 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}