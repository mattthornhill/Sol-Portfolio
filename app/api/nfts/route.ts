import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { NFTAsset } from '@/types/portfolio';
import axios from 'axios';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Rent calculation constants
const ACCOUNT_STORAGE_OVERHEAD = 128;
const TOKEN_ACCOUNT_SIZE = 165;
const METADATA_ACCOUNT_SIZE = 679;
const EDITION_ACCOUNT_SIZE = 241;

// Popular collection floor prices (in SOL) - this should be fetched from an API in production
const COLLECTION_FLOOR_PRICES: Record<string, number> = {
  'degods': 8.5,
  'y00ts': 2.1,
  'okay bears': 15.2,
  'mad lads': 120.5,
  'famous fox federation': 18.7,
  'smb gen3': 12.3,
  'claynosaurz': 9.8,
  'abc': 6.5,
  'boryoku dragonz': 3.2,
  'fff crystal': 0.15,
  'labmonke nft': 0.08,
  'degen islands': 0.02,
  'botborg': 0.05,
  'ape shoebox': 0.01,
  'solana nft': 0.001,
  'metahelix': 0.01,
  'metahelix token': 0.01,
};

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
    const metaplex = Metaplex.make(connection);
    
    const allNFTs: NFTAsset[] = [];

    for (const address of addresses) {
      try {
        const pubkey = new PublicKey(address);
        
        // Get all token accounts (both Token and Token-2022)
        const [tokenAccounts, token2022Accounts] = await Promise.all([
          connection.getParsedTokenAccountsByOwner(pubkey, {
            programId: TOKEN_PROGRAM_ID,
          }),
          connection.getParsedTokenAccountsByOwner(pubkey, {
            programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), // Token-2022
          }),
        ]);

        // Combine both account types
        const allTokenAccounts = [...tokenAccounts.value, ...token2022Accounts.value];

        // Filter for potential NFTs (amount = 1, decimals = 0)
        const nftAccounts = allTokenAccounts.filter(account => {
          const parsedInfo = account.account.data as ParsedAccountData;
          const tokenInfo = parsedInfo.parsed.info;
          return tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1;
        });
        

        // Get all token account infos in batch for rent calculation
        const tokenAccountPubkeys = nftAccounts.map(acc => acc.pubkey);
        const tokenAccountInfos = await connection.getMultipleAccountsInfo(tokenAccountPubkeys);
        
        // Process NFTs
        for (let i = 0; i < nftAccounts.length; i++) {
          const account = nftAccounts[i];
          const parsedInfo = account.account.data as ParsedAccountData;
          const tokenInfo = parsedInfo.parsed.info;
          const mint = new PublicKey(tokenInfo.mint);
          
          // Get actual rent from the batched account info
          const tokenAccountRent = (tokenAccountInfos[i]?.lamports || 2039280) / 1e9;

          // Create basic NFT object first
          const nft: NFTAsset = {
            mint: mint.toString(),
            pubkey: mint,
            tokenAccount: account.pubkey,
            owner: address, // Add the wallet address that owns this NFT
            name: 'Unknown NFT',
            symbol: 'NFT',
            uri: '',
            rentExempt: tokenAccountRent, // Actual token account rent
            accountsRent: tokenAccountRent + 0.00323856, // Token + estimated metadata + edition
            burnValue: tokenAccountRent, // Only token account rent is recoverable
            isCompressed: false,
            hasMarketValue: false,
          };

          // Try to get metadata (but don't fail if we can't)
          try {
            const nftData = await metaplex.nfts().findByMint({ mintAddress: mint });
            
            nft.name = nftData.name || 'Unknown NFT';
            nft.symbol = nftData.symbol || 'NFT';
            nft.uri = nftData.uri || '';
            
            // Try to extract collection name from NFT name
            let collectionName = 'Unknown Collection';
            if (nftData.name) {
              // Common patterns: "Collection Name #123" or "Collection Name: Title"
              const match = nftData.name.match(/^([^#:]+)(?:\s*[#:])/);
              if (match) {
                collectionName = match[1].trim();
              }
            }
            
            if (nftData.collection) {
              nft.collection = {
                name: collectionName,
                family: '',
                verified: nftData.collection.verified,
                address: nftData.collection.address.toString(),
              };
            } else {
              // Even without on-chain collection, try to group by name pattern
              nft.collection = {
                name: collectionName,
                family: '',
                verified: false,
              };
            }
            
            // Try to fetch off-chain metadata
            if (nft.uri) {
              // Handle IPFS URIs and other formats
              let metadataUri = nft.uri;
              const ipfsGateways = [
                'https://nftstorage.link/ipfs/',
                'https://gateway.pinata.cloud/ipfs/',
                'https://ipfs.io/ipfs/',
                'https://cloudflare-ipfs.com/ipfs/'
              ];
              
              if (metadataUri.startsWith('ipfs://')) {
                // Try multiple IPFS gateways
                const ipfsHash = metadataUri.replace('ipfs://', '');
                metadataUri = ipfsGateways[0] + ipfsHash;
              } else if (metadataUri.startsWith('https://arweave.net/')) {
                // Arweave URLs are usually fine as-is
              } else if (!metadataUri.startsWith('http')) {
                // Skip non-HTTP URIs
                metadataUri = '';
              }
              
              if (metadataUri.startsWith('http')) {
                try {
                  const response = await axios.get(metadataUri, { 
                    timeout: 5000,
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                  });
                  const offchainMetadata = response.data;
                  
                  // Process image URI
                  if (offchainMetadata.image) {
                    let imageUri = offchainMetadata.image;
                    if (imageUri.startsWith('ipfs://')) {
                      // Use the same gateway as metadata for consistency
                      const ipfsHash = imageUri.replace('ipfs://', '');
                      imageUri = ipfsGateways[0] + ipfsHash;
                    } else if (imageUri.startsWith('https://arweave.net/')) {
                      // Arweave URLs are usually fine
                    } else if (!imageUri.startsWith('http')) {
                      imageUri = ''; // Skip non-HTTP URIs
                    }
                    if (imageUri) {
                      nft.image = imageUri;
                    }
                  }
                  
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
                  
                  // Check for floor price
                  const collectionName = (nft.collection?.name || '').toLowerCase();
                  const floorPrice = COLLECTION_FLOOR_PRICES[collectionName];
                  if (floorPrice) {
                    nft.floorPrice = floorPrice;
                    nft.estimatedValue = floorPrice;
                    nft.hasMarketValue = true;
                  }
                } catch (error) {
                  console.log(`Failed to fetch metadata for ${nft.name}: ${metadataUri}`);
                }
              }
            }
          } catch (error) {
            console.log(`Could not fetch metadata for NFT ${mint.toString()}`);
          }
          
          // Try to get floor price even if we couldn't fetch full metadata
          if (!nft.floorPrice && nft.collection?.name) {
            const collectionName = nft.collection.name.toLowerCase();
            const floorPrice = COLLECTION_FLOOR_PRICES[collectionName];
            if (floorPrice) {
              nft.floorPrice = floorPrice;
              nft.estimatedValue = floorPrice;
              nft.hasMarketValue = true;
            }
          }

          allNFTs.push(nft);
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