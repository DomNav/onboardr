'use client';

import React, { useState } from 'react';
import { useProfileStore } from '@/store/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Shield, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TOTPData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function TOTPSetup() {
  const { mfaEnabled, setMfaEnabled } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);
  const [totpData, setTotpData] = useState<TOTPData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const setupMFA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/mfa/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to setup MFA');
      }

      const data = await response.json();
      setTotpData(data);
      setShowSetup(true);
    } catch (error) {
      toast.error('Failed to setup MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || !totpData) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/profile/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationCode,
          secret: totpData.secret,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      setMfaEnabled(true);
      setShowSetup(false);
      setTotpData(null);
      setVerificationCode('');
      toast.success('MFA enabled successfully');
    } catch (error) {
      toast.error('Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMFA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/mfa/disable', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disable MFA');
      }

      setMfaEnabled(false);
      toast.success('MFA disabled successfully');
    } catch (error) {
      toast.error('Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAToggle = (enabled: boolean) => {
    if (enabled && !mfaEnabled) {
      setupMFA();
    } else if (!enabled && mfaEnabled) {
      disableMFA();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable MFA</Label>
            <p className="text-sm text-muted-foreground">
              {mfaEnabled 
                ? 'Two-factor authentication is currently enabled'
                : 'Use an authenticator app to secure your account'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mfaEnabled && (
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
            <Switch
              checked={mfaEnabled}
              onCheckedChange={handleMFAToggle}
              disabled={isLoading}
            />
          </div>
        </div>

        {showSetup && totpData && (
          <>
            <Separator />
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={totpData.qrCodeUrl} 
                    alt="TOTP QR Code" 
                    className="w-48 h-48"
                  />
                </div>

                <div className="text-center space-y-2">
                  <Label>Manual Entry Key</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {totpData.secret}
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowSetup(false);
                      setTotpData(null);
                      setVerificationCode('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifyAndEnable}
                    disabled={!verificationCode || verificationCode.length !== 6 || isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                </div>

                {totpData.backupCodes.length > 0 && (
                  <div className="w-full">
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Backup Codes
                      </Label>
                      <Alert>
                        <AlertDescription>
                          Save these backup codes in a secure location. Each code can only be used once.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {totpData.backupCodes.map((code, index) => (
                          <div key={index} className="bg-muted p-2 rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {mfaEnabled && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your account is protected with two-factor authentication. 
              You&apos;ll need your authenticator app to sign in.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}