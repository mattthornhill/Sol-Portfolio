"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NFTAsset } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, ExternalLink, Coins } from 'lucide-react';
import { NFTImage } from '@/components/ui/nft-image';
import Image from 'next/image';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface NFTGalleryProps {
  nfts: NFTAsset[];
  solPrice?: number;
}

export function NFTGallery({ nfts, solPrice = 145 }: NFTGalleryProps) {
  const [selectedNFT, setSelectedNFT] = useState<NFTAsset | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  const formatSOL = (value: number) => {
    return value.toFixed(4);
  };

  const formatUSD = (sol: number) => {
    const usdValue = sol * solPrice;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  };

  const handleImageError = (mint: string) => {
    setImageError(prev => new Set(prev).add(mint));
    console.log(`Image failed to load for NFT: ${mint}`);
  };

  if (nfts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            NFT Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No NFTs found in the selected wallets
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group NFTs by collection
  const collections = nfts.reduce((acc, nft) => {
    const collectionName = nft.collection?.name || 'Unknown Collection';
    if (!acc[collectionName]) {
      acc[collectionName] = [];
    }
    acc[collectionName].push(nft);
    return acc;
  }, {} as Record<string, NFTAsset[]>);
  
  // Calculate total market value
  const totalMarketValue = nfts.reduce((sum, nft) => {
    const value = (nft.floorPrice && nft.floorPrice > 0) ? nft.floorPrice : nft.burnValue;
    return sum + value;
  }, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              NFT Collection ({nfts.length})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Total Value: ◎ {formatSOL(totalMarketValue)} ({formatUSD(totalMarketValue)})
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(collections).map(([collection, collectionNFTs]) => {
              const collectionValue = collectionNFTs.reduce((sum, nft) => {
                const value = (nft.floorPrice && nft.floorPrice > 0) ? nft.floorPrice : nft.burnValue;
                return sum + value;
              }, 0);
              
              return (
                <div key={collection} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{collection}</h3>
                      <p className="text-xs text-muted-foreground">
                        Value: ◎ {formatSOL(collectionValue)} ({formatUSD(collectionValue)})
                      </p>
                    </div>
                    <Badge variant="secondary">{collectionNFTs.length} NFTs</Badge>
                  </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {collectionNFTs.slice(0, 6).map((nft) => (
                    <button
                      key={nft.mint}
                      onClick={() => setSelectedNFT(nft)}
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                    >
                      {!imageError.has(nft.mint) ? (
                        <NFTImage
                          src={nft.image || ''}
                          alt={nft.name}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(nft.mint)}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <p className="text-white text-xs font-medium truncate">{nft.name}</p>
                        {nft.floorPrice && nft.floorPrice > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-white/80 text-xs">
                              <span>Floor:</span>
                              <span>◎ {formatSOL(nft.floorPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between text-white/60 text-xs">
                              <span>Burn:</span>
                              <span>◎ {formatSOL(nft.burnValue)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-white/80 text-xs">
                            <span>Burn:</span>
                            <span>◎ {formatSOL(nft.burnValue)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {collectionNFTs.length > 6 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCollection(collection)}
                    className="w-full"
                  >
                    View all {collectionNFTs.length} NFTs
                  </Button>
                )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* NFT Detail Dialog */}
      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedNFT?.name}</DialogTitle>
            <DialogDescription>
              {selectedNFT?.collection?.name || 'Unknown Collection'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNFT && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {!imageError.has(selectedNFT.mint) ? (
                  <NFTImage
                    src={selectedNFT.image || ''}
                    alt={selectedNFT.name}
                    fill
                    className="object-contain"
                    onError={() => handleImageError(selectedNFT.mint)}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Details */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {/* Value Info */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Value</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">Burn Value</p>
                        <p className="font-medium">◎ {formatSOL(selectedNFT.burnValue)}</p>
                        <p className="text-xs text-muted-foreground">{formatUSD(selectedNFT.burnValue)}</p>
                      </div>
                      {selectedNFT.floorPrice && (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Floor Price</p>
                          <p className="font-medium">◎ {formatSOL(selectedNFT.floorPrice)}</p>
                          <p className="text-xs text-muted-foreground">{formatUSD(selectedNFT.floorPrice)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedNFT.description && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
                    </div>
                  )}

                  {/* Attributes */}
                  {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Attributes</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNFT.attributes.map((attr, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-muted">
                            <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
                            <p className="text-sm font-medium">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://solscan.io/token/${selectedNFT.mint}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Solscan
                    </Button>
                    {selectedNFT.uri && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedNFT.uri, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Metadata
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collection View Dialog */}
      <Dialog open={!!selectedCollection} onOpenChange={() => setSelectedCollection(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedCollection}</DialogTitle>
            <DialogDescription>
              {collections[selectedCollection || '']?.length || 0} NFTs in this collection
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedCollection && collections[selectedCollection]?.map((nft) => (
                <button
                  key={nft.mint}
                  onClick={() => {
                    setSelectedNFT(nft);
                    setSelectedCollection(null);
                  }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                >
                  {!imageError.has(nft.mint) ? (
                    <NFTImage
                      src={nft.image || ''}
                      alt={nft.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(nft.mint)}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-medium truncate">{nft.name}</p>
                    {nft.floorPrice && nft.floorPrice > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-white/80 text-xs">
                          <span>Floor:</span>
                          <span>◎ {formatSOL(nft.floorPrice)}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60 text-xs">
                          <span>Burn:</span>
                          <span>◎ {formatSOL(nft.burnValue)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-white/80 text-xs">
                        <span>Burn:</span>
                        <span>◎ {formatSOL(nft.burnValue)}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}