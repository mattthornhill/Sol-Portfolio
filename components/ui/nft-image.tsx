"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface NFTImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  onError?: () => void;
}

const IPFS_GATEWAYS = [
  'https://nftstorage.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

export function NFTImage({ src, alt, className, fill, sizes, onError }: NFTImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setImageError(false);
    setGatewayIndex(0);
  }, [src]);

  const handleError = () => {
    // If it's an IPFS URL and we have more gateways to try
    if (src.includes('/ipfs/') && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const ipfsHash = src.split('/ipfs/')[1];
      const nextGateway = IPFS_GATEWAYS[gatewayIndex + 1];
      console.log(`Trying next IPFS gateway for ${alt}: ${nextGateway}`);
      setCurrentSrc(nextGateway + ipfsHash);
      setGatewayIndex(gatewayIndex + 1);
    } else {
      setImageError(true);
      onError?.();
    }
  };

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={handleError}
    />
  );
}