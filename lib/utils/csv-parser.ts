import Papa from 'papaparse';
import { ImportedWallet } from '@/types/wallet';
import { validateWalletAddress } from '@/lib/solana/validation';

export interface CSVParseResult {
  wallets: ImportedWallet[];
  errors: string[];
}

export async function parseWalletCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const wallets: ImportedWallet[] = [];
    const errors: string[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(`Row ${error.row}: ${error.message}`);
          });
        }

        results.data.forEach((row: any, index: number) => {
          // Try to find address in various column names
          const address = row.address || row.wallet || row.publicKey || row.Address || row.Wallet || '';
          const nickname = row.nickname || row.name || row.label || row.Name || '';

          if (!address) {
            errors.push(`Row ${index + 2}: No wallet address found`);
            return;
          }

          const validation = validateWalletAddress(address);
          
          wallets.push({
            address: address.trim(),
            nickname: nickname.trim() || undefined,
            isValid: validation.isValid,
            error: validation.error
          });
        });

        resolve({ wallets, errors });
      },
      error: (error) => {
        errors.push(`CSV parsing error: ${error.message}`);
        resolve({ wallets, errors });
      }
    });
  });
}

export function generateSampleCSV(): string {
  const headers = ['address', 'nickname'];
  const sampleData = [
    ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC Wallet'],
    ['So11111111111111111111111111111111111111112', 'Wrapped SOL'],
    ['4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 'RAY Token']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}