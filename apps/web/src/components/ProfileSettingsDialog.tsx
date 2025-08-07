'use client';

import React, { useState } from 'react';
import { useProfileStore } from '@/store/profile';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AvatarInitial } from './ui/AvatarInitial';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  Settings, 
  Download, 
  ExternalLink,
  Trash2,
  User,
  Globe,
  Palette,
  DollarSign
} from 'lucide-react';
import { CurrencyDropdown } from './CurrencyDropdown';

import { toast } from 'sonner';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { 
    profileMetadata, 
    clearProfile
  } = useProfileStore();
  
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [tempNickname, setTempNickname] = useState(profileMetadata?.name || '');




  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/profile/export', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-data-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data export downloaded');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleForgetMe = async () => {
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      clearProfile();
      onOpenChange(false);
      toast.success('Profile deleted successfully');
    } catch (error) {
      toast.error('Failed to delete profile');
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your profile, security, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your avatar and display name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <AvatarInitial 
                    name={profileMetadata?.name}
                    size="lg"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Avatar generated from your profile name
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nickname"
                      value={tempNickname}
                      onChange={(e) => setTempNickname(e.target.value)}
                      placeholder="Display name functionality coming soon"
                      disabled
                    />
                    <Button disabled>
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Language
                    </Label>
                    <Select value="en" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Theme
                    </Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Currency
                    </Label>
                    <CurrencyDropdown />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export your data or manage your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-4">
                  <Button 
                    onClick={handleDataExport}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>

                  {profileMetadata?.vectorKey && (
                    <Button 
                      onClick={() => window.open(
                        `https://stellar.expert/explorer/public/asset/${profileMetadata.vectorKey}`,
                        '_blank'
                      )}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View NFT on StellarExpert
                    </Button>
                  )}

                  <Separator />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full justify-start">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Forget Me (Delete Account)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          profile, burn your NFT, and remove all associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleForgetMe}>
                          Delete Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}