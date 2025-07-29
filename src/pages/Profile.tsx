import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useChatContext } from '../contexts/ChatContext';
import { useFreighter } from '../hooks/useFreighter';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Edit3, 
  Save, 
  X, 
  Shield, 
  Star,
  Activity,
  DollarSign,
  TrendingUp,
  User
} from 'lucide-react';

// Mock profile data that would be stored in MCP memory
const defaultProfile = {
  displayName: 'Stellar Explorer',
  bio: 'DeFi enthusiast exploring the Stellar ecosystem',
  avatar: '',
  favoriteTokens: ['XLM', 'USDC', 'SORO'],
  tradingExperience: 'Intermediate',
  riskTolerance: 'Medium',
  notifications: {
    priceAlerts: true,
    poolUpdates: true,
    news: false
  }
};

const Profile = () => {
  const { memory, updateMemory } = useChatContext();
  const { publicKey, isConnected } = useFreighter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(defaultProfile);
  const [tempProfile, setTempProfile] = useState(defaultProfile);

  // Load profile from MCP memory on mount
  useEffect(() => {
    if (memory.userPreferences?.profile) {
      setProfile(memory.userPreferences.profile);
      setTempProfile(memory.userPreferences.profile);
    }
  }, [memory]);

  const handleSaveProfile = () => {
    setProfile(tempProfile);
    updateMemory({
      userPreferences: {
        ...memory.userPreferences,
        profile: tempProfile
      }
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      // You could add a toast notification here
    }
  };

  // Truncate address for display
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleTokenToggle = (token: string) => {
    const updatedTokens = tempProfile.favoriteTokens.includes(token)
      ? tempProfile.favoriteTokens.filter(t => t !== token)
      : [...tempProfile.favoriteTokens, token];
    
    setTempProfile({
      ...tempProfile,
      favoriteTokens: updatedTokens
    });
  };

  const availableTokens = ['XLM', 'USDC', 'USDT', 'SORO', 'DFX', 'ETH', 'BTC'];

  return (
    <PageLayout title="Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Info Card */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {profile.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="displayName"
                          value={tempProfile.displayName}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            displayName: e.target.value
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{profile.displayName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Input
                          id="bio"
                          value={tempProfile.bio}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            bio: e.target.value
                          })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-muted-foreground">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Trading Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trading Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Experience Level</Label>
                    {isEditing ? (
                      <select
                        id="experience"
                        value={tempProfile.tradingExperience}
                        onChange={(e) => setTempProfile({
                          ...tempProfile,
                          tradingExperience: e.target.value
                        })}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    ) : (
                      <p className="text-sm">{profile.tradingExperience}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="risk">Risk Tolerance</Label>
                    {isEditing ? (
                      <select
                        id="risk"
                        value={tempProfile.riskTolerance}
                        onChange={(e) => setTempProfile({
                          ...tempProfile,
                          riskTolerance: e.target.value
                        })}
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    ) : (
                      <p className="text-sm">{profile.riskTolerance}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Favorite Tokens */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Favorite Tokens</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Select your favorite tokens for quick access:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableTokens.map(token => (
                        <Badge
                          key={token}
                          variant={tempProfile.favoriteTokens.includes(token) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleTokenToggle(token)}
                        >
                          {tempProfile.favoriteTokens.includes(token) && (
                            <Star className="h-3 w-3 mr-1 fill-current" />
                          )}
                          {token}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteTokens.map(token => (
                      <Badge key={token} variant="default">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {token}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet & Stats Sidebar */}
        <div className="space-y-6">
          
          {/* Wallet Connection Card */}
          <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Connected Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <Badge variant="outline">Freighter</Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {isConnected && publicKey ? truncateAddress(publicKey) : 'No wallet connected'}
                    </code>
                    {isConnected && publicKey && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={copyAddress}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Balance</Label>
                  <p className="text-lg font-semibold">
                    {isConnected ? '1,247.83 XLM' : 'Connect wallet to view balance'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Network</Label>
                  <p className="text-sm">{isConnected ? 'Stellar Mainnet' : 'Not connected'}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                disabled={!isConnected || !publicKey}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Portfolio Value</span>
                  </div>
                  <span className="font-semibold">$2,847.92</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm">24h Change</span>
                  </div>
                  <span className="font-semibold text-success">+3.2%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Positions</span>
                  </div>
                  <span className="font-semibold">7</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" size="sm">
                View Full Portfolio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile; 