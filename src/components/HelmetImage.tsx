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

  // Enhanced fallback display
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-4">
      {/* Helmet icon with brand-specific styling */}
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-3">
        <div className="text-2xl">🛡️</div>
      </div>

      {/* Brand and model info */}
      <div className="text-center">
        <div className="text-sm font-bold text-gray-800 mb-1">{brand}</div>
        <div className="text-xs text-gray-600 font-medium leading-tight">{name}</div>
        <div className="text-xs text-gray-400 mt-1">{category}</div>
      </div>

      {/* Amazon link indicator if available */}
      {amazonUrl && (
        <div className="absolute top-2 right-2">
          <div className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full border border-orange-200">
            Amazon
          </div>
        </div>
      )}

      {/* Click overlay for Amazon links */}
      {amazonUrl && (
        <a
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 hover:bg-blue-50 hover:bg-opacity-20 transition-colors rounded-lg"
          aria-label={`View ${brand} ${name} on Amazon`}
        />
      )}
    </div>
  );
}