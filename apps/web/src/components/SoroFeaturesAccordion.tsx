'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { MessageSquare, TrendingUp, PieChart, Bell, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface Feature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  description: string;
  capabilities: string[];
  exampleCommand: string;
}

const features: Feature[] = [
  {
    id: 'defi-questions',
    icon: MessageSquare,
    title: 'Answer DeFi questions',
    summary: 'Get instant answers about protocols, yields, and market dynamics',
    description: 'Soro provides comprehensive insights into DeFi protocols, helping you understand complex financial concepts and make informed decisions.',
    capabilities: [
      'Explain protocol mechanics and risks',
      'Compare yield farming strategies',
      'Analyze market trends and opportunities',
      'Provide real-time APY comparisons'
    ],
    exampleCommand: '/help What is impermanent loss in liquidity pools?'
  },
  {
    icon: TrendingUp,
    id: 'suggest-swaps',
    title: 'Suggest swaps',
    summary: 'Receive intelligent swap recommendations based on market analysis',
    description: 'Get personalized swap suggestions that optimize for price, gas fees, and slippage while considering your portfolio goals.',
    capabilities: [
      'Find optimal swap routes across DEXs',
      'Calculate expected slippage and fees',
      'Suggest timing for better rates',
      'Alert on price movements and opportunities'
    ],
    exampleCommand: 'swap 100 XLM to USDC'
  },
  {
    icon: PieChart,
    id: 'portfolio-summary',
    title: 'Summarize your portfolio',
    summary: 'Get clear insights into your holdings, performance, and allocation',
    description: 'Track your DeFi portfolio performance with detailed analytics, risk assessment, and rebalancing recommendations.',
    capabilities: [
      'Calculate total portfolio value and P&L',
      'Analyze asset allocation and diversification',
      'Track yield earnings across protocols',
      'Generate performance reports and insights'
    ],
    exampleCommand: '/portfolio summary'
  },
  {
    icon: Bell,
    id: 'notifications',
    title: 'Notify on-chain events',
    summary: 'Stay updated on important transactions and market movements',
    description: 'Never miss critical events with intelligent notifications for price movements, transaction confirmations, and market opportunities.',
    capabilities: [
      'Set price alerts for specific tokens',
      'Monitor transaction confirmations',
      'Get notified of yield farming opportunities',
      'Track protocol updates and announcements'
    ],
    exampleCommand: '/alert XLM price > $0.15'
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

interface SoroFeaturesAccordionProps {
  defaultOpen?: string;
  onTryFeature?: (command: string) => void;
}

export function SoroFeaturesAccordion({ defaultOpen, onTryFeature }: SoroFeaturesAccordionProps) {
  const handleTryFeature = (command: string) => {
    if (onTryFeature) {
      onTryFeature(command);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-4xl mx-auto px-4"
    >
      <Card className="border-border bg-card/50 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">
            What Soro can do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion 
            type="single" 
            collapsible 
            defaultValue={defaultOpen}
            className="space-y-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.id} variants={item}>
                  <AccordionItem 
                    value={feature.id}
                    className="border border-border/50 rounded-xl bg-muted/30 hover:border-teal-500/30 transition-colors duration-300 shadow-sm hover:shadow-md overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="flex-shrink-0">
                          <Icon className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {feature.summary}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-start space-x-2">
                          <Sparkles className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground italic">
                            {feature.description}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground text-sm mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                            Capabilities
                          </h4>
                          <ul className="space-y-1">
                            {feature.capabilities.map((capability, capIndex) => (
                              <motion.li 
                                key={capIndex} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: capIndex * 0.05 }}
                                className="text-xs text-muted-foreground flex items-start"
                              >
                                <span className="text-teal-400 mr-2 mt-0.5">•</span>
                                {capability}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="pt-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTryFeature(feature.exampleCommand)}
                            className="text-teal-400 border-teal-400/30 hover:bg-teal-400/10 hover:border-teal-400/50 transition-all duration-200 hover:scale-105 text-xs h-7 px-3"
                          >
                            Try this now
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
} 