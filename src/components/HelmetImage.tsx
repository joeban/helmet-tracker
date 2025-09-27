'use client';

import { useState } from 'react';
import { isValidAmazonImageUrl, getHelmetFallbackImage } from '@/utils/amazonImages';

interface HelmetImageProps {
  brand: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  amazonUrl?: string | null;
  className?: string;
}

export default function HelmetImage({
  brand,
  name,
  category,
  imageUrl,
  amazonUrl,
  className = "w-full h-full object-contain hover:scale-105 transition-transform duration-200"
}: HelmetImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Determine what image to show
  const shouldShowImage = imageUrl && !imageError && isValidAmazonImageUrl(imageUrl);

  if (shouldShowImage) {
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${brand} ${name} helmet`}
          className={className}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
        {/* Amazon compliance: Images must link to Amazon */}
        {amazonUrl && (
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10"
            aria-label={`View ${brand} ${name} on Amazon`}
          />
        )}
      </div>
    );
  }

  // Fallback display
  return (
    <div className="text-gray-500 text-center w-full h-full flex flex-col items-center justify-center">
      <div className="text-4xl mb-2">🚴</div>
      <div className="text-sm font-medium">{brand}</div>
      <div className="text-xs text-gray-400">{name}</div>
      <div className="text-xs text-gray-400 mt-1">{category}</div>
    </div>
  );
}