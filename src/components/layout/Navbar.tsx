import React, { useRef, useEffect } from 'react';
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AnimatedThemeToggle } from '../theme/animated-theme-toggle';
import { SearchResults } from '../ui/search-results';
import { useSearch } from '../../hooks/useSearch';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../../contexts/ChatContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import ConnectWalletButton from '../wallet/ConnectWalletButton';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { memory } = useChatContext();
  
  const {
    query,
    results,
    isLoading,
    isOpen,
    performSearch,
    clearSearch,
    closeSearch
  } = useSearch();

  // Get user profile from memory or use defaults
  const userProfile = memory.userPreferences?.profile || {
    displayName: 'John Doe',
    bio: 'john.doe@example.com'
  };

  // Dummy notification data
  const notifications = [
    {
      id: 1,
      title: "Pool Alert",
      message: "SORO/USDC APR has increased to 12.8%",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: 2,
      title: "Portfolio Update",
      message: "Your DeFi positions gained 3.2% today",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      title: "Protocol News",
      message: "Soroswap announces new liquidity incentives",
      time: "3 hours ago",
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim()) {
      performSearch(value);
    } else {
      clearSearch();
    }
  };

  // Handle search result click
  const handleResultClick = (result: any) => {
    navigate(result.url);
    clearSearch();
    closeSearch();
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
      closeSearch();
      inputRef.current?.blur();
    }
  };

  return (
    <header className={cn("bg-background/95 backdrop-blur-sm sticky top-0 z-30 border-b", className)}>
      <div className="w-full flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2 lg:gap-4">
          <h1 className="text-lg font-semibold tracking-tight lg:text-xl">Onboardr</h1>
          
          <div ref={searchRef} className="relative hidden md:block">
            <div className="relative flex items-center h-9 rounded-md px-3 text-muted-foreground focus-within:text-foreground bg-muted/50">
              <Search className="h-4 w-4 mr-2" />
              <Input 
                ref={inputRef}
                type="search" 
                placeholder="Search pools, protocols..." 
                value={query}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="h-9 w-[200px] lg:w-[280px] bg-transparent border-none px-0 py-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </div>
            
            <SearchResults
              results={results}
              isLoading={isLoading}
              isOpen={isOpen}
              onResultClick={handleResultClick}
              className="w-[200px] lg:w-[280px]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-auto justify-end">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => {
              // For mobile, we could open a search modal or expand the search
              inputRef.current?.focus();
            }}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <ConnectWalletButton />
            <AnimatedThemeToggle />
            
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 dropdown-content-solid">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                      {notification.unread && (
                        <div className="h-2 w-2 rounded-full bg-primary ml-2 mt-1" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled className="text-center text-muted-foreground">
                  No notifications
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 p-0">
                <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105">
                  <AvatarFallback className="bg-primary/10 text-primary dark:text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 dropdown-content-solid">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile.bio}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 