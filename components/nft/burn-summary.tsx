"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NFTAsset } from '@/types/portfolio';
import { Flame, AlertTriangle, DollarSign, Hash, Loader2 } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import { useState } from 'react';
import axios from 'axios';

interface BurnSummaryProps {
  selectedNFTs: NFTAsset[];
  onBurn: () => void;
}

export function BurnSummary({ selectedNFTs, onBurn }: BurnSummaryProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isBurning, setIsBurning] = useState(false);
  
  const totalBurnValue = selectedNFTs.reduce((sum, nft) => sum + nft.burnValue, 0);
  const totalMarketValue = selectedNFTs.reduce((sum, nft) => sum + (nft.floorPrice || 0), 0);
  const valuableNFTs = selectedNFTs.filter(nft => nft.hasMarketValue && nft.floorPrice && nft.floorPrice > nft.burnValue);
  
  const formatSOL = (value: number) => {
    return value.toFixed(4);
  };

  const formatUSD = (sol: number) => {
    // Assuming $30 per SOL for demo
    const usdValue = sol * 30;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  };

  const handleBurn = async () => {
    if (!publicKey || !connected || selectedNFTs.length === 0) return;

    setIsBurning(true);
    try {
      // Create burn transaction
      const response = await axios.post('/api/burn', {
        nfts: selectedNFTs.map(nft => ({
          mint: nft.mint,
          tokenAccount: typeof nft.tokenAccount === 'string' ? nft.tokenAccount : nft.tokenAccount.toBase58(),
        })),
        payerPublicKey: publicKey.toString(),
      });

      const { transaction: serializedTx, blockhash, lastValidBlockHeight, estimatedRent } = response.data;

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'));
      
      // Send transaction
      toast.info('Please approve the transaction in your wallet...');
      
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      toast.info('Transaction sent, waiting for confirmation...');

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      toast.success(`Successfully burned ${selectedNFTs.length} NFTs! Recovered ~◎${estimatedRent.toFixed(4)} SOL`);
      
      // Call the onBurn callback to refresh data
      onBurn();
      
    } catch (error: any) {
      console.error('Burn error:', error);
      
      // Check if it's an axios error with response data
      if (error.response?.data?.error) {
        toast.error(`Failed to burn NFTs: ${error.response.data.error}`);
      } else if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(`Failed to burn NFTs: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Burn Summary
        </CardTitle>
        <CardDescription>
          Review your selection before burning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Selected NFTs</span>
            </div>
            <span className="font-semibold">{selectedNFTs.length}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm">Total Burn Value</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">◎ {formatSOL(totalBurnValue)}</p>
              <p className="text-xs text-muted-foreground">{formatUSD(totalBurnValue)}</p>
            </div>
          </div>

          {totalMarketValue > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Market Value</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">◎ {formatSOL(totalMarketValue)}</p>
                <p className="text-xs text-muted-foreground">{formatUSD(totalMarketValue)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Warning for valuable NFTs */}
        {valuableNFTs.length > 0 && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  Warning: Valuable NFTs Selected
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-300">
                  {valuableNFTs.length} NFT{valuableNFTs.length !== 1 ? 's' : ''} worth more on the market than their burn value.
                  Consider selling instead.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!connected ? (
            <WalletMultiButton className="w-full" />
          ) : (
            <Button 
              className="w-full"
              size="lg"
              disabled={selectedNFTs.length === 0 || isBurning}
              onClick={handleBurn}
            >
              {isBurning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Burning...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 mr-2" />
                  Burn {selectedNFTs.length} NFT{selectedNFTs.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
          
          <p className="text-xs text-center text-muted-foreground">
            Burning is permanent and cannot be undone
          </p>
        </div>

        {/* Breakdown */}
        {selectedNFTs.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Selected Collections</p>
            <div className="space-y-1">
              {Object.entries(
                selectedNFTs.reduce((acc, nft) => {
                  const collection = nft.collection?.name || 'Unknown';
                  acc[collection] = (acc[collection] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([collection, count]) => (
                <div key={collection} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate">{collection}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}