'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  User, 
  MapPin, 
  Shield,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscription';
import { toast } from 'sonner';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type KycStep = 'intro' | 'identity' | 'address' | 'review' | 'processing' | 'complete';

interface KycFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
}

export default function KycModal({ isOpen, onClose, onSuccess }: KycModalProps) {
  const [currentStep, setCurrentStep] = useState<KycStep>('intro');
  const [formData, setFormData] = useState<KycFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    country: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { setKycStatus, tier } = useSubscriptionStore();

  const handleNext = () => {
    const stepOrder: KycStep[] = ['intro', 'identity', 'address', 'review', 'processing', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      
      // Auto-process after review
      if (stepOrder[currentIndex + 1] === 'processing') {
        handleProcessKyc();
      }
    }
  };

  const handleBack = () => {
    const stepOrder: KycStep[] = ['intro', 'identity', 'address', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleProcessKyc = async () => {
    setIsProcessing(true);
    
    // Simulate KYC processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    setKycStatus(true);
    setCurrentStep('complete');
    
    // Show success after a short delay
    setTimeout(() => {
      toast.success('KYC verification complete! Elite features unlocked.');
      onSuccess?.();
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setCurrentStep('intro');
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      country: '',
      address: '',
      city: '',
      postalCode: '',
    });
    onClose();
  };

  const isFormValid = () => {
    if (currentStep === 'identity') {
      return formData.firstName && formData.lastName && formData.dateOfBirth;
    }
    if (currentStep === 'address') {
      return formData.country && formData.address && formData.city && formData.postalCode;
    }
    return true;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Unlock Elite Features</h3>
              <p className="text-muted-foreground">
                Complete KYC verification to access unlimited swaps and premium features
              </p>
            </div>
            
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Elite Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Up to 8 concurrent swaps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">$100,000 daily volume limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Priority execution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Tax reporting tools</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="text-center text-sm text-muted-foreground">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              This is a mock KYC process for demo purposes
            </div>
          </div>
        );

      case 'identity':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-sm text-muted-foreground">
                Please provide your identity details
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">First Name</label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last Name</label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Address Verification</h3>
              <p className="text-sm text-muted-foreground">
                Please provide your residential address
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <Input
                  placeholder="United States"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Street Address</label>
                <Input
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <Input
                    placeholder="San Francisco"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Postal Code</label>
                  <Input
                    placeholder="94102"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Review Information</h3>
              <p className="text-sm text-muted-foreground">
                Please confirm your details before submission
              </p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <span>{formData.dateOfBirth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-3">Address</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Country:</span>
                      <span>{formData.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span>{formData.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span>{formData.city}, {formData.postalCode}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verifying Your Information</h3>
              <p className="text-sm text-muted-foreground">
                This will only take a moment...
              </p>
            </div>
            
            <div className="space-y-3">
              {['Validating identity', 'Checking address', 'Running compliance checks'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Verification Complete!</h3>
              <p className="text-muted-foreground">
                Elite features have been unlocked for your account
              </p>
            </div>
            
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 text-center">
                <p className="text-sm">
                  You now have access to all Elite tier benefits including 8 concurrent swaps and priority execution.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'complete' ? 'Welcome to Elite!' : 'KYC Verification'}
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
        
        {currentStep !== 'processing' && currentStep !== 'complete' && (
          <div className="flex gap-3 mt-6">
            {currentStep !== 'intro' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep === 'intro' && (
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Maybe Later
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!isFormValid()}
              className="flex-1"
            >
              {currentStep === 'review' ? 'Submit' : 'Continue'}
              {currentStep !== 'review' && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}