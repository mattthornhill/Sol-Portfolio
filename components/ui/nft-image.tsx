"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { NFTPlaceholder } from './nft-placeholder';

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
  const [imageError, setImageError] = useState(!src);
  const [gatewayIndex, setGatewayIndex] = useState(0);

  useEffect(() => {
    if (!src) {
      setImageError(true);
      return;
    }
    setCurrentSrc(src);
    setImageError(false);
    setGatewayIndex(0);
  }, [src]);

  const handleError = () => {
    console.error(`Image failed to load for ${alt}: ${currentSrc}`);
    
    // If it's an IPFS URL and we have more gateways to try
    if (src.includes('/ipfs/') && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const ipfsHash = src.split('/ipfs/')[1];
      const nextGateway = IPFS_GATEWAYS[gatewayIndex + 1];
      console.log(`Trying next IPFS gateway for ${alt}: ${nextGateway}${ipfsHash}`);
      setCurrentSrc(nextGateway + ipfsHash);
      setGatewayIndex(gatewayIndex + 1);
    } else {
      console.error(`All gateways failed for ${alt}, original src: ${src}`);
      setImageError(true);
      onError?.();
    }
  };

  if (imageError) {
    // Use a custom placeholder based on the NFT name
    return <NFTPlaceholder name={alt} className={className} />;
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