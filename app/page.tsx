import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet, BarChart3, Calculator, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Solana Wallet Inspector
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze multiple Solana wallets simultaneously, calculate NFT burn values, 
            and manage your entire portfolio in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/wallets">
            <Button size="lg" className="gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="https://github.com" target="_blank">
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <Wallet className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Multi-Wallet Import</h3>
            <p className="text-sm text-muted-foreground">
              Import wallets via CSV or add them manually. Analyze up to 100 wallets at once.
            </p>
          </div>
          
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <BarChart3 className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Portfolio Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time USD valuations, token discovery, and comprehensive portfolio insights.
            </p>
          </div>
          
          <div className="space-y-3 p-6 rounded-lg border bg-card">
            <Calculator className="h-10 w-10 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">NFT Burn Calculator</h3>
            <p className="text-sm text-muted-foreground">
              Calculate potential SOL recovery from burning NFTs and compare with floor prices.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}