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
import { useMultiplePortfolios, usePortfolioSummary } from '@/hooks/usePortfolio';
import { Loader2, TrendingUp, Wallet, Coins, Image, ArrowLeft, Filter, RefreshCw, Flame, Copy, Check } from 'lucide-react';
import { PortfolioStats } from '@/components/portfolio/portfolio-stats';
import { TokenList } from '@/components/portfolio/token-list';
import { WalletBreakdown } from '@/components/portfolio/wallet-breakdown';
import { NFTGallery } from '@/components/portfolio/nft-gallery';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { NFTAsset } from '@/types/portfolio';

function PortfolioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWalletStore();
  const validWallets = wallets.filter(w => w.isValid);
  
  // Initialize with wallet from query param if provided
  const walletFromQuery = searchParams.get('wallet');
  const initialWallet = walletFromQuery && validWallets.find(w => w.address === walletFromQuery) 
    ? walletFromQuery 
    : 'all';
    
  const [selectedWallet, setSelectedWallet] = useState<string>(initialWallet);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Update selected wallet when query param changes
  useEffect(() => {
    if (walletFromQuery && validWallets.find(w => w.address === walletFromQuery)) {
      setSelectedWallet(walletFromQuery);
    }
  }, [walletFromQuery, validWallets]);
  
  // Filter addresses based on selection
  const addresses = selectedWallet === 'all' 
    ? validWallets.map(w => w.address)
    : validWallets.filter(w => w.address === selectedWallet).map(w => w.address);

  const { data: portfolios, isLoading, error, refetch, isFetching } = useMultiplePortfolios(addresses, autoRefresh);
  
  // Fetch NFTs
  const { data: nfts, isLoading: nftsLoading, refetch: refetchNFTs } = useQuery({
    queryKey: ['nfts', addresses],
    queryFn: async () => {
      const response = await axios.post('/api/nfts', { addresses });
      return response.data.nfts as NFTAsset[];
    },
    enabled: addresses.length > 0,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (garbage collection time)
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
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Analysis</h1>
            <p className="text-muted-foreground mt-1">
              {selectedWallet === 'all' 
                ? `Analyzing ${summary.walletCount} wallet${summary.walletCount !== 1 ? 's' : ''}`
                : `Analyzing ${validWallets.find(w => w.address === selectedWallet)?.nickname || selectedWallet.slice(0, 8) + '...'}`
              }
            </p>
            {selectedWallet !== 'all' && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedWallet}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedWallet);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedWallet !== 'all' && (
              <Button 
                onClick={() => router.push(`/dashboard/burn-calculator?wallet=${selectedWallet}`)}
                variant="outline"
              >
                <Flame className="h-4 w-4 mr-2" />
                Burn NFTs
              </Button>
            )}
            <Button
              variant={autoRefresh ? "outline" : "ghost"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "Auto-refresh is ON (every 2 minutes)" : "Auto-refresh is OFF"}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
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
        
        {/* Wallet Filter */}
        {validWallets.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      All Wallets ({validWallets.length})
                    </SelectItem>
                    {validWallets.map((wallet) => (
                      <SelectItem key={wallet.address} value={wallet.address}>
                        {wallet.nickname || `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Only show loading overlay on initial load, not on background refresh */}

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

export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  );
}