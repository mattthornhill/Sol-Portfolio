import { useQuery } from '@tanstack/react-query';
import { WalletPortfolio, PortfolioSummary } from '@/types/portfolio';
import axios from 'axios';

async function fetchMultiplePortfolios(addresses: string[]): Promise<WalletPortfolio[]> {
  try {
    const response = await axios.post('/api/portfolio', { addresses });
    return response.data.portfolios;
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    throw error;
  }
}

async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  const portfolios = await fetchMultiplePortfolios([address]);
  return portfolios[0];
}

export function useWalletPortfolio(address: string) {
  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => fetchWalletPortfolio(address),
    enabled: !!address,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useMultiplePortfolios(addresses: string[]) {
  // Sort addresses to ensure consistent query key
  const sortedAddresses = [...addresses].sort();
  
  return useQuery({
    queryKey: ['portfolios', sortedAddresses],
    queryFn: () => fetchMultiplePortfolios(addresses),
    enabled: addresses.length > 0,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function usePortfolioSummary(portfolios: WalletPortfolio[]): PortfolioSummary {
  // Calculate summary statistics
  const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  const totalSol = portfolios.reduce((sum, p) => sum + p.solBalance, 0);
  const totalSolValue = portfolios.reduce((sum, p) => sum + p.solValue, 0);
  const totalTokenValue = portfolios.reduce(
    (sum, p) => sum + p.tokens.reduce((tokenSum, t) => tokenSum + (t.value || 0), 0),
    0
  );
  const totalNFTValue = 0; // TODO: Implement NFT valuation
  const nftCount = portfolios.reduce((sum, p) => sum + p.nfts.length, 0);

  // Aggregate all tokens
  const tokenMap = new Map<string, typeof portfolios[0]['tokens'][0]>();
  portfolios.forEach(portfolio => {
    portfolio.tokens.forEach(token => {
      const existing = tokenMap.get(token.mint);
      if (existing) {
        tokenMap.set(token.mint, {
          ...existing,
          uiAmount: existing.uiAmount + token.uiAmount,
          value: (existing.value || 0) + (token.value || 0),
        });
      } else {
        tokenMap.set(token.mint, token);
      }
    });
  });

  const topTokens = Array.from(tokenMap.values())
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 10);

  // Aggregate NFT collections
  const collectionMap = new Map<string, { count: number; value: number }>();
  portfolios.forEach(portfolio => {
    portfolio.nfts.forEach(nft => {
      const collectionName = nft.collection?.name || 'Unknown Collection';
      const existing = collectionMap.get(collectionName);
      if (existing) {
        existing.count += 1;
        existing.value += nft.estimatedValue || 0;
      } else {
        collectionMap.set(collectionName, {
          count: 1,
          value: nft.estimatedValue || 0,
        });
      }
    });
  });

  const topNFTCollections = Array.from(collectionMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    totalValue,
    totalSol,
    totalTokenValue,
    totalNFTValue,
    tokenCount: tokenMap.size,
    nftCount,
    walletCount: portfolios.length,
    topTokens,
    topNFTCollections,
  };
}