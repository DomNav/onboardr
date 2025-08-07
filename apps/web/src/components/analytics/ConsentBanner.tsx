'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentBannerProps {
  className?: string;
}

// PIPEDA Compliance - Canadian privacy law requirements
export const ConsentBanner: React.FC<ConsentBannerProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [_hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already provided consent
    try {
      const consent = localStorage.getItem('pipeda-analytics-consent');
      const consentData = consent ? JSON.parse(consent) : null;
      
      if (consentData && consentData.timestamp) {
        // Check if consent is still valid (1 year)
        const consentAge = Date.now() - consentData.timestamp;
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        
        if (consentAge < oneYear) {
          setHasConsented(true);
          return;
        }
      }
      
      // Show banner if no valid consent
      setIsVisible(true);
    } catch (error) {
      // If localStorage fails, show banner to be safe
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      const consentData = {
        accepted: true,
        timestamp: Date.now(),
        version: '1.0',
        analytics: true,
        performance: true
      };
      
      localStorage.setItem('pipeda-analytics-consent', JSON.stringify(consentData));
      setHasConsented(true);
      setIsVisible(false);
    } catch (error) {
      console.warn('Failed to save consent preference');
    }
  };

  const handleDecline = () => {
    try {
      const consentData = {
        accepted: false,
        timestamp: Date.now(),
        version: '1.0',
        analytics: false,
        performance: false
      };
      
      localStorage.setItem('pipeda-analytics-consent', JSON.stringify(consentData));
      setIsVisible(false);
      
      // Redirect to basic analytics page without tracking
      window.location.href = '/analytics?consent=declined';
    } catch (error) {
      console.warn('Failed to save consent preference');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Show again on next visit if not explicitly accepted/declined
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl",
        "bg-card border rounded-lg shadow-lg p-4",
        "animate-in slide-in-from-bottom-2 duration-300",
        className
      )}
      role="dialog"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Shield className="h-5 w-5 text-blue-500" aria-hidden="true" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 id="consent-banner-title" className="text-sm font-semibold text-foreground">
              Analytics Data Collection
            </h3>
            <Badge variant="outline" className="text-xs">
              PIPEDA Compliant
            </Badge>
          </div>
          
          <p id="consent-banner-description" className="text-sm text-muted-foreground">
            We collect anonymized analytics data to improve your experience and monitor performance. 
            This includes page load times, API response metrics, and usage patterns. 
            Your data is processed in accordance with Canadian privacy laws (PIPEDA).
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleAccept}
              size="sm"
              className="flex-1 sm:flex-none"
              aria-describedby="consent-accept-description"
            >
              Accept & Continue
            </Button>
            
            <Button 
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              aria-describedby="consent-decline-description"
            >
              Decline
            </Button>
            
            <Button 
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="sm:ml-auto p-1 h-8 w-8"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="hidden">
            <p id="consent-accept-description">
              Allow analytics collection for improved user experience
            </p>
            <p id="consent-decline-description">
              Continue with basic functionality only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};