import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { TokenBalance, WalletPortfolio } from '@/types/portfolio';
import { priceService } from '@/lib/api/prices';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// Add delay utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();
    
    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
    }

    // Use Alchemy free tier as default for better rate limits
    // Server-side routes need to use SOLANA_RPC_URL (without NEXT_PUBLIC_ prefix)
    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/RUA0SwSYMDC6Rs5NnNfo3zt9gO-3Cf89';
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
    
    // First pass: collect all data
    const walletData: Array<{
      address: string;
      solBalance: number;
      tokens: TokenBalance[];
      nfts: any[];
    }> = [];
    
    const allTokenMints = new Set<string>();

    // Process wallets with delay to avoid rate limits
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      
      // Add delay between requests (except for the first one)
      if (i > 0) {
        await delay(200); // 200ms delay between wallet fetches
      }
      
      try {
        console.log(`Processing wallet: ${address}`);
        const pubkey = new PublicKey(address);
        
        // Fetch SOL balance with retry logic
        let balance = 0;
        let retries = 3;
        while (retries > 0) {
          try {
            console.log(`Fetching balance for ${address}...`);
            balance = await connection.getBalance(pubkey);
            console.log(`Raw balance for ${address}: ${balance} lamports`);
            break;
          } catch (error: any) {
            console.error(`Error fetching balance for ${address}:`, error.message);
            if (error.message?.includes('429') && retries > 1) {
              console.log(`Rate limited on SOL balance, retrying... (${retries - 1} retries left)`);
              await delay(2000 * (4 - retries)); // Exponential backoff: 2s, 4s, 6s
              retries--;
            } else {
              throw error;
            }
          }
        }
        const solBalance = balance / 1e9;
        
        // Add small delay before token fetch
        await delay(100);
        
        // Fetch token accounts with retry logic
        let tokenAccounts, token2022Accounts;
        retries = 3;
        while (retries > 0) {
          try {
            [tokenAccounts, token2022Accounts] = await Promise.all([
              connection.getParsedTokenAccountsByOwner(pubkey, {
                programId: TOKEN_PROGRAM_ID,
              }),
              connection.getParsedTokenAccountsByOwner(pubkey, {
                programId: TOKEN_2022_PROGRAM_ID,
              }),
            ]);
            break;
          } catch (error: any) {
            if (error.message?.includes('429') && retries > 1) {
              console.log(`Rate limited on token accounts, retrying... (${retries - 1} retries left)`);
              await delay(2000 * (4 - retries));
              retries--;
            } else {
              throw error;
            }
          }
        }

        const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
        const tokens: TokenBalance[] = [];
        const nfts: any[] = [];

        for (const account of allAccounts) {
          const parsedInfo = account.account.data as ParsedAccountData;
          const tokenInfo = parsedInfo.parsed.info;
          
          if (tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1) {
            // This is likely an NFT
            nfts.push({
              mint: tokenInfo.mint,
              pubkey: account.pubkey,
              name: 'NFT',
              symbol: 'NFT',
              uri: '',
              rentExempt: 0.002, // Approximate
            });
          } else if (tokenInfo.tokenAmount.uiAmount > 0) {
            tokens.push({
              mint: tokenInfo.mint,
              pubkey: account.pubkey,
              amount: tokenInfo.tokenAmount.amount,
              decimals: tokenInfo.tokenAmount.decimals,
              uiAmount: tokenInfo.tokenAmount.uiAmount,
            });
            allTokenMints.add(tokenInfo.mint);
          }
        }

        console.log(`Wallet ${address}: SOL=${solBalance}, Tokens=${tokens.length}, NFTs=${nfts.length}`);
        
        walletData.push({
          address,
          solBalance,
          tokens,
          nfts,
        });
      } catch (error) {
        console.error(`Error fetching data for ${address}:`, error);
        // Add empty data for failed wallet
        walletData.push({
          address,
          solBalance: 0,
          tokens: [],
          nfts: [],
        });
      }
    }

    // Second pass: get all prices at once
    console.log('Fetching prices...');
    const solPrice = await priceService.getSOLPrice();
    console.log('SOL Price:', solPrice);
    
    const tokenPrices = allTokenMints.size > 0 
      ? await priceService.getTokenPrices(Array.from(allTokenMints))
      : {};
    console.log('Token prices fetched:', Object.keys(tokenPrices).length);

    // Third pass: build portfolios with prices
    const portfolios: WalletPortfolio[] = walletData.map(data => {
      const enhancedTokens: TokenBalance[] = data.tokens.map(token => {
        const tokenPrice = tokenPrices[token.mint]?.price || 0;
        const tokenValue = token.uiAmount * tokenPrice;
        
        return {
          ...token,
          symbol: tokenPrices[token.mint]?.symbol || 'Unknown',
          name: tokenPrices[token.mint]?.name || 'Unknown Token',
          logoURI: tokenPrices[token.mint]?.logoURI,
          price: tokenPrice,
          value: tokenValue,
          priceUSD: tokenPrice, // Token prices are already in USD
          valueUSD: tokenValue,
        };
      });

      const solValue = data.solBalance * solPrice;
      const tokenValue = enhancedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
      const totalValue = solValue + tokenValue;

      return {
        address: data.address,
        solBalance: data.solBalance,
        solValue,
        solValueUSD: solValue, // SOL value in USD
        solPriceUSD: solPrice,
        tokens: enhancedTokens,
        nfts: data.nfts,
        totalValue,
        totalValueUSD: totalValue, // Total value in USD
        lastUpdated: new Date(),
      };
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}