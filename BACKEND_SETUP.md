# Backend Integration Setup

## Overview
The frontend is now wired to the backend API with the following features:

### 1. Vite Proxy Configuration
- Added proxy in `vite.config.ts` to route `/api` requests to `http://localhost:3001`
- Frontend can now make API calls to `/api/soroswap/tvl` which will be proxied to the backend

### 2. React Query Hook
- Created `src/hooks/useSoroswapTvl.ts` for fetching Soroswap TVL data
- Includes automatic refetching every 5 minutes to stay in sync with backend cache
- Proper error handling and loading states

### 3. UI Component
- Created `src/components/soroswap/SoroswapTvlCard.tsx` that displays TVL data
- Integrated into the Soro page stats row
- Shows loading skeleton, error states, and formatted numbers

### 4. Backend Features
- Express server running on port 3001
- Soroswap TVL endpoint with 5-minute caching
- Graceful handling of missing Dune API key (returns mock data)
- Health check endpoint at `/health`

## Getting Started

### 1. Start the Backend
```bash
cd backend
pnpm dev
```

### 2. Start the Frontend
```bash
pnpm dev
```

### 3. Access the Application
- Frontend: http://localhost:8080
- Backend Health: http://localhost:3001/health
- Soroswap TVL API: http://localhost:3001/api/soroswap/tvl

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Optional: Dune API Key for real data
# Get your key from: https://dune.com/settings/api
DUNE_API_KEY=your_dune_api_key_here
```

## API Endpoints

### GET /api/soroswap/tvl
Returns Soroswap TVL and 24h volume data.

**Response:**
```json
{
  "tvl_usd": 1250000,
  "volume_24h": 450000,
  "last_updated": "2025-07-23T18:53:49.479Z",
  "cached": false,
  "cache_hit": false,
  "mock": true,
  "note": "Using mock data - set DUNE_API_KEY for real data"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "onboardr-backend",
  "timestamp": "2025-07-23T18:52:32.553Z",
  "version": "1.0.0"
}
```

## Next Steps

1. **Get a Dune API Key**: Visit https://dune.com/settings/api to get your API key
2. **Update Query ID**: Replace the placeholder `SOROSWAP_QUERY_ID` in `backend/src/routes/soroswap.ts` with the actual Dune query ID for Soroswap data
3. **Add More Endpoints**: Extend the backend with additional DeFi data endpoints
4. **Enhance UI**: Add more components to display volume, APRs, and other metrics

## Development Notes

- The backend uses LRU caching with 5-minute TTL
- Mock data is returned when DUNE_API_KEY is not set
- Frontend automatically refetches data every 5 minutes
- All API calls are proxied through Vite for seamless development 