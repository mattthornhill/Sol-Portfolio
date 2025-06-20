import { PublicKey } from '@solana/web3.js';

export function isValidSolanaAddress(address: string): boolean {
  try {
    const publicKey = new PublicKey(address);
    return PublicKey.isOnCurve(publicKey);
  } catch (error) {
    return false;
  }
}

export function validateWalletAddress(address: string): { isValid: boolean; error?: string } {
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Address cannot be empty' };
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
    return { isValid: false, error: 'Invalid address length' };
  }

  if (!isValidSolanaAddress(trimmedAddress)) {
    return { isValid: false, error: 'Invalid Solana address format' };
  }

  return { isValid: true };
}

export function sanitizeWalletList(addresses: string[]): string[] {
  const uniqueAddresses = new Set<string>();
  
  addresses.forEach(address => {
    const trimmed = address.trim();
    if (trimmed && isValidSolanaAddress(trimmed)) {
      uniqueAddresses.add(trimmed);
    }
  });

  return Array.from(uniqueAddresses);
}