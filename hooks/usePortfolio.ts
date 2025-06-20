import { useQuery } from '@tanstack/react-query';
import { WalletPortfolio, PortfolioSummary, NFTAsset } from '@/types/portfolio';
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

export function useMultiplePortfolios(addresses: string[], autoRefresh = true) {
  // Sort addresses to ensure consistent query key
  const sortedAddresses = [...addresses].sort();
  
  return useQuery({
    queryKey: ['portfolios', sortedAddresses],
    queryFn: () => fetchMultiplePortfolios(addresses),
    enabled: addresses.length > 0,
    refetchInterval: autoRefresh ? 120000 : false, // 2 minutes instead of 1
    staleTime: 60000, // 1 minute
  });
}

export function usePortfolioSummary(portfolios: WalletPortfolio[], nftData?: NFTAsset[]): PortfolioSummary {
  // Calculate summary statistics
  const totalSol = portfolios.reduce((sum, p) => sum + p.solBalance, 0);
  const totalSolValue = portfolios.reduce((sum, p) => sum + p.solValue, 0);
  const totalTokenValue = portfolios.reduce(
    (sum, p) => sum + p.tokens.reduce((tokenSum, t) => tokenSum + (t.value || 0), 0),
    0
  );
  
  // Get SOL price from first portfolio (they all should have the same price)
  // Default to a reasonable price if not available to avoid NaN
  const solPrice = portfolios.length > 0 && portfolios[0].solPriceUSD ? portfolios[0].solPriceUSD : 145;
  
  // Use NFT data if provided (with floor prices), otherwise fall back to portfolio NFTs
  const nftsToUse = nftData && nftData.length > 0 ? nftData : portfolios.flatMap(p => p.nfts);
  
  // Calculate NFT value based on floor prices (in SOL, then convert to USD)
  const totalNFTValueSOL = nftsToUse.reduce((nftSum, nft) => {
    // Use floor price if available and greater than burn value, otherwise use burn value
    const floorPrice = nft.floorPrice && !isNaN(nft.floorPrice) ? nft.floorPrice : 0;
    const burnValue = nft.burnValue && !isNaN(nft.burnValue) ? nft.burnValue : 0;
    const marketValue = (floorPrice > 0) ? floorPrice : burnValue;
    return nftSum + marketValue;
  }, 0);
  
  // Convert NFT value to USD
  const totalNFTValue = isNaN(totalNFTValueSOL) || isNaN(solPrice) ? 0 : totalNFTValueSOL * solPrice;
  
  const nftCount = nftsToUse.length;
  
  // Ensure all values are valid numbers
  const safeTotal = (
    (isNaN(totalSolValue) ? 0 : totalSolValue) +
    (isNaN(totalTokenValue) ? 0 : totalTokenValue) +
    (isNaN(totalNFTValue) ? 0 : totalNFTValue)
  );
  const totalValue = safeTotal;

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
  nftsToUse.forEach(nft => {
    const collectionName = nft.collection?.name || 'Unknown Collection';
    const existing = collectionMap.get(collectionName);
    const floorPrice = nft.floorPrice && !isNaN(nft.floorPrice) ? nft.floorPrice : 0;
    const burnValue = nft.burnValue && !isNaN(nft.burnValue) ? nft.burnValue : 0;
    const nftValueSOL = (floorPrice > 0) ? floorPrice : burnValue;
    const nftValueUSD = isNaN(nftValueSOL) || isNaN(solPrice) ? 0 : nftValueSOL * solPrice;
    if (existing) {
      existing.count += 1;
      existing.value += nftValueUSD;
    } else {
      collectionMap.set(collectionName, {
        count: 1,
        value: nftValueUSD,
      });
    }
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