'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SoroHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center py-16 px-4"
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 drop-shadow-lg border-2 border-border/30 dark:border-border/50 rounded-3xl p-4 bg-card/30 backdrop-blur-sm inline-block shadow-lg dark:shadow-xl shadow-black/10 dark:shadow-black/20"
      >
        <span className="text-foreground drop-shadow-sm">Meet</span>{' '}
        <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent drop-shadow-md">
          Soro
        </span>
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed drop-shadow-sm"
      >
        Your intelligent DeFi assistant powered by advanced AI. 
        Navigate the decentralized world with confidence.
      </motion.p>
    </motion.div>
  );
}