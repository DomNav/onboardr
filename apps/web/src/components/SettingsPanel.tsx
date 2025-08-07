'use client';

import { CurrencyDropdown } from '@/components/CurrencyDropdown';
import { AvatarInitial } from '@/components/ui/AvatarInitial';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { useProfileStore } from '@/store/profile';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    DollarSign,
    Download,
    Monitor,
    Moon,
    Palette,
    Settings,
    Shield,
    Sun,
    Trash2,
    User,
    X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { profile, profileMetadata, updateProfile, deleteProfile } = useProfileStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [displayName, setDisplayName] = useState(profileMetadata?.display_name || '');
  const [bio, setBio] = useState(profileMetadata?.bio || '');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        bio: bio,
      });
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleForgetMe = async () => {
    try {
      await deleteProfile();
      toast.success('Profile deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete profile');
    }
  };

  const handleExportData = () => {
    const data = {
      profile: profileMetadata,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'onboardr-profile-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Profile data exported successfully');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md p-0 h-screen fixed right-0 top-0 translate-x-0 translate-y-0 rounded-none border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <DialogHeader className="flex-shrink-0 p-6 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Settings
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                    <TabsTrigger value="general" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="text-xs">
                      <Palette className="h-3 w-3 mr-1" />
                      Theme
                    </TabsTrigger>
                    <TabsTrigger value="data" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Privacy
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6 space-y-6">
                    <TabsContent value="general" className="space-y-6 mt-0">
                      {/* Profile Section */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {profileMetadata && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <AvatarInitial 
                                name={profileMetadata.display_name || 'User'} 
                                size="md"
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {profileMetadata.display_name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {profileMetadata.bio || 'No bio yet'}
                                </p>
                              </div>
                              <Badge variant="secondary" className="flex-shrink-0">
                                Profile NFT
                              </Badge>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="displayName">Display Name</Label>
                              <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your display name"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="bio">Bio</Label>
                              <Input
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Currency Settings */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Currency & Region
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label>Display Currency</Label>
                              <div className="mt-1">
                                <CurrencyDropdown />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Notifications */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Email Notifications</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Get notified about important updates
                              </p>
                            </div>
                            <Switch
                              checked={emailNotifications}
                              onCheckedChange={setEmailNotifications}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Browser Notifications</Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Get real-time transaction updates
                              </p>
                            </div>
                            <Switch
                              checked={browserNotifications}
                              onCheckedChange={setBrowserNotifications}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6 mt-0">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Theme Preference
                          </CardTitle>
                          <CardDescription>
                            Choose how Onboardr looks on this device
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3">
                            {themeOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <div
                                  key={option.value}
                                  onClick={() => setTheme(option.value)}
                                  className={`
                                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                                    ${theme === option.value 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-4 w-4" />
                                    <span className="font-medium">{option.label}</span>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${theme === option.value ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="data" className="space-y-6 mt-0">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Data Export
                          </CardTitle>
                          <CardDescription>
                            Download a copy of your profile data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={handleExportData}
                            variant="outline"
                            className="w-full justify-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export Profile Data
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-destructive/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Danger Zone
                          </CardTitle>
                          <CardDescription>
                            Permanently delete your profile and all associated data
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={handleForgetMe}
                            variant="destructive"
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Profile Forever
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-6 border-t bg-muted/30">
                <div className="flex gap-3">
                  <Button onClick={onClose} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
