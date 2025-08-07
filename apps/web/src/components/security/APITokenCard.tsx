'use client';

import React, { useState } from 'react';
import { useProfileStore } from '@/store/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Key, Eye, EyeOff, Copy, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function APITokenCard() {
  const { apiToken, setApiToken } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/api-token', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const { token } = await response.json();
      setApiToken(token);
      setNewToken(token);
      toast.success('API token generated successfully');
    } catch (error) {
      toast.error('Failed to generate API token');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/api-token', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke token');
      }

      setApiToken(null);
      setNewToken(null);
      toast.success('API token revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke API token');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Token copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy token');
    }
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return token;
    return `${token.slice(0, 4)}${'*'.repeat(token.length - 8)}${token.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Access Token
        </CardTitle>
        <CardDescription>
          Generate a personal access token for programmatic access to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiToken ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No API token generated yet. Create one to access your account programmatically.
            </p>
            <Button onClick={generateToken} disabled={isLoading}>
              <Key className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate API Token'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-green-600">
                Active Token
              </Badge>
              <div className="text-xs text-muted-foreground">
                Created: {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Your API Token</Label>
              <div className="flex gap-2">
                <Input
                  value={showToken ? (newToken || apiToken) : maskToken(apiToken)}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newToken || apiToken)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {newToken && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This is the only time you&apos;ll see the full token. Make sure to copy it now!
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={generateToken}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? 'Regenerating...' : 'Regenerate Token'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke API Token?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Any applications using this token 
                      will lose access to your account immediately.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={revokeToken}>
                      Revoke Token
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Security Notice:</strong> Keep your API token secure and never share it. 
                It provides full access to your account data.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}