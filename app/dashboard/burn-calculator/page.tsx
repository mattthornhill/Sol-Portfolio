"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet-store';
import { NFTAsset } from '@/types/portfolio';
import { Loader2, Flame, DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';
import { NFTGrid } from '@/components/nft/nft-grid';
import { BurnSummary } from '@/components/nft/burn-summary';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export default function BurnCalculatorPage() {
  const router = useRouter();
  const { wallets } = useWalletStore();
  const validWallets = wallets.filter(w => w.isValid);
  const addresses = validWallets.map(w => w.address);
  const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());
  const [priceFilter, setPriceFilter] = useState<'all' | 'worthless' | 'valuable'>('all');

  const { data: nfts, isLoading, error, refetch } = useQuery({
    queryKey: ['nfts', addresses],
    queryFn: async () => {
      const response = await axios.post('/api/nfts', { addresses });
      return response.data.nfts as NFTAsset[];
    },
    enabled: addresses.length > 0,
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (addresses.length === 0) {
      router.push('/dashboard/wallets');
    }
  }, [addresses.length, router]);

  if (addresses.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading NFTs from {addresses.length} wallets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">Failed to fetch NFT data</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredNFTs = nfts?.filter(nft => {
    if (priceFilter === 'worthless') {
      return !nft.hasMarketValue || nft.floorPrice === 0;
    }
    if (priceFilter === 'valuable') {
      return nft.hasMarketValue && nft.floorPrice && nft.floorPrice > 0;
    }
    return true;
  }) || [];

  const selectedNFTData = filteredNFTs.filter(nft => selectedNFTs.has(nft.mint));

  const toggleNFT = (mint: string) => {
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(mint)) {
      newSelected.delete(mint);
    } else {
      newSelected.add(mint);
    }
    setSelectedNFTs(newSelected);
  };

  const selectAll = () => {
    const allMints = new Set(filteredNFTs.map(nft => nft.mint));
    setSelectedNFTs(allMints);
  };

  const clearSelection = () => {
    setSelectedNFTs(new Set());
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/portfolio')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">NFT Burn Calculator</h1>
            <p className="text-muted-foreground mt-1">
              Calculate SOL recovery value from burning NFTs
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Important Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Burning NFTs is permanent and cannot be undone. Always verify the floor price before burning.
            Some NFTs may have sentimental or future value despite current low prices.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NFT Grid - 2 columns */}
        <div className="lg:col-span-2">
          <NFTGrid
            nfts={filteredNFTs}
            selectedNFTs={selectedNFTs}
            onToggleNFT={toggleNFT}
            onSelectAll={selectAll}
            onClearSelection={clearSelection}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
          />
        </div>

        {/* Burn Summary - 1 column */}
        <div>
          <BurnSummary
            selectedNFTs={selectedNFTData}
            onBurn={() => {
              // Clear selection and refetch NFTs after burning
              setSelectedNFTs(new Set());
              refetch();
              toast.success('NFT data refreshed');
            }}
          />
        </div>
      </div>
    </div>
  );
}