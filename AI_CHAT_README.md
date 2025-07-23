# Onboardr AI Chat Assistant

A floating AI chat assistant for the Onboardr DeFi platform, built with React, TypeScript, and TailwindCSS.

## 🚀 Features

### Core Functionality
- **Floating Chat Button**: Positioned in bottom-right corner with Soroswap brand styling
- **Modal Chat Interface**: Clean, responsive chat modal with message history
- **Context-Aware Responses**: AI understands app structure and user context
- **Memory Persistence**: Remembers user preferences and conversation history
- **Financial Advice Protection**: Blocks investment advice and price predictions

### UI/UX Features
- **Dark/Light Mode Support**: Consistent styling across themes
- **Smooth Animations**: Floating button with gentle animations
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Visual feedback during AI processing
- **Message History**: Scrollable conversation history with timestamps

### AI Capabilities
- **Navigation Help**: Guide users to different app pages
- **Feature Explanation**: Explain app functionality and DeFi concepts
- **Token Information**: Provide details about tokens and pools
- **Context Memory**: Remember user preferences and recent activity
- **Smart Responses**: Context-aware based on current page and user history

## 🏗️ Architecture

### Components Structure
```
src/
├── components/
│   └── chat/
│       ├── ChatAssistant.tsx      # Main component
│       ├── FloatingChatButton.tsx # Floating button
│       └── ChatModal.tsx          # Chat interface
├── contexts/
│   └── ChatContext.tsx            # State management
├── hooks/
│   └── useAIAssistant.ts          # AI logic
└── utils/
    └── aiService.ts               # AI service layer
```

### Key Components

#### ChatAssistant.tsx
Main component that combines the floating button and modal.

#### FloatingChatButton.tsx
- Positioned fixed in bottom-right corner
- Soroswap gradient styling with glow effects
- Notification indicator for unread messages
- Smooth hover and click animations

#### ChatModal.tsx
- Dialog-based chat interface
- Message history with user/assistant avatars
- Real-time typing indicators
- Input field with send button
- Clear conversation functionality

#### ChatContext.tsx
- Global state management for chat
- Message history and memory persistence
- LocalStorage integration for MCP-like memory
- Loading states and error handling

#### useAIAssistant.ts
- AI response generation logic
- Context-aware response patterns
- Financial advice detection
- App context integration

#### aiService.ts
- Service layer for AI integration
- Prepared for OpenAI/Claude API integration
- System prompt management
- Response confidence scoring

## 🧠 Memory System (MCP-like)

The assistant implements a memory system similar to Model Context Protocol:

### Memory Types
```typescript
interface ChatMemory {
  lastVisitedToken?: string;        // Last token user asked about
  favoriteCurrencies?: string[];    // User's favorite tokens
  dismissedTips?: string[];         // Tips user has dismissed
  searchHistory?: string[];         // Recent search queries
  userPreferences?: Record<string, any>; // User preferences
}
```

### Memory Features
- **Persistent Storage**: Saved to localStorage
- **Context Awareness**: Used in AI responses
- **Search History**: Tracks recent queries
- **User Preferences**: Remembers user choices

## 🛡️ Security & Restrictions

### Financial Advice Protection
The AI assistant is designed to **never** provide:
- Investment recommendations
- Price predictions or forecasts
- Buy/sell signals
- Financial advice
- Market predictions

### Detection Patterns
```typescript
const financialAdvicePatterns = [
  /\b(should|would|could)\s+(i|you)\s+(buy|sell|invest|trade)\b/i,
  /\b(is|are)\s+(it|they)\s+(a\s+)?good\s+investment\b/i,
  /\b(price|market)\s+(prediction|forecast|outlook)\b/i,
  /\b(financial|investment|trading)\s+advice\b/i,
  /\b(buy|sell)\s+(signal|recommendation)\b/i,
  /\b(profit|loss)\s+(prediction|forecast)\b/i
];
```

## 🎨 Styling

