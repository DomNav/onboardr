import { ChatMemory } from '../contexts/ChatContext';
import { AppContext } from '../hooks/useAIAssistant';

export interface AIResponse {
  content: string;
  confidence: number;
  processingTime: number;
  tokensUsed?: number;
}

export interface AISystemPrompt {
  role: 'system';
  content: string;
}

export interface AIUserMessage {
  role: 'user';
  content: string;
}

export interface AIAssistantMessage {
  role: 'assistant';
  content: string;
}

export type AIMessage = AISystemPrompt | AIUserMessage | AIAssistantMessage;

export class AIService {
  private static instance: AIService;
  private apiKey?: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions'; // Default to OpenAI

  private constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private createSystemPrompt(appContext: AppContext, memory: ChatMemory): string {
    return `You are an AI assistant for the Onboardr app, a DeFi platform built on Stellar. Your role is to help users navigate the app and understand its features.

**App Context:**
- Current page: ${appContext.currentPage}
- Available tokens: ${appContext.availableTokens.join(', ')}
- Available pools: ${appContext.availablePools.join(', ')}

**User Memory:**
- Last visited token: ${memory.lastVisitedToken || 'None'}
- Favorite currencies: ${memory.favoriteCurrencies?.join(', ') || 'None'}
- Search history: ${memory.searchHistory?.slice(-3).join(', ') || 'None'}

**Available Pages:**
- Home: Main dashboard
- Portfolio: User's token holdings and performance
- Currencies: Token prices, volumes, and market data
- Pools: Soroswap liquidity pools with APRs
- Markets: Market trends and analysis
- Stocks: Stock market data
- Global: Overall market statistics
- Settings: User preferences

**IMPORTANT RESTRICTIONS:**
- NEVER provide financial advice, investment recommendations, or price predictions
- NEVER suggest buying or selling specific tokens
- NEVER make market predictions or forecasts
- Focus on helping users navigate the app and understand features
- If asked for financial advice, politely decline and suggest consulting a financial advisor

**Your Capabilities:**
- Help users navigate to different pages
- Explain app features and functionality
- Provide information about tokens and pools
- Answer questions about DeFi concepts
- Remember user preferences and recent activity

**Response Style:**
- Be helpful, friendly, and concise
- Use the app context to provide relevant information
- Reference the user's memory when appropriate
- Always maintain the restriction on financial advice

Respond to the user's question while following these guidelines.`;
  }

  public async generateResponse(
    userMessage: string,
    appContext: AppContext,
    memory: ChatMemory,
    messageHistory: AIMessage[] = []
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // For now, use the local response generation
      // TODO: Replace with actual AI API call
      const response = await this.generateLocalResponse(userMessage, appContext, memory);
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: response,
        confidence: 0.9, // High confidence for local responses
        processingTime,
        tokensUsed: userMessage.length + response.length // Rough estimate
      };
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async generateLocalResponse(
    userMessage: string,
    appContext: AppContext,
    memory: ChatMemory
  ): Promise<string> {
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

    // Context-aware responses
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('performance')) {
      return `You can view your portfolio performance on the Portfolio page. It shows your token holdings, recent transactions, and performance metrics. You're currently on the ${appContext.currentPage} page. Would you like me to help you navigate to the Portfolio page?`;
    }
    
    if (lowerMessage.includes('soroswap') && (lowerMessage.includes('apr') || lowerMessage.includes('pool'))) {
      return `You can find Soroswap pool APRs on the Pools page. The pools are sorted by APR, so you can easily see which ones offer the best yields. Available pools include: ${appContext.availablePools.slice(0, 5).join(', ')}... Would you like me to show you how to navigate there?`;
    }
    
    if (lowerMessage.includes('xlm') || lowerMessage.includes('stellar')) {
      return `XLM (Stellar Lumens) information can be found on the Currencies page. You'll see current price, volume, and market data. You can also search for specific tokens using the search bar. You're currently on the ${appContext.currentPage} page.`;
    }
    
    if (lowerMessage.includes('defindex')) {
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
      const pages = ['portfolio', 'currencies', 'pools', 'markets', 'stocks', 'global', 'settings'];
      const requestedPage = pages.find(page => lowerMessage.includes(page));
      
      if (requestedPage) {
        return `You can navigate to the ${requestedPage.charAt(0).toUpperCase() + requestedPage.slice(1)} page using the sidebar menu. You're currently on the ${appContext.currentPage} page.`;
      }
    }

    // Default response with context
    return `I understand you're asking about "${userMessage}". I'm here to help you navigate the Onboardr app and explain its features. You're currently on the ${appContext.currentPage} page. Could you be more specific about what you'd like to know? I can help with navigation, token information, pool details, and feature explanations.`;
  }

  // Future method for real AI API integration
  private async callAIAPI(messages: AIMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI API key not configured');
    }

    // This would be implemented with actual AI API calls
    // For now, return a placeholder
    throw new Error('AI API integration not yet implemented');
  }
}

export const aiService = AIService.getInstance(); 