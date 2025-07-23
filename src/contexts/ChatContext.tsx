import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useAIAssistant } from '../hooks/useAIAssistant';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatMemory {
  lastVisitedToken?: string;
  favoriteCurrencies?: string[];
  dismissedTips?: string[];
  searchHistory?: string[];
  userPreferences?: Record<string, any>;
}

export interface ChatContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  memory: ChatMemory;
  isLoading: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  updateMemory: (updates: Partial<ChatMemory>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memory, setMemory] = useState<ChatMemory>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { generateResponse, getAppContext } = useAIAssistant();
  


  // Load memory from localStorage on mount
  useEffect(() => {
    const savedMemory = localStorage.getItem('onboardr-chat-memory');
    if (savedMemory) {
      try {
        const parsedMemory = JSON.parse(savedMemory);
        setMemory(parsedMemory);
      } catch (error) {
        console.error('Failed to parse chat memory:', error);
      }
    }
  }, []);

  // Save memory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboardr-chat-memory', JSON.stringify(memory));
  }, [memory]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your Onboardr AI assistant. I can help you navigate the app, explain features, and answer questions about tokens, pools, and markets. What would you like to know?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateMemory = useCallback((updates: Partial<ChatMemory>) => {
    setMemory(prev => ({ ...prev, ...updates }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      // Get app context and generate AI response
      const appContext = getAppContext(memory);
      const response = await generateResponse(content, appContext, memory, updateMemory);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: "I'm sorry, I encountered an error. Please try again.", isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [memory]);

  return (
    <ChatContext.Provider value={{
      isOpen,
      messages,
      memory,
      isLoading,
      openChat,
      closeChat,
      sendMessage,
      clearMessages,
      updateMemory,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

 