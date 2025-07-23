# Onboardr Code Summary

A React/Vite DeFi application with comprehensive trading dashboard, token management, and AI chat assistance.

## Root Configuration Files

- `package.json` - Project dependencies and scripts for React/Vite app with extensive UI libraries
- `vite.config.ts` - Vite configuration with React SWC plugin and path aliases
- `tailwind.config.ts` - Custom Tailwind configuration with Soroswap-themed colors and animations
- `tsconfig.json` - TypeScript configuration with path aliases and relaxed type checking
- `components.json` - Shadcn/ui configuration for component generation
- `eslint.config.js` - ESLint configuration for code quality
- `postcss.config.js` - PostCSS configuration for Tailwind processing
- `index.html` - Main HTML entry point for the Vite application

## src/

### Root Files
- `main.tsx` - React application entry point with root rendering
- `App.tsx` - Main app component with routing, providers, and route definitions
- `index.css` - Global styles with Soroswap-themed CSS variables and glassmorphism effects
- `App.css` - Basic app-specific styles

### pages/
- `Index.tsx` - Home page that renders the main Dashboard component
- `Stocks.tsx` - DeFi pools page displaying pool cards, charts, and TVL/APR metrics
- `Markets.tsx` - Market overview page with indices data and quick stats
- `Currencies.tsx` - Token management page with watchlist, filtering, and table/card views
- `Global.tsx` - Global markets overview with regional breakdowns and economic calendar
- `Portfolio.tsx` - Portfolio management with pie charts, holdings table, and performance tracking
- `Profile.tsx` - User profile management with wallet integration and preferences
- `Settings.tsx` - Multi-section settings page with account, notifications, and security options
- `NotFound.tsx` - Simple 404 error page component

### contexts/
- `ChatContext.tsx` - React context for AI chat with message management and localStorage integration
- `SearchContext.tsx` - React context wrapper for search functionality across the application

### hooks/
- `useAIAssistant.ts` - Custom hook for AI chat responses with financial advice restrictions
- `useSearch.ts` - Search functionality hook for tokens, pools, and protocols with filtering
- `useTokens.ts` - Token management hook with watchlist functionality and price simulation
- `use-mobile.tsx` - Hook for mobile device detection
- `use-toast.ts` - Toast notification hook

### lib/
- `utils.ts` - Utility functions including className merging helper

### utils/
- `aiService.ts` - AI service class for chat functionality with financial advice restrictions
- `mockPoolData.ts` - Mock DeFi pool data with real-time updates and TVL/APR tracking
- `stocksApi.ts` - Mock stock market data including indices, currencies, and news
- `tokenData.ts` - Mock cryptocurrency token data with watchlist management

### components/layout/
- `Dashboard.tsx` - Main dashboard with stats cards, pool performance, and quick actions
- `PageLayout.tsx` - Reusable page layout wrapper with sidebar and navbar integration
- `Navbar.tsx` - Navigation bar component
- `Sidebar.tsx` - Sidebar navigation component

### components/chat/
- `ChatAssistant.tsx` - Main chat component combining floating button and modal
- `ChatModal.tsx` - Chat modal dialog component
- `FloatingChatButton.tsx` - Floating chat button UI element

### components/currencies/
- `CurrencyExchange.tsx` - Currency exchange interface component
- `TokenCard.tsx` - Individual token card display component
- `TokenTable.tsx` - Token table display component

### components/stocks/
- `PoolCard.tsx` - DeFi pool card component with metrics display
- `Sparkline.tsx` - Price sparkline chart component
- `StockCard.tsx` - Stock display card component
- `Stockchart.tsx` - Stock chart visualization component

### components/markets/
- `marketoverview.tsx` - Market overview component with aggregate data

### components/news/
- `NewsCard.tsx` - News article card component

### components/theme/
- `theme-provider.tsx` - Theme context provider for dark/light mode
- `animated-theme-toggle.tsx` - Animated theme toggle component
- `simple-theme-toggle.tsx` - Simple theme toggle component
- `standalone-theme-toggle.tsx` - Standalone theme toggle component
- `theme-toggle.tsx` - Main theme toggle component

### components/ui/
- `StatsCard.tsx` - Statistics display card component
- `accordion.tsx` - Collapsible accordion UI component
- `alert-dialog.tsx` - Modal alert dialog component
- `alert.tsx` - Alert notification component
- `avatar.tsx` - User avatar display component
- `badge.tsx` - Badge/tag display component
- `button.tsx` - Customizable button component
- `card.tsx` - Card container component
- `chart.tsx` - Chart wrapper component
- `dialog.tsx` - Modal dialog component
- `form.tsx` - Form wrapper and validation components
- `input.tsx` - Text input field component
- `select.tsx` - Dropdown select component
- `table.tsx` - Data table component
- `tabs.tsx` - Tabbed interface component
- `toast.tsx` - Toast notification component
- ... (and many other shadcn/ui components)

## Key Features

- **DeFi Focus**: Token management, pool analytics, TVL tracking, APR calculations
- **AI Integration**: Context-aware chat assistant with financial advice restrictions  
- **Real-time Data**: Simulated live updates for prices, pools, and market data
- **Dark/Light Theme**: Comprehensive theming with Soroswap-inspired design
- **Responsive Design**: Mobile-first approach with extensive Tailwind customization
- **Type Safety**: Full TypeScript implementation with interface definitions

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom Soroswap theme
- **UI Components**: Radix UI primitives with shadcn/ui
- **Routing**: React Router DOM
- **State**: React Context + hooks pattern
- **Charts**: Recharts for data visualization