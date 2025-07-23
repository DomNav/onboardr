import React from 'react';
import { FloatingChatButton } from './FloatingChatButton';
import { ChatModal } from './ChatModal';

interface ChatAssistantProps {
  className?: string;
}

export function ChatAssistant({ className }: ChatAssistantProps) {
  return (
    <>
      <FloatingChatButton className={className} />
      <ChatModal className={className} />
    </>
  );
} 