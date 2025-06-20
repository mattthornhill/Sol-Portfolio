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
      // Jupiter Price API v2
      const ids = mintsToFetch.join(',');
      console.log('Fetching prices for tokens:', mintsToFetch.length);
      console.log('Token mints:', mintsToFetch.slice(0, 3)); // Show first 3 mints
      const response = await axios.get(`https://api.jup.ag/price/v2?ids=${ids}`);
      console.log('Jupiter API response:', JSON.stringify(response.data).slice(0, 200));
      
      const prices = response.data.data || response.data;

      if (prices) {
        Object.entries(prices).forEach(([mint, data]: [string, any]) => {
          const token = tokenMap.get(mint);
          let price = 0;
          
          if (typeof data === 'object' && data !== null) {
            price = parseFloat(data.price) || 0;
          } else if (typeof data === 'number') {
            price = data;
          } else if (typeof data === 'string') {
            price = parseFloat(data) || 0;
          }
          
          console.log(`Price for ${token?.symbol || mint}: $${price} (type: ${typeof price})`);
          
          // Update cache
          this.priceCache.set(mint, { price, timestamp: now });
          
          priceData[mint] = {
            price,
            symbol: token?.symbol || 'Unknown',
            name: token?.name || 'Unknown Token',
            logoURI: token?.logoURI,
          };
        });
      }

      // For tokens without prices, set to 0
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
      const solMint = 'So11111111111111111111111111111111111111112';
      console.log('Fetching SOL price...');
      const prices = await this.getTokenPrices([solMint]);
      const solPrice = prices[solMint]?.price || 0;
      console.log('SOL price:', solPrice);
      return solPrice;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      // Return a fallback price if API fails
      return 30; // Fallback SOL price
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