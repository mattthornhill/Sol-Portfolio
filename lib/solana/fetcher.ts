import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { TokenBalance, NFTAsset } from '@/types/portfolio';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const METAPLEX_TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export class SolanaFetcher {
  private connection: Connection;

  constructor(rpcUrl?: string) {
    // Use a public RPC endpoint that works well with browser environments
    const endpoint = rpcUrl || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    console.log('Connecting to Solana RPC:', endpoint);
    
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed',
      wsEndpoint: undefined, // Disable WebSocket in browser
    });
  }

  async getSOLBalance(address: string): Promise<number> {
    try {
      console.log('Fetching SOL balance for:', address);
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      console.log('SOL balance (lamports):', balance);
      const solBalance = balance / 1e9; // Convert lamports to SOL
      console.log('SOL balance:', solBalance);
      return solBalance;
    } catch (error) {
      console.error('Error fetching SOL balance for', address, ':', error);
      return 0;
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      const pubkey = new PublicKey(address);
      
      // Get token accounts for both token programs
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        this.connection.getParsedTokenAccountsByOwner(pubkey, {
          programId: TOKEN_PROGRAM_ID,
        }),
        this.connection.getParsedTokenAccountsByOwner(pubkey, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);

      const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
      
      const balances: TokenBalance[] = [];

      for (const account of allAccounts) {
        const parsedInfo = account.account.data as ParsedAccountData;
        const tokenInfo = parsedInfo.parsed.info;
        
        if (tokenInfo.tokenAmount.uiAmount > 0) {
          balances.push({
            mint: tokenInfo.mint,
            pubkey: account.pubkey,
            amount: tokenInfo.tokenAmount.amount,
            decimals: tokenInfo.tokenAmount.decimals,
            uiAmount: tokenInfo.tokenAmount.uiAmount,
          });
        }
      }

      return balances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  async getNFTs(address: string): Promise<NFTAsset[]> {
    try {
      const pubkey = new PublicKey(address);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const nfts: NFTAsset[] = [];
      const potentialNFTs = tokenAccounts.value.filter(account => {
        const parsedInfo = account.account.data as ParsedAccountData;
        const tokenInfo = parsedInfo.parsed.info;
        return tokenInfo.tokenAmount.decimals === 0 && tokenInfo.tokenAmount.uiAmount === 1;
      });

      // Batch fetch metadata accounts
      const metadataAddresses = potentialNFTs.map(account => {
        const parsedInfo = account.account.data as ParsedAccountData;
        const mint = new PublicKey(parsedInfo.parsed.info.mint);
        return this.getMetadataAddress(mint);
      });

      const metadataAccounts = await this.connection.getMultipleAccountsInfo(metadataAddresses);

      for (let i = 0; i < potentialNFTs.length; i++) {
        const account = potentialNFTs[i];
        const metadata = metadataAccounts[i];
        
        if (metadata) {
          const parsedInfo = account.account.data as ParsedAccountData;
          const tokenInfo = parsedInfo.parsed.info;
          
          // Calculate rent exempt amount (approximate)
          const rentExempt = await this.connection.getMinimumBalanceForRentExemption(metadata.data.length);
          
          nfts.push({
            mint: tokenInfo.mint,
            pubkey: new PublicKey(tokenInfo.mint),
            tokenAccount: account.pubkey,
            name: 'Unknown NFT', // Will be updated with actual metadata
            symbol: 'NFT',
            uri: '',
            rentExempt: rentExempt / 1e9, // Convert to SOL
            accountsRent: rentExempt / 1e9, // Placeholder - will be calculated properly later
            burnValue: rentExempt / 1e9, // Placeholder
            hasMarketValue: false,
            isCompressed: false,
          });
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  private getMetadataAddress(mint: PublicKey): PublicKey {
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METAPLEX_TOKEN_METADATA_PROGRAM.toBuffer(),
        mint.toBuffer(),
      ],
      METAPLEX_TOKEN_METADATA_PROGRAM
    );
    return metadataAddress;
  }

  async getMultipleBalances(addresses: string[]): Promise<Map<string, number>> {
    const balanceMap = new Map<string, number>();
    
    try {
      const pubkeys = addresses.map(addr => new PublicKey(addr));
      const balances = await this.connection.getMultipleAccountsInfo(pubkeys);
      
      balances.forEach((account, index) => {
        const balance = account ? account.lamports / 1e9 : 0;
        balanceMap.set(addresses[index], balance);
      });
    } catch (error) {
      console.error('Error fetching multiple balances:', error);
    }
    
    return balanceMap;
  }
}