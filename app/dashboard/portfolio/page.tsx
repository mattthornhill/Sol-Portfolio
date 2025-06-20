"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet-store';
import { useMultiplePortfolios, usePortfolioSummary } from '@/hooks/usePortfolio';
import { Loader2, TrendingUp, Wallet, Coins, Image, ArrowLeft } from 'lucide-react';
import { PortfolioStats } from '@/components/portfolio/portfolio-stats';
import { TokenList } from '@/components/portfolio/token-list';
import { WalletBreakdown } from '@/components/portfolio/wallet-breakdown';
import { NFTGallery } from '@/components/portfolio/nft-gallery';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { NFTAsset } from '@/types/portfolio';

export default function PortfolioPage() {
  const router = useRouter();
  const { wallets } = useWalletStore();
  const validWallets = wallets.filter(w => w.isValid);
  const addresses = validWallets.map(w => w.address);

  const { data: portfolios, isLoading, error, refetch, isFetching } = useMultiplePortfolios(addresses);
  
  // Fetch NFTs
  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ['nfts', addresses],
    queryFn: async () => {
      const response = await axios.post('/api/nfts', { addresses });
      return response.data.nfts as NFTAsset[];
    },
    enabled: addresses.length > 0,
    staleTime: 60000, // 1 minute
  });
  
  // Calculate summary with NFT data
  const summary = usePortfolioSummary(portfolios || [], nfts || []);

  // Refetch when wallet addresses change
  useEffect(() => {
    if (addresses.length > 0) {
      refetch();
    }
  }, [addresses.length, refetch]);

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
          <p className="text-muted-foreground">Analyzing {addresses.length} wallets...</p>
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
              <p className="text-destructive">Failed to fetch portfolio data</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/wallets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Wallets
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Analyzing {summary.walletCount} wallet{summary.walletCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      {/* Show loading overlay when fetching */}
      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Updating portfolio data...</span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOL Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalSol, 4)}</div>
            <p className="text-xs text-muted-foreground">
              {portfolios && portfolios.length > 0 && portfolios[0].solBalance > 0
                ? formatCurrency(portfolios.reduce((sum, p) => sum + p.solValue, 0))
                : formatCurrency(summary.totalSol * 30)
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.tokenCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalTokenValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFTs</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.nftCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalNFTValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Stats Chart */}
          <PortfolioStats summary={summary} />
          
          {/* Token List */}
          <TokenList tokens={summary.topTokens} />
          
          {/* NFT Gallery */}
          <NFTGallery 
            nfts={nfts || []} 
            solPrice={portfolios?.[0]?.solPriceUSD || 145}
          />
        </div>

        <div className="space-y-6">
          {/* Wallet Breakdown */}
          <WalletBreakdown portfolios={portfolios || []} wallets={validWallets} />
        </div>
      </div>
    </div>
  );
}