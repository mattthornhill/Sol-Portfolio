import { PublicKey } from '@solana/web3.js';

export interface TokenBalance {
  mint: string;
  pubkey: PublicKey;
  amount: number;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
  coingeckoId?: string;
  price?: number;
  value?: number;
  priceUSD?: number;
  valueUSD?: number;
}

export interface NFTAsset {
  mint: string;
  pubkey: PublicKey;
  tokenAccount: PublicKey;
  owner?: string; // Wallet address that owns this NFT
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  description?: string;
  collection?: {
    name: string;
    family: string;
    verified: boolean;
    address?: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  floorPrice?: number;
  lastSalePrice?: number;
  estimatedValue?: number;
  rentExempt: number; // SOL that can be recovered by burning
  accountsRent: number; // Total rent from all accounts (token, metadata, edition)
  burnValue: number; // Total SOL recoverable
  isCompressed?: boolean;
  hasMarketValue: boolean;
}

export interface WalletPortfolio {
  address: string;
  solBalance: number;
  solValue: number;
  solValueUSD?: number;
  solPriceUSD?: number;
  tokens: TokenBalance[];
  nfts: NFTAsset[];
  totalValue: number;
  totalValueUSD?: number;
  lastUpdated: Date;
}

export interface PortfolioSummary {
  totalValue: number;
  totalSol: number;
  totalTokenValue: number;
  totalNFTValue: number;
  tokenCount: number;
  nftCount: number;
  walletCount: number;
  topTokens: TokenBalance[];
  topNFTCollections: {
    name: string;
    count: number;
    value: number;
  }[];
}

export interface PriceData {
  [tokenMint: string]: {
    price: number;
    symbol: string;
    name: string;
    logoURI?: string;
  };
}