# Currencies Page - Soroswap & DeFindex Token Dashboard

## Overview
The Currencies page displays all actively listed tokens available on **Soroswap** and **DeFindex** as of **July 2025**. It provides a comprehensive view of token prices, performance metrics, and user personalization features.

## Features

### 📊 Token Data Display
- **Token Symbol & Name**: Clear identification of each token
- **Current Price (USD)**: Real-time price display with proper formatting
- **24h Price Change**: Percentage and absolute value changes with color coding
- **Market Cap**: Formatted display (K, M, B suffixes)
- **Volume (24h)**: Trading volume information
- **Token Type Badges**:
  - 🔵 **Stablecoin** (blue) - USDC, USDT, xUSDL
  - 🟢 **Native Token** (green) - SORO, DFX, ETH, BTC
  - ⚫ **Other/Volatile** (gray) - LINK, UNI, AAVE, COMP
- **Platform Badges**: Shows if token is available on Soroswap, DeFindex, or both
- **Last Updated Timestamp**: Real-time update indicators

### 🎯 Watchlist Functionality
- **Star Icon Toggle**: Add/remove tokens from personal watchlist
- **localStorage Persistence**: Watchlist persists across browser sessions
- **Dedicated Watchlist Section**: Shows only watched tokens at the top
- **Tooltip Hints**: "Add to Watchlist" / "Remove from Watchlist" on hover

### 📈 Interactive Features
- **Live Price Updates**: Simulated price movements every 10 seconds
- **Sparkline Charts**: 7-day price trend visualization for each token
- **Dual View Modes**:
  - 📋 **Table View**: Compact, sortable data display
  - 🃏 **Card View**: Visual cards with sparklines and detailed info

### 🔍 Search & Filtering
- **Search Bar**: Find tokens by symbol or name
- **Type Filter**: Filter by Stablecoin, Native Token, or Other/Volatile
- **Platform Filter**: Filter by Soroswap, DeFindex, or Both
- **Real-time Filtering**: Instant results as you type/select

### 📊 Summary Statistics
- **Total Market Cap**: Aggregated market capitalization
- **24h Volume**: Total trading volume across all tokens
- **Gainers/Losers Count**: Number of tokens with positive/negative changes

## Mock Data (July 2025)

### Stablecoins
| Symbol | Name | Price | 24h Δ | Market Cap |
|--------|------|-------|-------|------------|
| USDC | USD Coin | $1.00 | +0.01% | $32B |
| USDT | Tether | $1.00 | -0.02% | $95B |
| xUSDL | Synthetic USD | $1.00 | +0.05% | $850M |

### Native Tokens
| Symbol | Name | Price | 24h Δ | Market Cap |
|--------|------|-------|-------|------------|
| SORO | Soroswap Token | $0.57 | +2.1% | $28.5M |
| DFX | Defindex Token | $1.38 | -0.6% | $69M |
| ETH | Ethereum | $3,237 | -0.85% | $389B |
| BTC | Bitcoin | $43,251 | +0.29% | $850B |

### Other/Volatile Tokens
| Symbol | Name | Price | 24h Δ | Market Cap |
|--------|------|-------|-------|------------|
| LINK | Chainlink | $18.45 | +3.76% | $10.8B |
| UNI | Uniswap | $12.34 | -1.83% | $7.4B |
| AAVE | Aave | $245.67 | +3.56% | $3.6B |
| COMP | Compound | $67.89 | -1.78% | $680M |

## Technical Implementation

### File Structure
```
src/
├── pages/
│   └── Currencies.tsx          # Main page component
├── components/
│   └── currencies/
│       ├── TokenCard.tsx       # Individual token card
│       └── TokenTable.tsx      # Token table component
├── hooks/
│   └── useTokens.ts           # Token data management hook
└── utils/
    └── tokenData.ts           # Token data and utilities
```

### Key Components

#### `TokenCard.tsx`
- Displays individual token information in card format
- Includes sparkline chart for 7-day price trend
- Watchlist toggle with star icon
- Responsive design with hover effects

#### `TokenTable.tsx`
- Tabular display of all token data
- Sortable columns and hover effects
- Platform badges and type indicators
- Compact view for large datasets

#### `useTokens.ts`
- Custom hook for token data management
- localStorage integration for watchlist
- Simulated live price updates
- Search and filtering utilities

#### `tokenData.ts`
- Token interface definitions
- Mock data for July 2025
- Utility functions for formatting
- Watchlist storage functions

### Styling
- **Consistent with Onboardr Dashboard**: White cards, clean spacing, modern icons
- **Color-coded Elements**: Green for gains, red for losses, blue for stablecoins
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Hover Effects**: Interactive elements with smooth transitions
- **Badge System**: Rounded pills for token types and platforms

### Performance Features
- **Memoized Filtering**: Efficient search and filter operations
- **Optimized Re-renders**: Only updates changed components
- **Debounced Search**: Smooth search experience
- **Lazy Loading**: Components load as needed

## User Experience

### Interactive Elements
- **Star Icons**: Click to add/remove from watchlist
- **View Toggle**: Switch between table and card views
- **Search Bar**: Real-time token search
- **Filter Dropdowns**: Quick filtering by type and platform
- **Hover Effects**: Visual feedback on interactive elements

### Accessibility
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: High contrast ratios for readability
- **Tooltips**: Helpful hints for user actions

### Mobile Responsiveness
- **Adaptive Layout**: Cards stack on mobile, table scrolls horizontally
- **Touch-friendly**: Large touch targets for mobile users
- **Responsive Grid**: Adjusts columns based on screen size
- **Mobile-optimized**: Simplified view on smaller screens

## Future Enhancements
- Real API integration with Soroswap and DeFindex
- Advanced sorting and filtering options
- Price alerts and notifications
- Portfolio tracking integration
- Historical price charts
- Social sentiment indicators
- Trading volume analytics 