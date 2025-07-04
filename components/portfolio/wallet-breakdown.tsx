"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletPortfolio } from '@/types/portfolio';
import { ImportedWallet } from '@/types/wallet';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface WalletBreakdownProps {
  portfolios: WalletPortfolio[];
  wallets: ImportedWallet[];
}

export function WalletBreakdown({ portfolios, wallets }: WalletBreakdownProps) {
  const router = useRouter();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getWalletNickname = (address: string) => {
    const wallet = wallets.find(w => w.address === address);
    return wallet?.nickname;
  };
  
  // Sort portfolios by value (highest first)
  const sortedPortfolios = [...portfolios].sort((a, b) => b.totalValue - a.totalValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPortfolios.map((portfolio) => {
            const nickname = getWalletNickname(portfolio.address);
            const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
            const percentage = totalPortfolioValue > 0 ? (portfolio.totalValue / totalPortfolioValue) * 100 : 0;
            
            return (
              <div
                key={portfolio.address}
                className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/portfolio?wallet=${portfolio.address}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{truncateAddress(portfolio.address)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://solscan.io/account/${portfolio.address}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    {nickname && (
                      <p className="text-sm text-muted-foreground">{nickname}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium">{formatCurrency(portfolio.totalValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Percentage</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}