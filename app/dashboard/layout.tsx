import { ReactNode } from 'react';
import Link from 'next/link';
import { Wallet, BarChart3, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Solana Inspector</span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard/wallets">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Wallets
                  </Button>
                </Link>
                <Link href="/dashboard/portfolio">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Portfolio
                  </Button>
                </Link>
                <Link href="/dashboard/burn-calculator">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Burn Calculator
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}