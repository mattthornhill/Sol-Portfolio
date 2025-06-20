"use client";

import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface NFTPlaceholderProps {
  name: string;
  className?: string;
}

export function NFTPlaceholder({ name, className }: NFTPlaceholderProps) {
  return (
    <div className={cn("w-full h-full bg-muted flex items-center justify-center", className)}>
      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
    </div>
  );
}