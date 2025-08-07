'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

export default function SignInPage() {
  const router = useRouter();
  const { connect, isConnected, address, availableConnectors } = useWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-redirect if already connected
  useEffect(() => {
    if (isConnected && address) {
      toast.success('Wallet already connected!');
      window.location.href = '/soro';
    }
  }, [isConnected, address]);

  const handleWalletSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);

      // First ensure wallet is connected
      if (!isConnected || !address) {
        toast.error('Please connect your wallet first');
        setIsSigningIn(false);
        return;
      }

      // For demo purposes, skip authentication and go directly to the app
      toast.success('Successfully connected!');
      
      // Force redirect using window.location
      setTimeout(() => {
        window.location.href = '/soro';
      }, 500);
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred');
      toast.error('Failed to sign in');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in to Onboardr</CardTitle>
          <CardDescription>
            Connect your Stellar wallet to access your personalized DeFi dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                First, connect your wallet:
              </p>
              {availableConnectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full"
                  onClick={() => connect(connector.id)}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Connected as: <span className="font-mono">{address}</span>
              </div>
              <Button
                className="w-full"
                onClick={handleWalletSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Sign in with Wallet
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}