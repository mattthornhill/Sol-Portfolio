"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenBalance } from '@/types/portfolio';
import Image from 'next/image';

interface TokenListProps {
  tokens: TokenBalance[];
}

export function TokenList({ tokens }: TokenListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatAmount = (amount: number, decimals = 2) => {
    if (amount === 0) return '0';
    if (amount < 0.01) return '<0.01';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No tokens found in the selected wallets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token) => (
            <div
              key={token.mint}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {token.logoURI ? (
                  <div className="relative w-10 h-10">
                    <Image
                      src={token.logoURI}
                      alt={token.symbol || 'Token'}
                      width={40}
                      height={40}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {token.symbol?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="font-medium">{token.symbol || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-medium">{formatCurrency(token.valueUSD || token.value || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatAmount(token.uiAmount)} {token.symbol}
                </p>
                {token.priceUSD && typeof token.priceUSD === 'number' && (
                  <p className="text-xs text-muted-foreground">
                    @ ${token.priceUSD.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}