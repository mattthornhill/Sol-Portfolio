"use client";

import { useState } from 'react';
import { Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportedWallet } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface WalletListProps {
  wallets: ImportedWallet[];
  onRemove: (address: string) => void;
  onClearAll: () => void;
}

export function WalletList({ wallets, onRemove, onClearAll }: WalletListProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const openExplorer = (address: string) => {
    window.open(`https://solscan.io/account/${address}`, '_blank');
  };

  if (wallets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            No wallets imported yet. Import wallets using CSV or add them manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Imported Wallets</CardTitle>
          <CardDescription>
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} ready for analysis
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="text-destructive hover:text-destructive"
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.address}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                wallet.isValid ? "bg-card" : "bg-destructive/5 border-destructive/20"
              )}
            >
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono">
                    {truncateAddress(wallet.address)}
                  </code>
                  {wallet.nickname && (
                    <span className="text-sm text-muted-foreground">
                      ({wallet.nickname})
                    </span>
                  )}
                </div>
                {wallet.error && (
                  <p className="text-xs text-destructive">{wallet.error}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(wallet.address)}
                >
                  {copiedAddress === wallet.address ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openExplorer(wallet.address)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemove(wallet.address)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}