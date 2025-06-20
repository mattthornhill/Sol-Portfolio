"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NFTAsset } from '@/types/portfolio';
import Image from 'next/image';
import { ExternalLink, Image as ImageIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';

interface NFTGridProps {
  nfts: NFTAsset[];
  selectedNFTs: Set<string>;
  onToggleNFT: (mint: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  priceFilter: 'all' | 'worthless' | 'valuable';
  onPriceFilterChange: (filter: 'all' | 'worthless' | 'valuable') => void;
}

export function NFTGrid({
  nfts,
  selectedNFTs,
  onToggleNFT,
  onSelectAll,
  onClearSelection,
  priceFilter,
  onPriceFilterChange,
}: NFTGridProps) {
  const { publicKey } = useWallet();
  
  const formatSOL = (value: number) => {
    return value.toFixed(4);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your NFTs ({nfts.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={priceFilter === 'all' ? 'default' : 'outline'}
                onClick={() => onPriceFilterChange('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={priceFilter === 'worthless' ? 'default' : 'outline'}
                onClick={() => onPriceFilterChange('worthless')}
              >
                No Value
              </Button>
              <Button
                size="sm"
                variant={priceFilter === 'valuable' ? 'default' : 'outline'}
                onClick={() => onPriceFilterChange('valuable')}
              >
                Has Value
              </Button>
            </div>
            <div className="h-4 w-px bg-border" />
            <Button size="sm" variant="outline" onClick={onSelectAll}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No NFTs found in your wallets</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => {
              const isOwned = !publicKey || nft.owner === publicKey.toString();
              const canBurn = publicKey && nft.owner === publicKey.toString();
              
              return (
                <div
                  key={nft.mint}
                  className={cn(
                    "relative rounded-lg border p-3 transition-all",
                    !canBurn && "opacity-60 cursor-not-allowed",
                    canBurn && "cursor-pointer",
                    selectedNFTs.has(nft.mint) 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : canBurn && "hover:border-primary/50"
                  )}
                  onClick={() => canBurn && onToggleNFT(nft.mint)}
                >
                <div className="absolute top-2 left-2 z-10">
                  {canBurn ? (
                    <Checkbox
                      checked={selectedNFTs.has(nft.mint)}
                      onCheckedChange={() => onToggleNFT(nft.mint)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="h-4 w-4 rounded bg-muted flex items-center justify-center">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="aspect-square relative mb-3 bg-muted rounded-md overflow-hidden">
                  {nft.image ? (
                    <Image
                      src={nft.image}
                      alt={nft.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    nft.image ? "hidden" : ""
                  )}>
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium text-sm truncate pr-6">{nft.name}</h4>
                  {nft.collection && (
                    <p className="text-xs text-muted-foreground truncate">
                      {nft.collection.name}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Burn Value</p>
                      <p className="text-sm font-medium">◎ {formatSOL(nft.burnValue)}</p>
                    </div>
                    {nft.floorPrice && nft.floorPrice > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Floor</p>
                        <p className="text-sm font-medium">◎ {formatSOL(nft.floorPrice)}</p>
                      </div>
                    )}
                  </div>

                  {nft.hasMarketValue && nft.floorPrice && nft.floorPrice > nft.burnValue && (
                    <div className="pt-1">
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        ⚠️ Worth more on market
                      </p>
                    </div>
                  )}
                  
                  {!canBurn && nft.owner && (
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground truncate">
                        Wallet: {nft.owner.slice(0, 4)}...{nft.owner.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>

                <a
                  href={`https://solscan.io/token/${nft.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}