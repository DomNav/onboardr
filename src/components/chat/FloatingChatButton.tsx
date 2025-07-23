import React from 'react';
import { Button } from '../ui/button';
import { MessageCircle, Bot } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';
import { cn } from '../../lib/utils';

interface FloatingChatButtonProps {
  className?: string;
}

export function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const { isOpen, openChat, messages } = useChatContext();
  
  // Check if there are unread messages (simplified logic)
  const hasUnreadMessages = messages.length > 1; // More than just welcome message



  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50",
      className
    )}>
      <Button
        onClick={openChat}
        disabled={isOpen}
        className={cn(
          "h-14 w-14 rounded-full shadow-soroswap-glow hover:shadow-soroswap-hover",
          "bg-gradient-to-br from-primary to-accent",
          "text-primary-foreground font-semibold",
          "transition-all duration-300 ease-in-out",
          "hover:scale-110 active:scale-95",
          "animate-float-gentle",
          "border-2 border-white/20 dark:border-white/10",
          "backdrop-blur-sm",
          hasUnreadMessages && "animate-pulse-gentle"
        )}
        size="icon"
      >
        <div className="relative">
          <Bot className="h-6 w-6" />
          {hasUnreadMessages && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
          )}
        </div>
        <span className="sr-only">Open AI Assistant</span>
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        AI Assistant
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
      </div>
    </div>
  );
} 