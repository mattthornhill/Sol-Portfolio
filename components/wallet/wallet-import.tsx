"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseWalletCSV, generateSampleCSV } from '@/lib/utils/csv-parser';
import { validateWalletAddress } from '@/lib/solana/validation';
import { ImportedWallet } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface WalletImportProps {
  onImport: (wallets: ImportedWallet[]) => void;
}

export function WalletImport({ onImport }: WalletImportProps) {
  const [manualAddress, setManualAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setCsvErrors([]);

    try {
      const file = acceptedFiles[0];
      const result = await parseWalletCSV(file);
      
      if (result.errors.length > 0) {
        setCsvErrors(result.errors);
      }

      const validWallets = result.wallets.filter(w => w.isValid);
      if (validWallets.length > 0) {
        onImport(validWallets);
      }
    } catch (error) {
      setCsvErrors(['Failed to parse CSV file']);
    } finally {
      setIsProcessing(false);
    }
  }, [onImport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const handleManualAdd = () => {
    const validation = validateWalletAddress(manualAddress);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid address');
      return;
    }

    onImport([{
      address: manualAddress.trim(),
      nickname: nickname.trim() || undefined,
      isValid: true
    }]);

    setManualAddress('');
    setNickname('');
    setValidationError(null);
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-wallets.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Import from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file containing wallet addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} disabled={isProcessing} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-sm text-primary">Drop the CSV file here...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag & drop a CSV file here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .csv and .txt files
                </p>
              </div>
            )}
          </div>

          {csvErrors.length > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Import Errors</p>
                  <ul className="text-xs text-destructive/80 space-y-0.5">
                    {csvErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              CSV should have columns: address, nickname (optional)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Add Wallet Manually</CardTitle>
          <CardDescription>
            Enter a single wallet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="Enter Solana wallet address..."
                value={manualAddress}
                onChange={(e) => {
                  setManualAddress(e.target.value);
                  setValidationError(null);
                }}
                className={validationError ? "border-destructive" : ""}
              />
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (Optional)</Label>
              <Input
                id="nickname"
                placeholder="e.g., Main Wallet, NFT Collection..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleManualAdd}
              disabled={!manualAddress}
              className="w-full"
            >
              Add Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}