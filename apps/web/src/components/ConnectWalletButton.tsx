'use client';

import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
}

interface ConnectWalletButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isConnecting?: boolean;
  error?: string | null;
}

export default function ConnectWalletButton({ 
  onClick, 
  disabled = false, 
  isConnecting = false, 
  error 
}: ConnectWalletButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        // Remove dead particles and update living ones
        const updated = prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.velocity.x,
            y: particle.y + particle.velocity.y,
            life: particle.life - 1,
          }))
          .filter(particle => particle.life > 0);

        // Add new particles
        const newParticles = Array.from({ length: 2 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 200,
          y: Math.random() * 50,
          size: Math.random() * 3 + 1,
          color: ['#8B5CF6', '#EC4899', '#6366F1'][Math.floor(Math.random() * 3)],
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
          },
          life: 60,
          maxLife: 60,
        }));

        return [...updated, ...newParticles].slice(-20); // Keep max 20 particles
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative px-6 py-3 rounded-xl font-semibold text-white overflow-hidden
          bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500
          hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600
          transform hover:scale-105 hover:-translate-y-1
          transition-all duration-300 ease-out
          shadow-lg hover:shadow-2xl hover:shadow-purple-500/30
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          connect-wallet-float connect-wallet-glow
          ${isConnecting ? 'animate-pulse' : ''}
        `}
      >
        {/* Particle container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: particle.life / particle.maxLife,
                transform: `scale(${particle.life / particle.maxLife})`,
                transition: 'all 0.1s ease-out',
              }}
            />
          ))}
        </div>

        <span className="relative z-10 flex items-center gap-2">
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9z"/>
                <path d="M12 16h10V8H12a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1z"/>
                <circle cx="16" cy="12" r="1"/>
              </svg>
              <span className="group-hover:tracking-wide transition-all duration-300">Connect Wallet</span>
            </>
          )}
        </span>
        
        {/* Shimmering overlay */}
        <div className="absolute inset-0 rounded-xl connect-wallet-shimmer opacity-30"></div>
        
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-75 blur-sm -z-10"></div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
      
      {error && (
        <div className="text-xs text-red-300 mt-2 max-w-xs truncate bg-red-900/20 px-2 py-1 rounded backdrop-blur-sm animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}