### Soroswap Brand Colors
- **Primary**: Purple/violet gradients
- **Accent**: Soft violet tones
- **Dark Mode**: Deep blue/purple with neon accents
- **Light Mode**: Soft violet/pink gradients

### Animations
- `animate-float-gentle`: Floating button animation
- `animate-pulse-gentle`: Notification indicator
- `animate-slide-up`: Message appearance
- `animate-gradient-shift`: Background effects

### CSS Classes
```css
/* Floating button */
.shadow-soroswap-glow
.hover:shadow-soroswap-hover
.bg-gradient-to-br from-primary to-accent

/* Modal styling */
.shadow-soroswap-dark
.dark:shadow-soroswap-light
.bg-gradient-to-b from-background to-muted/20
```

## 🔧 Usage

### Basic Implementation
```tsx
import { ChatProvider } from './contexts/ChatContext';
import { ChatAssistant } from './components/chat/ChatAssistant';

function App() {
  return (
    <ChatProvider>
      {/* Your app content */}
      <ChatAssistant />
    </ChatProvider>
  );
}
```

### Using the Chat Context
```tsx
import { useChatContext } from './contexts/ChatContext';

function MyComponent() {
  const { openChat, sendMessage, memory } = useChatContext();
  
  const handleHelpRequest = () => {
    openChat();
    sendMessage("I need help with the portfolio page");
  };
}
```

## 🚀 AI Integration

### Current Implementation
- Local response generation with pattern matching
- Context-aware responses based on app structure
- Memory integration for personalized responses

### Future AI Integration
The `aiService.ts` is prepared for real AI model integration:

```typescript
// Example OpenAI integration
private async callAIAPI(messages: AIMessage[]): Promise<string> {
  const response = await fetch(this.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Environment Variables
```env
VITE_OPENAI_API_KEY=your_openai_api_key
# or
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

## 📱 Example Use Cases

### Navigation Help
- "Show me my portfolio performance"
- "Where can I find XLM price and volume?"
- "Take me to the Soroswap pools page"

### Feature Explanation
- "What is DeFindex?"
- "How do I use the search feature?"
- "Explain what the Markets page shows"

### Token Information
- "What's the APR for the top Soroswap pools?"
- "Show me available tokens"
- "What's the difference between XLM and USDC?"

## 🔄 Extending the Assistant

### Adding New Response Patterns
1. Update `useAIAssistant.ts` with new patterns
2. Add context-aware logic
3. Update memory if needed

### Custom AI Models
1. Modify `aiService.ts` to use different APIs
2. Update system prompts for new capabilities
3. Add model-specific response handling

### Enhanced Memory
1. Extend `ChatMemory` interface
2. Add new memory update functions
3. Integrate with backend storage

## 🧪 Testing

### Manual Testing
1. Test floating button visibility and positioning
2. Verify modal opens/closes correctly
3. Test message sending and receiving
4. Check financial advice blocking
5. Verify memory persistence

### Example Test Queries
- "Should I buy XLM?" (should be blocked)
- "What's the price of XLM?" (should work)
- "Show me my portfolio" (should work)
- "Predict market trends" (should be blocked)

## 📋 TODO

### Immediate
- [x] Basic chat interface
- [x] Floating button with animations
- [x] Memory system implementation
- [x] Financial advice protection
- [x] Context-aware responses

### Future Enhancements
- [ ] Real AI model integration (GPT-4o/Claude)
- [ ] Voice input/output
- [ ] File/image sharing
- [ ] Advanced memory features
- [ ] Multi-language support
- [ ] Analytics and usage tracking
- [ ] Customizable themes
- [ ] Keyboard shortcuts

## 🤝 Contributing

1. Follow the existing code structure
2. Maintain Soroswap brand styling
3. Add TypeScript types for new features
4. Test financial advice blocking
5. Update documentation

## 📄 License

This AI chat assistant is part of the Onboardr DeFi platform. 