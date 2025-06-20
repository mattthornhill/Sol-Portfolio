import { PublicKey } from '@solana/web3.js';

export interface WalletData {
  id: string;
  address: string;
  publicKey: PublicKey;
  nickname?: string;
  addedAt: Date;
  lastScanned?: Date;
}

export interface ImportedWallet {
  address: string;
  nickname?: string;
  isValid: boolean;
  error?: string;
}

export interface WalletImportResult {
  successful: ImportedWallet[];
  failed: ImportedWallet[];
  totalProcessed: number;
}