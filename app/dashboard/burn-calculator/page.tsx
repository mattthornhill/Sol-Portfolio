"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWalletStore } from '@/store/wallet-store';
import { NFTAsset } from '@/types/portfolio';
import { Loader2, Flame, DollarSign, AlertCircle, ArrowLeft, Wallet, Lock, CheckSquare, Filter } from 'lucide-react';
import { NFTGrid } from '@/components/nft/nft-grid';
import { BurnSummary } from '@/components/nft/burn-summary';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';

function BurnCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWalletStore();
  const { publicKey } = useWallet();
  const validWallets = wallets.filter(w => w.isValid);
  
  // Initialize with wallet from query param if provided
  const walletFromQuery = searchParams.get('wallet');
  const initialWallet = walletFromQuery && validWallets.find(w => w.address === walletFromQuery) 
    ? walletFromQuery 
    : validWallets[0]?.address || '';
    
  const [selectedWallet, setSelectedWallet] = useState<string>(initialWallet);
  const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());
  const [priceFilter, setPriceFilter] = useState<'all' | 'worthless' | 'valuable'>('all');
  const [walletFilter, setWalletFilter] = useState<'all' | 'connected'>('all');
  
  // Only show NFTs from selected wallet
  const addresses = selectedWallet ? [selectedWallet] : [];

  const { data: nfts, isLoading, error, refetch } = useQuery({
    queryKey: ['nfts', addresses],
    queryFn: async () => {
      const response = await axios.post('/api/nfts', { addresses }, {
        timeout: 300000 // 5 minutes timeout for large wallet counts
      });
      return response.data.nfts as NFTAsset[];
    },
    enabled: addresses.length > 0,
    staleTime: 60000, // 1 minute
    retry: 1, // Only retry once on failure
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
    // Filter by wallet
    if (walletFilter === 'connected' && publicKey) {
      if (nft.owner !== publicKey.toString()) {
        return false;
      }
    }
    
    // Filter by price
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
    const nft = nfts?.find(n => n.mint === mint);
    
    // Only allow selecting NFTs from connected wallet
    if (publicKey && nft?.owner !== publicKey.toString()) {
      toast.error('You can only burn NFTs from your connected wallet');
      return;
    }
    
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(mint)) {
      newSelected.delete(mint);
    } else {
      newSelected.add(mint);
    }
    setSelectedNFTs(newSelected);
  };

  const selectAll = () => {
    // Only select NFTs from connected wallet
    const selectableNFTs = publicKey 
      ? filteredNFTs.filter(nft => nft.owner === publicKey.toString())
      : filteredNFTs;
    const allMints = new Set(selectableNFTs.map(nft => nft.mint));
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
              {selectedWallet && validWallets.find(w => w.address === selectedWallet) 
                ? `Analyzing NFTs from ${validWallets.find(w => w.address === selectedWallet)?.nickname || selectedWallet.slice(0, 8) + '...'}`
                : 'Select a wallet to analyze NFTs'
              }
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
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Burning NFTs is permanent and cannot be undone. Always verify the floor price before burning.
            Some NFTs may have sentimental or future value despite current low prices.
          </p>
          {publicKey ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Connected wallet: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </p>
              {addresses.length > 1 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  ⚠️ You can only burn NFTs from your connected wallet. NFTs from other wallets are shown for reference only.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Connect a wallet to burn NFTs
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Wallet Filter */}
      {validWallets.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {validWallets.map((wallet) => (
                    <SelectItem key={wallet.address} value={wallet.address}>
                      {wallet.nickname || `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Connected wallet filter */}
              {publicKey && (
                <div className="flex items-center gap-2 pl-4 border-l">
                  <Button
                    variant={walletFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWalletFilter('all')}
                  >
                    Show All NFTs
                  </Button>
                  <Button
                    variant={walletFilter === 'connected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWalletFilter('connected')}
                  >
                    Connected Only
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {publicKey && addresses.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span>Can burn (from connected wallet)</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">View only (from other wallets)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

export default function BurnCalculatorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading burn calculator...</p>
        </div>
      </div>
    }>
      <BurnCalculatorContent />
    </Suspense>
  );
}