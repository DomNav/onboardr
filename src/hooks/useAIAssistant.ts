import { useCallback } from 'react';
import { ChatMemory } from '../contexts/ChatContext';

export interface AppContext {
  currentPage: string;
  availableTokens: string[];
  availablePools: string[];
  userPreferences: Record<string, any>;
}

export function useAIAssistant() {

  const generateResponse = useCallback(async (
    userMessage: string, 
    appContext: AppContext,
    memory: ChatMemory,
    updateMemory: (updates: Partial<ChatMemory>) => void
  ): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Enhanced financial advice detection
    const financialAdvicePatterns = [
      /\b(should|would|could)\s+(i|you)\s+(buy|sell|invest|trade)\b/i,
      /\b(is|are)\s+(it|they)\s+(a\s+)?good\s+investment\b/i,
      /\b(price|market)\s+(prediction|forecast|outlook)\b/i,
      /\b(financial|investment|trading)\s+advice\b/i,
      /\b(buy|sell)\s+(signal|recommendation)\b/i,
      /\b(profit|loss)\s+(prediction|forecast)\b/i
    ];

    if (financialAdvicePatterns.some(pattern => pattern.test(userMessage))) {
      return "I'm sorry, but I cannot provide financial advice, investment recommendations, or price predictions. I'm designed to help you navigate the Onboardr app and explain features, but I cannot make investment decisions for you. Please consult with a qualified financial advisor for investment advice.";
    }

    // Context-aware responses based on app structure
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('performance')) {
      updateMemory({ lastVisitedToken: 'portfolio' });
      return `You can view your portfolio performance on the Portfolio page. It shows your token holdings, recent transactions, and performance metrics. You're currently on the ${appContext.currentPage} page. Would you like me to help you navigate to the Portfolio page?`;
    }

    if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('wallet')) {
      updateMemory({ lastVisitedToken: 'profile' });
      return `You can manage your profile and view your connected wallet on the Profile page. Here you can customize your display name, set trading preferences, manage favorite tokens, and view wallet information. You're currently on the ${appContext.currentPage} page. Would you like me to help you navigate to the Profile page?`;
    }

    if (lowerMessage.includes('favorite') && lowerMessage.includes('token')) {
      return `You can manage your favorite tokens on the Profile page. This helps you quickly access your preferred tokens throughout the app. Your current favorite tokens are saved in your profile and remembered across sessions.`;
    }
    
    if (lowerMessage.includes('soroswap') && (lowerMessage.includes('apr') || lowerMessage.includes('pool'))) {
      updateMemory({ lastVisitedToken: 'soroswap-pools' });
      return `You can find Soroswap pool APRs on the Pools page. The pools are sorted by APR, so you can easily see which ones offer the best yields. Available pools include: ${appContext.availablePools.slice(0, 5).join(', ')}... Would you like me to show you how to navigate there?`;
    }
    
    if (lowerMessage.includes('xlm') || lowerMessage.includes('stellar')) {
      updateMemory({ lastVisitedToken: 'XLM' });
      return `XLM (Stellar Lumens) information can be found on the Currencies page. You'll see current price, volume, and market data. You can also search for specific tokens using the search bar. You're currently on the ${appContext.currentPage} page.`;
    }
    
    if (lowerMessage.includes('defindex')) {
      updateMemory({ lastVisitedToken: 'DeFindex' });
      return `DeFindex is a decentralized index protocol that provides exposure to various DeFi assets through a single token. You can learn more about it and view its performance on the Markets page. It's designed to simplify DeFi investing by bundling multiple assets.`;
    }

    if (lowerMessage.includes('token') && (lowerMessage.includes('price') || lowerMessage.includes('volume'))) {
      return `Token prices and volumes can be found on the Currencies page. Available tokens include: ${appContext.availableTokens.slice(0, 10).join(', ')}... You can search for specific tokens or browse the full list.`;
    }

    if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
      return `Market trends and analysis can be found on the Markets page. It provides comprehensive market data, charts, and insights for various tokens and pools. You can also check the Global page for overall market statistics.`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you navigate the Onboardr app! Here's what I can do:

• **Navigation**: Help you find specific pages and features
• **Token Information**: Explain tokens, prices, and market data
• **Pool Information**: Show you Soroswap pools and APRs
• **Feature Explanation**: Explain how different parts of the app work
• **Context Awareness**: Remember your preferences and recent activity

Just ask me anything about the app! I'm here to make your experience smoother.`;
    }

    if (lowerMessage.includes('navigate') || lowerMessage.includes('go to') || lowerMessage.includes('find')) {
      const pages = ['portfolio', 'profile', 'currencies', 'pools', 'markets', 'stocks', 'global', 'settings'];
      const requestedPage = pages.find(page => lowerMessage.includes(page));
      
      if (requestedPage) {
        return `You can navigate to the ${requestedPage.charAt(0).toUpperCase() + requestedPage.slice(1)} page using the ${requestedPage === 'profile' ? 'profile dropdown in the navbar' : 'sidebar menu'}. You're currently on the ${appContext.currentPage} page.`;
      }
    }

    // Update memory with search history
    const searchHistory = memory.searchHistory || [];
    if (!searchHistory.includes(userMessage)) {
      updateMemory({ 
        searchHistory: [...searchHistory.slice(-9), userMessage] 
      });
    }

    // Default response with context
    return `I understand you're asking about "${userMessage}". I'm here to help you navigate the Onboardr app and explain its features. You're currently on the ${appContext.currentPage} page. Could you be more specific about what you'd like to know? I can help with navigation, token information, pool details, and feature explanations.`;
  }, []);

  const getAppContext = useCallback((memory: ChatMemory = {}): AppContext => {
    // This would be enhanced with actual app state
    return {
      currentPage: window.location.pathname.slice(1) || 'home',
      availableTokens: ['XLM', 'USDC', 'USDT', 'BTC', 'ETH', 'ADA', 'DOT', 'LINK'],
      availablePools: ['XLM/USDC', 'XLM/USDT', 'BTC/USDC', 'ETH/USDC'],
      userPreferences: memory.userPreferences || {}
    };
  }, []);

  return {
    generateResponse,
    getAppContext
  };
} 