'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { MessageSquare, TrendingUp, PieChart, Bell } from 'lucide-react';

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Answer DeFi questions',
    description: 'Get instant answers about protocols, yields, and market dynamics'
  },
  {
    icon: TrendingUp,
    title: 'Suggest swaps',
    description: 'Receive intelligent swap recommendations based on market analysis'
  },
  {
    icon: PieChart,
    title: 'Summarize your portfolio',
    description: 'Get clear insights into your holdings, performance, and allocation'
  },
  {
    icon: Bell,
    title: 'Notify on-chain events',
    description: 'Stay updated on important transactions and market movements'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export function SoroCapabilities() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-4xl mx-auto px-4"
    >
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            What Soro can do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <motion.div
                  key={index}
                  variants={item}
                  className="flex items-start space-x-4 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-teal-500/30 transition-colors duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {capability.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}