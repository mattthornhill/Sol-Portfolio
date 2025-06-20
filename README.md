# Solana Wallet Portfolio Analyzer

A comprehensive web application for analyzing Solana wallet portfolios, tracking NFT values, and calculating burn potential.

## Features

- **Multi-wallet Management**: Import wallets via CSV or manual entry
- **Portfolio Analysis**: Real-time tracking of SOL, tokens, and NFTs
- **NFT Burn Calculator**: Calculate potential SOL recovery from burning NFTs
- **Market Value Tracking**: Display floor prices and market values for NFT collections
- **Multi-wallet Support**: Analyze multiple wallets simultaneously or individually
- **Real-time Updates**: Auto-refresh portfolio data with customizable intervals

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Blockchain**: Solana Web3.js, Metaplex SDK
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **RPC Provider**: Alchemy

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solana RPC endpoint (Alchemy recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solana-wallet-inspector.git
cd solana-wallet-inspector
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=your_alchemy_rpc_url
SOLANA_RPC_URL=your_alchemy_rpc_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Import Wallets**: Start by importing Solana wallet addresses via CSV or manual entry
2. **View Portfolio**: Navigate to the portfolio dashboard to see aggregated holdings
3. **Analyze NFTs**: View NFT collections with floor prices and market values
4. **Calculate Burns**: Use the burn calculator to identify NFTs worth burning for SOL recovery
5. **Filter by Wallet**: Use the wallet filter to view individual wallet portfolios

## Key Features Explained

### NFT Burn Value Calculator
- Calculates recoverable SOL from burning NFTs (rent exemption)
- Compares burn value to floor price
- Warns when NFTs have market value above burn value
- Only allows burning from connected wallet

### Multi-wallet Portfolio
- Aggregate view of all imported wallets
- Individual wallet filtering
- Real-time USD value calculations
- Token and NFT breakdowns by wallet

### Smart Duplicate Detection
- Prevents importing duplicate wallets
- Shows feedback when duplicates are skipped
- Maintains wallet nicknames for easy identification

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.