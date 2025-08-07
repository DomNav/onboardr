'use client';

import { useSession } from 'next-auth/react';
import { useWallet } from '@/contexts/WalletContext';
import { useWatchlistStore } from '@/store/watchlist';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function StatusPage() {
  const { data: session, status } = useSession();
  const { isConnected, address, availableConnectors } = useWallet();
  const { getWatchlistCount } = useWatchlistStore();

  const StatusIndicator = ({ condition, children }: { condition: boolean; children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
      {condition ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      {children}
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>App Status</CardTitle>
            <CardDescription>Current status of authentication and core features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Authentication Status */}
              <div className="space-y-2">
                <h3 className="font-semibold">Authentication</h3>
                <StatusIndicator condition={status === 'authenticated'}>
                  NextAuth Session: {status}
                </StatusIndicator>
                {session?.user && (
                  <div className="ml-6 text-sm text-muted-foreground">
                    <p>User ID: {session.user.id}</p>
                    <p>Address: {session.user.address}</p>
                  </div>
                )}
              </div>

              {/* Wallet Status */}
              <div className="space-y-2">
                <h3 className="font-semibold">Wallet Connection</h3>
                <StatusIndicator condition={isConnected}>
                  Wallet Connected: {isConnected ? 'Yes' : 'No'}
                </StatusIndicator>
                {address && (
                  <div className="ml-6 text-sm text-muted-foreground">
                    <p>Address: {address}</p>
                  </div>
                )}
                <div className="ml-6 text-sm text-muted-foreground">
                  <p>Available Connectors: {availableConnectors.length}</p>
                </div>
              </div>

              {/* Watchlist Status */}
              <div className="space-y-2">
                <h3 className="font-semibold">Watchlist</h3>
                <StatusIndicator condition={getWatchlistCount() >= 0}>
                  Watchlist Store: Working
                </StatusIndicator>
                <div className="ml-6 text-sm text-muted-foreground">
                  <p>Watched Tokens: {getWatchlistCount()}</p>
                </div>
              </div>

              {/* Environment Status */}
              <div className="space-y-2">
                <h3 className="font-semibold">Environment</h3>
                <StatusIndicator condition={!!process.env.NEXT_PUBLIC_VERCEL_URL || typeof window !== 'undefined'}>
                  NextAuth URL: {process.env.NEXTAUTH_URL || 'Not set'}
                </StatusIndicator>
                <StatusIndicator condition={!!process.env.NEXTAUTH_SECRET}>
                  NextAuth Secret: {process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set'}
                </StatusIndicator>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Configuration</CardTitle>
            <CardDescription>Status of required and optional environment variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { key: 'NEXTAUTH_URL', required: true },
                { key: 'NEXTAUTH_SECRET', required: true },
                { key: 'NEXT_PUBLIC_SUPABASE_URL', required: false },
                { key: 'SUPABASE_SERVICE_ROLE_KEY', required: false },
                { key: 'OPENAI_API_KEY', required: false },
                { key: 'STELLAR_NETWORK', required: false },
              ].map(({ key, required }) => {
                const value = process.env[key];
                const isSet = !!value;
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className={required ? 'font-medium' : 'text-muted-foreground'}>
                      {key} {required && '*'}
                    </span>
                    <Badge variant={isSet ? 'default' : 'secondary'}>
                      {isSet ? 'Set' : 'Not set'}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Required for authentication to work
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}