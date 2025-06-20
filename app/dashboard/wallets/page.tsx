"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletImport } from '@/components/wallet/wallet-import';
import { WalletList } from '@/components/wallet/wallet-list';
import { useWalletStore } from '@/store/wallet-store';
import { ImportedWallet } from '@/types/wallet';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

export default function WalletsPage() {
  const router = useRouter();
  const { wallets, addWallets, removeWallet, clearWallets } = useWalletStore();
  const [showImport, setShowImport] = useState(wallets.length === 0);

  const handleImport = (newWallets: ImportedWallet[]) => {
    const validWallets = newWallets.filter(w => w.isValid);
    const invalidCount = newWallets.length - validWallets.length;

    addWallets(newWallets);

    if (validWallets.length > 0) {
      toast.success(`Successfully imported ${validWallets.length} wallet${validWallets.length !== 1 ? 's' : ''}`);
      setShowImport(false);
    }

    if (invalidCount > 0) {
      toast.error(`${invalidCount} wallet${invalidCount !== 1 ? 's' : ''} failed validation`);
    }
  };

  const handleAnalyze = () => {
    if (wallets.filter(w => w.isValid).length === 0) {
      toast.error('No valid wallets to analyze');
      return;
    }
    router.push('/dashboard/portfolio');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Wallet Management</h1>
        </div>
        <p className="text-muted-foreground">
          Import and manage Solana wallets for portfolio analysis
        </p>
      </div>

      <div className="space-y-6">
        {showImport || wallets.length === 0 ? (
          <WalletImport onImport={handleImport} existingWallets={wallets} />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
              >
                Import More Wallets
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={wallets.filter(w => w.isValid).length === 0}
                className="gap-2"
              >
                Analyze Portfolio
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <WalletList
              wallets={wallets}
              onRemove={removeWallet}
              onClearAll={clearWallets}
            />
          </>
        )}
      </div>
    </div>
  );
}