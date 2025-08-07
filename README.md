# Onboardr - AI-Powered DeFi Assistant for Stellar

**Onboardr** is an innovative DeFi application that enhances the user experience through natural language interaction. Built for the Stellar Hacks: Swaps and Vaults hackathon, it seamlessly integrates with Soroswap and Defindex protocols through an AI assistant named Soro, making DeFi more accessible and intuitive.

## 🎬 Demo & Links

- **Demo Video**: [Coming Soon](#) *(5-minute walkthrough showcasing features)*
- **GitHub**: [https://github.com/DomNav/onboardr](https://github.com/DomNav/onboardr)

## 🎯 Project Vision

Soroswap and Defindex have built powerful DeFi infrastructure on Stellar. Onboardr enhances these protocols by adding a conversational layer that makes their features more accessible. Users can interact naturally - simply type "swap 100 xlm for usdc" or "show me the highest APY vaults" to execute complex DeFi operations.

## ✅ Working Features

- 🤖 **Soro AI Assistant** - Natural language processing for swaps, metrics, and trading
- 💱 **Multi-Swap Queue** - Batch multiple swaps: "swap 100 xlm for usdc and 300 aqua to yxlm"
- 📊 **Defindex Analytics** - Real-time vault metrics, APY tracking, TVL monitoring
- 🎨 **Theme System** - Dark/light mode with smooth transitions
- 👛 **Wallet Integration** - Freighter & LOBSTR support with connection status
- 📈 **Trade History** - Track all your swaps and transactions
- ⚡ **Real-time Updates** - Live price streaming and trade monitoring

## 🚀 Hackathon Submission Status

### Completed Features
- ✅ Natural language swap execution through Soro AI
- ✅ Integration with Soroswap for token swaps
- ✅ Defindex vault analytics dashboard
- ✅ Multi-swap queueing system
- ✅ Real-time price streaming
- ✅ Responsive UI with theme switching
- ✅ Wallet connection management

### In Progress / Roadmap
- 🔄 Profile NFT minting system (soul-bound NFTs for identity)
- 🔄 Orchestration system for autonomous vault deposits
- 🔄 Enhanced AI memory with user preferences
- 🔄 Full vault interaction (deposits/withdrawals)
- 🔄 Portfolio tracking and P&L calculations
- 🔄 Custom alerts and notifications

## Profile-NFT Identity System (Roadmap)

Onboardr uses **soul-bound "Profile-NFT"** to unlock Soro AI and provide stable memory anchoring via `vectorKey`.

### Flow
1. **User connects Freighter** → API checks ownership via `/api/profile/owns/:address`
2. **No NFT** → Mint wizard appears (gas sponsored, costs 0 XLM)
3. **Soro chat backend** → Resolves `vectorKey` from NFT metadata  
4. **MCP vector store** → Persists per-user context and conversation history

### Contract Architecture
- **Location**: `contracts/profile_nft/` 
- **Deployment**: `scripts/deploy_profile_nft.ts`
- **Features**: Soul-bound (no transfer), metadata storage, gasless minting
- **Metadata Schema**:
  ```json
  {
    "name": "display name",
    "avatar": "data:image/svg+xml;base64,..  or ipfs://...",
    "fiat": "USD|CAD|EUR",
    "risk": "conservative|balanced|aggressive", 
    "vectorKey": "uuid-from-backend"
  }
  ```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm
- Stellar wallet (Freighter or LOBSTR)

### Wallets
See [docs/wallets.md](./docs/wallets.md) for wallet connection and troubleshooting tips.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd onboardr

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Stellar Network Configuration
STELLAR_NETWORK=testnet
PROFILE_NFT_CONTRACT_ADDRESS=C...
SPONSOR_SECRET_KEY=S...

# AI Integration  
OPENAI_API_KEY=sk-...

# IPFS Storage (for Profile NFT metadata)
NFT_STORAGE_TOKEN=your_nft_storage_token_here

# Optional: IPFS configuration
IPFS_GATEWAY_URL=https://gateway.nftstorage.link
```

### Dev Setup (Testnet)

For development on Stellar testnet with graceful fallbacks:

#### 1. Generate and Fund Sponsor Account

```bash
# Generate a new Stellar keypair for sponsoring transactions
node -e "
const { Keypair } = require('stellar-sdk');
const keypair = Keypair.random();
console.log('SPONSOR_SECRET_KEY=' + keypair.secret());
console.log('SPONSOR_PUBLIC_KEY=' + keypair.publicKey());
"
```

#### 2. Fund the Sponsor Account

Visit [Stellar Friendbot](https://friendbot.stellar.org) and fund your sponsor account:
```
https://friendbot.stellar.org?addr=YOUR_SPONSOR_PUBLIC_KEY
```

#### 3. Configure Environment

Create `apps/web/.env.local` with testnet configuration:

```env
# Network Configuration  
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Sponsor Account (from step 1)
SPONSOR_SECRET_KEY=S...
SPONSOR_PUBLIC_KEY=G...

# Optional: For full functionality
OPENAI_API_KEY=sk-...           # For AI chat features
DUNE_API_KEY=...               # For live market data
NFT_STORAGE_TOKEN=...          # For IPFS metadata uploads

# Development will work without these - graceful fallbacks are built-in
```

#### 4. Start Development Server

```bash
# Install dependencies
pnpm install

# Start with development stubs enabled
pnpm dev
```

#### Development Mode Features

When running in development (`NODE_ENV !== 'production'`), the application includes several graceful fallbacks:

- **Market Data API**: Returns zeroed data with 200 status when Dune/Graph APIs fail
- **Health API**: Treats missing environment variables as warnings, not failures
- **Profile NFT Minting**: Returns mock results when sponsor keys are missing
- **Balance API**: Shows mock balance data when Horizon is unavailable
- **Graph Components**: Display friendly "placeholder data" messages when data is zero

Look for the 🔥 **Mock** or **Development Mode** indicators in the UI.

### Production Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Deploy Profile NFT contract
pnpm deploy:profile-nft
```

## Project Structure

```
├── apps/web/                    # Next.js frontend application
│   ├── src/app/api/profile/     # Profile NFT API endpoints
│   ├── src/components/          # React components
│   ├── src/store/              # Zustand state management
│   └── src/lib/                # Utilities and helpers
├── contracts/profile_nft/       # Soroban smart contract
├── scripts/                    # Deployment and utility scripts
└── docs/                       # Documentation
```

## API Endpoints

### Profile NFT APIs
- `POST /api/profile/mint` - Prepare mint transaction XDR
- `GET /api/profile/owns/:address` - Check NFT ownership (cached 30s)

### Chat API
- `POST /api/chat` - Soro AI chat with NFT gating and MCP memory

## Development Conventions

### Profile-NFT System
- **Soul-bound NFT** ⇒ no transfer or burn endpoints
- `vectorKey` is the single source-of-truth for AI memory
- Always mock IPFS in unit tests (`src/lib/testUtils.ts`)
- Gasless minting via sponsor pattern (users pay 0 XLM)

### Testing
```bash
# Run unit tests
pnpm test

# Run integration tests (requires testnet)
pnpm test:integration

# Run contract tests  
cd contracts/profile_nft && cargo test
```

## Deployment

### 1. Deploy Profile NFT Contract

```bash
# Set environment variables
export DEPLOYER_SECRET_KEY="S..."
export SPONSOR_SECRET_KEY="S..."  # Can be same as deployer

# Deploy to testnet
pnpm deploy:profile-nft

# Contract address will be saved to deployments/profile_nft_testnet.json
```

### 2. Configure IPFS Storage

Get an API token from [NFT.Storage](https://nft.storage) and add it to your environment:

```bash
# Get free API token from https://nft.storage
NFT_STORAGE_TOKEN=your_token_here
```

The app will automatically fall back to mock IPFS uploads if no token is configured (useful for development).

### 3. Deploy Frontend

```bash
# Build application
pnpm build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`) 
5. Open a Pull Request

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives  
- **State Management**: Zustand (migrating from React Context)
- **Blockchain**: Stellar SDK, Soroban smart contracts
- **AI Integration**: OpenAI API with MCP vector stores
- **Testing**: Jest, React Testing Library

## License

This project is licensed under the MIT License - see the LICENSE file for details. 