# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solana Wallet Portfolio Analyzer - A comprehensive web application for analyzing multiple Solana wallets simultaneously, providing portfolio insights, NFT burn value calculations, and advanced portfolio management features.

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, App Router
- **UI**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Wallet Integration**: Solana Wallet Adapter
- **Backend**: Supabase
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Blockchain**: Solana Web3.js, Metaplex SDK

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   │   ├── portfolio/     # Portfolio analysis pages
│   │   └── wallets/       # Wallet management pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landing page
│   └── providers.tsx      # Client providers (Wallet, Query, etc.)
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── wallet/           # Wallet-related components
│   ├── portfolio/        # Portfolio analysis components
│   └── nft/              # NFT-related components
├── lib/
│   ├── solana/           # Solana utilities and helpers
│   ├── supabase/         # Supabase client setup
│   ├── api/              # API client functions
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── store/                # Zustand stores
└── types/                # TypeScript type definitions
```

## Key Features to Implement

1. **Wallet Import & Management**
   - CSV upload with validation
   - Manual wallet entry
   - Batch import (up to 100 wallets)
   - Address validation
   - Import history

2. **Portfolio Analysis**
   - Real-time asset discovery
   - USD valuation with multiple price feeds
   - Portfolio aggregation
   - Performance metrics
   - Risk assessment

3. **NFT Burn Value Calculator**
   - Calculate SOL recovery from NFT burns
   - Floor price comparison
   - Batch burn calculations
   - Collection analysis
   - Burn recommendations

4. **Transaction Features**
   - Wallet connection
   - NFT burning execution
   - Bulk operations
   - Transaction simulation
   - Gas optimization

## Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOLANA_RPC_URL=optional_custom_rpc
```

## Coding Guidelines

1. **Component Creation**: Use functional components with TypeScript
2. **Styling**: Use Tailwind CSS classes, avoid inline styles
3. **State Management**: Use Zustand for global state, React state for local
4. **Error Handling**: Always handle errors with try-catch blocks
5. **API Calls**: Use TanStack Query for data fetching
6. **Type Safety**: Define interfaces for all data structures
7. **Security**: Never expose private keys, use wallet adapter for signing

## Common Patterns

### Fetching Solana Data
```typescript
import { useConnection } from '@solana/wallet-adapter-react';

const { connection } = useConnection();
const account = await connection.getAccountInfo(publicKey);
```

### Using Supabase
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('table').select();
```

### Creating shadcn/ui Components
```typescript
import { Button } from "@/components/ui/button"

<Button variant="outline" size="sm">Click me</Button>
```

## Testing Approach

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Component testing with React Testing Library

## Performance Considerations

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Cache API responses with React Query
- Lazy load heavy components
- Optimize bundle size with dynamic imports