# Onboardr Project Guide

**Onboardr** is a modern React/Vite DeFi application featuring a comprehensive trading dashboard with token management, pool analytics, and AI chat assistance. Built with TypeScript and Tailwind CSS, it provides a sophisticated user experience for decentralized finance operations.

## Documentation Links

- [Code Summary](./CODE_SUMMARY.md) - Comprehensive overview of all source files and their purposes
- [Product Brief](./PRODUCT_BRIEF.md) - Product requirements and specifications
- [TODO](./TODO.md) - Current tasks and development priorities

## Development Conventions

### UI & Styling
- **Component Library**: shadcn/ui + Radix UI primitives for consistent, accessible components
- **Styling**: Tailwind CSS with extensive custom configuration
- **Color Tokens**: Defined in `tailwind.config.ts` using CSS custom properties (`--variable` pattern)
  - Colors use HSL format: `hsl(var(--primary))`
  - Soroswap-themed gradients and custom shadows included
  - Dark/light mode support via CSS variables
- **Theme System**: CSS custom properties in `src/index.css` with Tailwind extensions

### State Management
- **Preferred**: Zustand for application state management
- **Current**: React Context + hooks pattern (legacy, to be migrated)
- **Forms**: React Hook Form with validation

### Development Workflow
- **Planning**: Always confirm implementation plan before making edits
- **Diffs**: Output unified diffs when showing code changes
- **Testing**: Unit test duty required when logic changes are made
- **Commits**: Use Conventional Commit style (feat:, fix:, chore:, docs:, etc.)

### Code Standards
- **TypeScript**: Full type safety with interface definitions
- **ESLint**: Code quality enforcement via `eslint.config.js`
- **File Structure**: Feature-based organization under `src/components/`
- **Imports**: Use path aliases configured in `tsconfig.json`

### Architecture Patterns
- **Components**: Functional components with hooks
- **Routing**: React Router DOM for client-side navigation
- **API**: Mock data services in `src/utils/` (future: real API integration)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography

## Key Features
- DeFi pool analytics with TVL/APR tracking
- Token management with watchlist functionality
- AI chat assistant with financial context
- Real-time price simulation and updates
- Responsive design with mobile-first approach
- Dark/light theme with custom Soroswap styling

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **State**: React Context (migrating to Zustand)
- **Build**: Vite with SWC compilation
- **Package Manager**: pnpm