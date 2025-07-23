# Onboarding: Watchlist Toggle & Gold Badge Implementation

## Task Overview
Implement watchlist toggle functionality with gold badge indicator using Zustand store for state management and localStorage persistence.

## Current State Analysis

### Documentation Review

#### From CODE_SUMMARY.md
- React/Vite app with TypeScript, Tailwind CSS, shadcn/ui components
- Current state management uses React Context + hooks pattern
- Token management exists in `src/hooks/useTokens.ts` and `src/utils/tokenData.ts`
- TokenTable and TokenCard components already exist in `src/components/currencies/`

#### From PRODUCT_BRIEF.md
- **Key MVP Feature**: Watchlist Toggle & Gold Badge System
- Smart watchlist with persistent storage
- Gold badge recognition for premium/featured tokens
- Real-time updates for watchlisted assets
- Current state management to migrate from React Context to Zustand

#### From TODO.md
- P1 Sprint 0 includes watchlist toggle implementation (#watchlist)
- State management migration to Zustand is P2 priority
- Current React Context implementation needs replacement

### Current Implementation

#### TokenTable Component (`src/components/currencies/TokenTable.tsx`)
- **Star Toggle**: Already implemented with `Star` icon from lucide-react
- **Props**: Takes `watchedTokens: string[]` and `onToggleWatch: (symbol: string) => void`
- **UI**: Uses yellow-400 color for filled star, hover states implemented
- **Tooltip**: Shows "Add to Watchlist"/"Remove from Watchlist"
- **Location**: Column 1 of grid layout (dedicated watch button column)

#### TokenCard Component (`src/components/currencies/TokenCard.tsx`)
- **Star Toggle**: Similar implementation to TokenTable
- **Props**: Takes `isWatched: boolean` and `onToggleWatch: (symbol: string) => void`
- **UI**: Positioned in top-right corner with tooltip
- **Size**: Uses h-5 w-5 star (slightly larger than table version)

#### Current State Management (`src/hooks/useTokens.ts`)
- **Hook-based**: Uses React hooks with localStorage persistence
- **Functions**: `toggleWatchToken`, `getWatchedTokens`
- **Storage**: Utilizes `getWatchlistFromStorage()` and `saveWatchlistToStorage()`
- **State**: `watchedTokens: string[]` array

#### Data Layer (`src/utils/tokenData.ts`)
- **Storage Functions**: `getWatchlistFromStorage()`, `saveWatchlistToStorage()`, `toggleWatchlistToken()`
- **LocalStorage Key**: `'token-watchlist'`
- **Data Format**: JSON array of token symbols
- **SSR Safety**: Checks for `typeof window === 'undefined'`

### Dependencies Analysis

#### Zustand Installation Status
- **NOT INSTALLED**: Zustand is not present in package.json dependencies
- **Need to Install**: `npm install zustand` or `pnpm add zustand`

#### UI Components Available
- **Badge Component**: Located at `src/components/ui/badge.tsx`
- **Variants**: default, secondary, destructive, outline
- **Current Usage**: TokenTable uses Badge for token type and platform
- **Gold Badge**: No existing gold/star variant - needs custom styling

### Technical Requirements

#### Zustand Store Design
```typescript
interface WatchlistState {
  watchedTokens: string[]
  addToWatchlist: (symbol: string) => void
  removeFromWatchlist: (symbol: string) => void
  toggleWatchlistToken: (symbol: string) => void
  isTokenWatched: (symbol: string) => boolean
  getWatchedTokens: () => string[]
}
```

#### Gold Badge Requirements
- **Visual**: Gold star (★) badge using shadcn Badge component
- **Color**: Gold/yellow theme (likely yellow-400/yellow-500)
- **Position**: Near token symbol/name in both TokenTable and TokenCard
- **Condition**: Show only when `isTokenWatched(symbol) === true`

#### Testing Requirements
- Unit tests for Zustand store actions
- LocalStorage persistence verification
- Component integration tests for toggle functionality

## Implementation Gaps

### Missing Components
1. **Zustand Store**: Need to create `useWatchlistStore` hook
2. **Gold Badge**: Need custom badge variant or styling for gold star
3. **Package Dependency**: Zustand needs to be installed
4. **Migration Logic**: Transition from existing React Context to Zustand
5. **Test Suite**: Unit tests for new store and components

### Migration Strategy
1. Install Zustand dependency
2. Create new Zustand store alongside existing hooks
3. Update TokenTable and TokenCard to use new store
4. Add gold badge rendering logic
5. Remove old React Context implementation
6. Add comprehensive test coverage

## Risk Assessment

### Low Risk
- Existing UI components are well-structured and easily modifiable
- LocalStorage logic is already implemented and working
- Star toggle UX is already established

### Medium Risk
- State migration needs careful coordination to avoid breaking existing functionality
- Gold badge styling needs to integrate well with existing Soroswap theme

### Dependencies
- Zustand installation required before implementation
- May need to add testing utilities (Jest, React Testing Library) if not present

## Next Steps
1. Install Zustand dependency
2. Create Zustand store with localStorage persistence
3. Add gold badge styling/variant to Badge component
4. Update both TokenTable and TokenCard components
5. Implement comprehensive test suite
6. Remove deprecated React Context implementation

## Files to Modify
- `package.json` - Add Zustand dependency
- `src/stores/` - New directory for Zustand stores
- `src/stores/useWatchlistStore.ts` - New Zustand store
- `src/components/ui/badge.tsx` - Add gold variant
- `src/components/currencies/TokenTable.tsx` - Add gold badge, use Zustand
- `src/components/currencies/TokenCard.tsx` - Add gold badge, use Zustand
- `src/hooks/useTokens.ts` - Remove watchlist logic (optional cleanup)
- `src/utils/tokenData.ts` - Keep storage utilities
- Test files for new store and updated components