'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTradeStore } from '@/store/trades';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingSoroButtonProps {
  onClick?: () => void;
  className?: string;
}

const SoroIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Soro head - circular with gradient */}
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      fill="url(#soroGradient)"
      stroke="currentColor"
      strokeWidth="1"
    />
    {/* Eyes */}
    <circle cx="9" cy="9" r="1.5" fill="currentColor" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" />
    {/* Smile */}
    <path 
      d="M8 14c1 2 3 3 4 3s3-1 4-3" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      fill="none"
    />
    {/* Gradient definition */}
    <defs>
      <linearGradient id="soroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgb(20 184 166)" />
        <stop offset="100%" stopColor="rgb(13 148 136)" />
      </linearGradient>
    </defs>
  </svg>
);

export const FloatingSoroButton: React.FC<FloatingSoroButtonProps> = ({ 
  onClick,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { unread } = useTradeStore();
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClick?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClick]);

  return (
    <motion.div
      className={`fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[60] isolate ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.5 
      }}
    >

      
      {/* Unread indicator */}
      {unread > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 z-10"
        >
          <Badge 
            variant="destructive" 
            className="h-5 w-5 p-0 flex items-center justify-center rounded-full animate-pulse"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        </motion.div>
      )}
      
      {/* Main button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Button
          onClick={onClick}
          size="lg"
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 border-2 border-teal-400/50 hover:border-teal-300/70 transition-all duration-200 group shadow-none"
          aria-label="Open Soro trading panel (Ctrl+K)"
          title="Open Soro Assistant (Ctrl+K)"
        >
          {/* Floating animation */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SoroIcon className={`w-8 h-8 transition-colors ${unread > 0 ? 'text-yellow-200' : 'text-white'} group-hover:text-teal-50`} />
          </motion.div>
          
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={isHovered ? { x: "100%" } : { x: "-100%" }}
            transition={{ duration: 0.6 }}
          />
        </Button>
      </motion.div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg whitespace-nowrap"
          >
            <div>
              <div className="font-medium">Trade with Soro</div>
              <div className="text-xs opacity-75 mt-0.5">Press Ctrl+K</div>
            </div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900 dark:border-l-gray-100" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};