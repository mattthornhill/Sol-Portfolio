import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { NFTAsset } from '@/types/portfolio';
import axios from 'axios';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Rent calculation constants
const ACCOUNT_STORAGE_OVERHEAD = 128;
const TOKEN_ACCOUNT_SIZE = 165;
const METADATA_ACCOUNT_SIZE = 679;
const EDITION_ACCOUNT_SIZE = 241;

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();
    
    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Invalid addresses' }, { status: 400 });
    }

    // Use Alchemy free tier as default for better rate limits
    // Server-side routes need to use SOLANA_RPC_URL (without NEXT_PUBLIC_ prefix)
    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/RUA0SwSYMDC6Rs5NnNfo3zt9gO-3Cf89';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    const allNFTs: NFTAsset[] = [];

    for (const address of addresses) {
      try {
        const pubkey = new PublicKey(address);
        
        // Get all token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
          programId: TOKEN_PROGRAM_ID,
        });

        // Filter for potential NFTs (amount = 1, decimals = 0)
        const nftAccounts = tokenAccounts.value.filter(account => {
          const parsedInfo = account.account.data as ParsedAccountData;
          const tokenInfo = parsedInfo.parsed.info;
          return tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1;
        });

        // Process NFTs in batches
        const batchSize = 100;
        for (let i = 0; i < nftAccounts.length; i += batchSize) {
          const batch = nftAccounts.slice(i, i + batchSize);
          
          // Get metadata addresses
          const metadataAddresses = batch.map(account => {
            const parsedInfo = account.account.data as ParsedAccountData;
            const mint = new PublicKey(parsedInfo.parsed.info.mint);
            return getMetadataAddress(mint);
          });

          // Fetch metadata accounts
          const metadataAccounts = await connection.getMultipleAccountsInfo(metadataAddresses);

          // Process each NFT
          for (let j = 0; j < batch.length; j++) {
            const account = batch[j];
            const metadataAccount = metadataAccounts[j];
            
            if (!metadataAccount) continue;

            const parsedInfo = account.account.data as ParsedAccountData;
            const tokenInfo = parsedInfo.parsed.info;
            const mint = new PublicKey(tokenInfo.mint);

            try {
              // Decode metadata
              const metadata = Metadata.deserialize(metadataAccount.data)[0];
              
              // Calculate rent for all accounts
              const tokenAccountRent = await connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SIZE);
              const metadataAccountRent = await connection.getMinimumBalanceForRentExemption(METADATA_ACCOUNT_SIZE);
              const editionAccountRent = await connection.getMinimumBalanceForRentExemption(EDITION_ACCOUNT_SIZE);
              
              const totalRent = (tokenAccountRent + metadataAccountRent + editionAccountRent) / 1e9;

              const nft: NFTAsset = {
                mint: mint.toString(),
                pubkey: mint,
                tokenAccount: account.pubkey,
                name: metadata.data.name.replace(/\0/g, '').trim(),
                symbol: metadata.data.symbol.replace(/\0/g, '').trim(),
                uri: metadata.data.uri.replace(/\0/g, '').trim(),
                rentExempt: tokenAccountRent / 1e9,
                accountsRent: totalRent,
                burnValue: totalRent, // Can be adjusted based on market conditions
                isCompressed: false,
                hasMarketValue: false,
                collection: metadata.collection ? {
                  name: 'Unknown Collection',
                  family: '',
                  verified: metadata.collection.verified,
                  address: metadata.collection.key.toString(),
                } : undefined,
              };

              // Try to fetch off-chain metadata
              if (nft.uri) {
                try {
                  const response = await axios.get(nft.uri, { 
                    timeout: 5000,
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                  });
                  const offchainMetadata = response.data;
                  
                  nft.image = offchainMetadata.image;
                  nft.description = offchainMetadata.description;
                  nft.attributes = offchainMetadata.attributes;
                  
                  if (offchainMetadata.collection) {
                    nft.collection = {
                      ...nft.collection,
                      name: offchainMetadata.collection.name || nft.collection?.name || 'Unknown',
                      family: offchainMetadata.collection.family || '',
                      verified: nft.collection?.verified || false,
                    };
                  }
                } catch (error) {
                  console.error(`Failed to fetch metadata for ${nft.name}:`, error);
                }
              }

              allNFTs.push(nft);
            } catch (error) {
              console.error('Error processing NFT:', error);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching NFTs for ${address}:`, error);
      }
    }

    return NextResponse.json({ nfts: allNFTs });
  } catch (error) {
    console.error('NFT API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT data' },
      { status: 500 }
    );
  }
}

function getMetadataAddress(mint: PublicKey): PublicKey {
  const [metadataAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  return metadataAddress;
}