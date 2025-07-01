import axios from 'axios';
import { PriceData } from '@/types/portfolio';

interface JupiterToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
}

interface JupiterPrice {
  id: string;
  price: number;
}

class PriceService {
  private tokenList: JupiterToken[] = [];
  private tokenListLastFetch: number = 0;
  private readonly TOKEN_LIST_CACHE_TIME = 1000 * 60 * 60; // 1 hour
  private readonly PRICE_CACHE_TIME = 1000 * 60 * 5; // 5 minutes
  private priceCache = new Map<string, { price: number; timestamp: number }>();
  
  constructor() {
    // Clear cache on startup
    this.priceCache.clear();
  }

  async getTokenList(): Promise<JupiterToken[]> {
    const now = Date.now();
    
    if (this.tokenList.length > 0 && now - this.tokenListLastFetch < this.TOKEN_LIST_CACHE_TIME) {
      return this.tokenList;
    }

    try {
      const response = await axios.get('https://token.jup.ag/all');
      this.tokenList = response.data;
      this.tokenListLastFetch = now;
      return this.tokenList;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return this.tokenList; // Return cached version if available
    }
  }

  async getTokenPrices(mints: string[]): Promise<PriceData> {
    const priceData: PriceData = {};
    const tokenList = await this.getTokenList();
    const tokenMap = new Map(tokenList.map(token => [token.address, token]));
    
    // Filter out mints that we have recent prices for
    const now = Date.now();
    const mintsToFetch = mints.filter(mint => {
      const cached = this.priceCache.get(mint);
      return !cached || now - cached.timestamp > this.PRICE_CACHE_TIME;
    });

    // Add cached prices to result
    mints.forEach(mint => {
      const cached = this.priceCache.get(mint);
      const token = tokenMap.get(mint);
      if (cached && cached.price !== null && cached.price !== undefined && now - cached.timestamp <= this.PRICE_CACHE_TIME) {
        priceData[mint] = {
          price: cached.price,
          symbol: token?.symbol || 'Unknown',
          name: token?.name || 'Unknown Token',
          logoURI: token?.logoURI,
        };
      }
    });

    if (mintsToFetch.length === 0) {
      return priceData;
    }

    try {
      // Use DexScreener for token prices
      console.log('Fetching prices for tokens:', mintsToFetch.length);
      console.log('Token mints:', mintsToFetch.slice(0, 3)); // Show first 3 mints
      
      const prices: Record<string, number> = {};
      
      // Batch fetch prices from DexScreener API
      // DexScreener allows up to 30 tokens per request
      const batchSize = 30;
      for (let i = 0; i < mintsToFetch.length; i += batchSize) {
        const batch = mintsToFetch.slice(i, i + batchSize);
        const tokenIds = batch.join(',');
        
        try {
          console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}: ${batch.length} tokens`);
          const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenIds}`, {
            timeout: 10000
          });
          
          console.log('DexScreener response:', response.data?.pairs?.length || 0, 'pairs found');
          
          if (response.data?.pairs) {
            response.data.pairs.forEach((pair: any) => {
              if (pair.baseToken?.address && pair.priceUsd) {
                const mint = pair.baseToken.address;
                const price = parseFloat(pair.priceUsd) || 0;
                if (price > 0) {
                  prices[mint] = price;
                  console.log(`Price found for ${pair.baseToken.symbol}: $${price}`);
                }
              }
            });
          }
        } catch (batchError: any) {
          console.error('Error fetching batch:', batchError?.message || batchError);
          // Continue with next batch
        }
        
        // Add delay between batches to avoid rate limits
        if (i + batchSize < mintsToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Process found prices
      Object.entries(prices).forEach(([mint, price]: [string, any]) => {
        const token = tokenMap.get(mint);
        const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
        
        console.log(`Price for ${token?.symbol || mint}: $${numericPrice}`);
        
        // Update cache
        this.priceCache.set(mint, { price: numericPrice, timestamp: now });
        
        priceData[mint] = {
          price: numericPrice,
          symbol: token?.symbol || 'Unknown',
          name: token?.name || 'Unknown Token',
          logoURI: token?.logoURI,
        };
      });

      // For tokens without prices, set to 0
      mintsToFetch.forEach(mint => {
        if (!priceData[mint]) {
          const token = tokenMap.get(mint);
          console.log(`No price found for token: ${token?.symbol || mint.slice(0, 8)}...`);
          priceData[mint] = {
            price: 0,
            symbol: token?.symbol || 'Unknown',
            name: token?.name || 'Unknown Token',
            logoURI: token?.logoURI,
          };
        }
      });
    } catch (error) {
      console.error('Error fetching token prices:', error);
      
      // Fill in with zeros for failed fetches
      mintsToFetch.forEach(mint => {
        if (!priceData[mint]) {
          const token = tokenMap.get(mint);
          priceData[mint] = {
            price: 0,
            symbol: token?.symbol || 'Unknown',
            name: token?.name || 'Unknown Token',
            logoURI: token?.logoURI,
          };
        }
      });
    }

    return priceData;
  }

  async getSOLPrice(): Promise<number> {
    try {
      console.log('Fetching SOL price from CoinGecko...');
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
        timeout: 5000
      });
      const solPrice = response.data.solana?.usd || 145;
      console.log('SOL price from CoinGecko:', solPrice);
      
      // Cache SOL price for 5 minutes
      const solMint = 'So11111111111111111111111111111111111111112';
      this.priceCache.set(solMint, { price: solPrice, timestamp: Date.now() });
      
      return solPrice;
    } catch (error) {
      console.error('Error fetching SOL price from CoinGecko:', error);
      
      // Try to get cached SOL price
      const solMint = 'So11111111111111111111111111111111111111112';
      const cached = this.priceCache.get(solMint);
      if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_TIME * 2) { // Extended cache for SOL
        console.log('Using cached SOL price:', cached.price);
        return cached.price;
      }
      
      // Return a fallback price if API fails
      console.log('Using fallback SOL price: $145');
      return 145; // Fallback SOL price
    }
  }

  // Get NFT floor prices from Magic Eden (simplified version)
  async getNFTFloorPrices(collections: string[]): Promise<Map<string, number>> {
    const floorPrices = new Map<string, number>();
    
    // This would require Magic Eden API key in production
    // For now, returning empty map
    // In production, you would:
    // 1. Use Magic Eden API to get collection stats
    // 2. Match NFTs to collections
    // 3. Return floor prices
    
    return floorPrices;
  }
}

export const priceService = new PriceService();