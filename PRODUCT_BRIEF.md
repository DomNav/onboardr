# Onboardr Product Brief

## Elevator Pitch
**Onboardr** is a dark-theme Stellar DeFi dashboard featuring the official Soroswap color palette and an AI assistant named "Soro". Built for seamless token management, pool analytics, and DeFi interactions on the Stellar network, it combines institutional-grade data visualization with conversational AI to democratize DeFi access for both newcomers and power users.

## Key MVP Features

### 1. Watchlist Toggle & Gold Badge System
- **Smart Watchlist**: One-click token favoriting with persistent storage
- **Gold Badge Recognition**: Premium visual indicators for high-performing or featured tokens
- **Portfolio Integration**: Seamless transition from watchlist to portfolio tracking
- **Real-time Updates**: Live price feeds and alerts for watchlisted assets

### 2. Global Soroswap Color Palette
- **Authentic Branding**: Official Soroswap.finance color scheme integration
- **Dynamic Theming**: Light/dark mode with consistent brand colors via `theme.ts`
- **Accessible Contrast**: WCAG AA compliant color combinations
- **Glassmorphism Effects**: Modern UI with translucent elements and backdrop blur

### 3. Floating Soro Chat Assistant
- **Perplexity-Style Interface**: Elegant floating button expanding to modal dialog
- **MCP-Powered Backend**: Model Context Protocol for advanced AI capabilities
- **DeFi-Specialized**: Financial advice restrictions with context-aware responses
- **Persistent Conversations**: Chat history with localStorage integration

### Optional Enhancements
- **MCP User Memory**: Personalized recommendations based on trading patterns
- **Type-Safe Soroswap API**: Full TypeScript integration with Stellar network
- **Unit Test Scaffold**: Comprehensive testing framework with 90%+ coverage

## Tech Stack & Constraints

### Core Framework
- **Frontend**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite with SWC plugin for optimal performance
- **Routing**: React Router DOM v6 with lazy loading

### Styling & UI
- **CSS Framework**: Tailwind CSS with custom Soroswap configuration
- **Component Library**: Radix UI primitives + shadcn/ui components
- **Theme System**: CSS custom properties with dark/light mode support
- **Icons**: Lucide React with custom DeFi iconography

### State Management & Data
- **State**: React Context + custom hooks pattern (migrate to Zustand for complex state)
- **Charts**: Recharts for responsive data visualization
- **API Layer**: Mock services transitioning to real Stellar Horizon API
- **Caching**: React Query for server state management (planned)

### AI & Backend Integration
- **AI Service**: Custom aiService.ts with MCP protocol support
- **Chat Context**: React Context with message persistence
- **Memory Management**: MCP user memory with wallet-scoped data isolation

### Constraints
- **Bundle Size**: <2MB initial bundle, <500KB per route chunk
- **Performance**: First Contentful Paint <1.5s, Time to Interactive <3s
- **Compatibility**: Modern browsers (ES2020+), mobile-first responsive design
- **Security**: No private key exposure, secure wallet connector integration

## Acceptance Criteria

### Performance Benchmarks
- **Lighthouse Score**: ≥90 across all categories (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Bundle Analysis**: Zero circular dependencies, tree-shaking optimization

### Code Quality
- **TypeScript**: Zero TS errors in strict mode
- **Linting**: ESLint configuration with zero warnings
- **Testing**: Unit tests passing with ≥90% coverage
- **Type Safety**: No `any` types, comprehensive interface definitions

### User Experience
- **Responsive Design**: Seamless experience across mobile, tablet, desktop
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation support
- **Error Handling**: Graceful fallbacks, informative error messages
- **Loading States**: Skeleton screens, progress indicators for async operations

### DeFi Integration
- **Wallet Support**: Freighter, Albedo connector compatibility
- **Transaction Safety**: User confirmation modals, transaction summaries
- **Data Accuracy**: Real-time price feeds, accurate TVL/APR calculations
- **Security**: Input validation, rate limiting, fraud detection

## Design References

### Visual Inspiration
- **Primary**: [Soroswap.finance](https://soroswap.finance) token interface and color palette
- **Secondary**: Perplexity.ai floating chat button and modal interaction patterns
- **Tertiary**: Modern DeFi dashboards (Uniswap v4, Curve.fi) for layout inspiration

### Brand Guidelines
- **Colors**: Soroswap gradient (#7C3AED to #06B6D4) with dark theme variants
- **Typography**: Inter font family for optimal readability
- **Spacing**: 8px grid system with consistent component padding
- **Animations**: Smooth transitions (200-300ms) with respect for `prefers-reduced-motion`

### Component Patterns
- **Cards**: Glassmorphism effect with subtle borders and backdrop blur
- **Buttons**: Gradient backgrounds with hover states and loading spinners  
- **Forms**: Floating labels with real-time validation feedback
- **Charts**: Consistent color mapping with tooltips and responsive breakpoints

## Success Metrics

### User Engagement
- **Chat Interactions**: Average 3+ Soro conversations per session
- **Watchlist Usage**: 80% of users maintain active watchlists
- **Return Visits**: 60% weekly active user retention

### Technical Performance
- **Uptime**: 99.9% availability with <2s response times
- **Error Rate**: <0.1% client-side JavaScript errors
- **Conversion**: Smooth wallet connection flow with 85%+ success rate

### Business Impact
- **Stellar Ecosystem**: Drive adoption of Soroswap and Stellar DeFi protocols
- **User Onboarding**: Reduce time-to-first-transaction by 50%
- **Community Growth**: Foster educational content through Soro AI interactions 