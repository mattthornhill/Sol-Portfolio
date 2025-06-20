import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImportedWallet } from '@/types/wallet';

interface WalletStore {
  wallets: ImportedWallet[];
  addWallets: (wallets: ImportedWallet[]) => void;
  removeWallet: (address: string) => void;
  clearWallets: () => void;
  getValidWallets: () => ImportedWallet[];
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      wallets: [],
      
      addWallets: (newWallets: ImportedWallet[]) => {
        set((state) => {
          const existingAddresses = new Set(state.wallets.map(w => w.address));
          const uniqueNewWallets = newWallets.filter(w => !existingAddresses.has(w.address));
          return { wallets: [...state.wallets, ...uniqueNewWallets] };
        });
      },
      
      removeWallet: (address: string) => {
        set((state) => ({
          wallets: state.wallets.filter(w => w.address !== address)
        }));
      },
      
      clearWallets: () => {
        set({ wallets: [] });
      },
      
      getValidWallets: () => {
        return get().wallets.filter(w => w.isValid);
      }
    }),
    {
      name: 'wallet-storage',
    }
  )
);