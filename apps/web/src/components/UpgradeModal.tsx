'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Star,
  TrendingUp,
  Shield,
  Rocket
} from 'lucide-react';
import { useSubscriptionStore, getTierDisplayInfo, type TierLevel } from '@/store/subscription';
import { toast } from 'sonner';
import KycModal from './KycModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSwapCount?: number;
}

interface TierPlan {
  tier: TierLevel;
  name: string;
  price: string;
  icon: React.ReactNode;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  recommended?: boolean;
}

export default function UpgradeModal({ isOpen, onClose, currentSwapCount = 0 }: UpgradeModalProps) {
  const { tier: currentTier, upgrade, isKycVerified, features } = useSubscriptionStore();
  const [selectedTier, setSelectedTier] = useState<TierLevel>('pro');
  const [showKycModal, setShowKycModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tierPlans: TierPlan[] = [
    {
      tier: 'free',
      name: 'Free',
      price: '$0',
      icon: <Zap className="w-6 h-6" />,
      features: [
        { name: '2 concurrent swaps', included: true },
        { name: '$1,000 daily volume', included: true },
        { name: 'Basic charts', included: true },
        { name: 'Advanced charts', included: false },
        { name: 'Priority execution', included: false },
        { name: 'API access', included: false },
        { name: 'Custom alerts', included: false },
        { name: 'Tax reporting', included: false },
      ],
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: '$9.99/mo',
      icon: <Star className="w-6 h-6" />,
      recommended: true,
      features: [
        { name: '4 concurrent swaps', included: true, highlight: true },
        { name: '$10,000 daily volume', included: true, highlight: true },
        { name: 'Basic charts', included: true },
        { name: 'Advanced charts', included: true },
        { name: 'Priority execution', included: false },
        { name: 'API access', included: true },
        { name: 'Custom alerts', included: true },
        { name: 'Tax reporting', included: false },
      ],
    },
    {
      tier: 'elite',
      name: 'Elite',
      price: '$29.99/mo',
      icon: <Crown className="w-6 h-6" />,
      features: [
        { name: '8 concurrent swaps', included: true, highlight: true },
        { name: '$100,000 daily volume', included: true, highlight: true },
        { name: 'Basic charts', included: true },
        { name: 'Advanced charts', included: true },
        { name: 'Priority execution', included: true, highlight: true },
        { name: 'API access', included: true },
        { name: 'Custom alerts', included: true },
        { name: 'Tax reporting', included: true },
      ],
    },
  ];

  const handleUpgrade = async () => {
    // Check if upgrading to Elite and KYC not completed
    if (selectedTier === 'elite' && !isKycVerified) {
      setShowKycModal(true);
      return;
    }

    setIsUpgrading(true);
    
    // Simulate upgrade process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    upgrade(selectedTier);
    setIsUpgrading(false);
    
    const tierInfo = getTierDisplayInfo(selectedTier);
    toast.success(`Upgraded to ${tierInfo.name}!`, {
      description: `You now have access to ${tierInfo.name} features.`,
    });
    
    onClose();
  };

  const handleKycSuccess = () => {
    setShowKycModal(false);
    upgrade('elite');
    toast.success('Welcome to Elite! All features unlocked.');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Upgrade Your Plan</DialogTitle>
          </DialogHeader>
          
          {currentSwapCount > features.maxConcurrentSwaps && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <p className="text-sm">
                  You've reached your swap limit ({features.maxConcurrentSwaps} swaps). 
                  Upgrade to add more swaps to your queue!
                </p>
              </div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {tierPlans.map((plan) => {
              const isCurrentTier = plan.tier === currentTier;
              const isSelected = plan.tier === selectedTier;
              const tierDisplay = getTierDisplayInfo(plan.tier);
              
              return (
                <motion.div
                  key={plan.tier}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`relative cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-teal-500 shadow-lg' 
                        : 'hover:shadow-md'
                    } ${isCurrentTier ? 'opacity-75' : ''}`}
                    onClick={() => !isCurrentTier && setSelectedTier(plan.tier)}
                  >
                    {plan.recommended && (
                      <Badge 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600"
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                    
                    {isCurrentTier && (
                      <Badge 
                        className="absolute -top-3 right-4 bg-gray-600"
                        variant="secondary"
                      >
                        Current Plan
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className={`w-12 h-12 rounded-full ${tierDisplay.color} flex items-center justify-center mx-auto mb-3`}>
                        {plan.icon}
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold mt-2">
                        {plan.price}
                        {plan.tier !== 'free' && (
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            per month
                          </span>
                        )}
                      </div>
                      {plan.tier === 'elite' && (
                        <Badge variant="outline" className="mt-2">
                          <Shield className="w-3 h-3 mr-1" />
                          Requires KYC
                        </Badge>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li 
                            key={i}
                            className={`flex items-start gap-2 text-sm ${
                              feature.highlight ? 'font-medium' : ''
                            }`}
                          >
                            {feature.included ? (
                              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                feature.highlight ? 'text-teal-500' : 'text-green-500'
                              }`} />
                            ) : (
                              <X className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={!feature.included ? 'text-muted-foreground' : ''}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={selectedTier === currentTier || isUpgrading}
              className="flex-1"
            >
              {isUpgrading ? (
                <>
                  <Rocket className="w-4 h-4 mr-2 animate-pulse" />
                  Upgrading...
                </>
              ) : selectedTier === currentTier ? (
                'Current Plan'
              ) : selectedTier === 'elite' && !isKycVerified ? (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Start KYC Verification
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Upgrade to {getTierDisplayInfo(selectedTier).name}
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>This is a demo. No real charges will be made.</p>
          </div>
        </DialogContent>
      </Dialog>
      
      <KycModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onSuccess={handleKycSuccess}
      />
    </>
  );
}