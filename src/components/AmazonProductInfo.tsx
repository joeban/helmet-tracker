'use client';

import { useAmazonProduct } from '@/hooks/useAmazonProduct';
import { Helmet } from '@/types/helmet';
import Image from 'next/image';
import { getHelmetAmazonInfo } from '@/utils/amazonImages';

interface AmazonProductInfoProps {
  helmet: Helmet;
  showImage?: boolean;
  showPrice?: boolean;
  showAvailability?: boolean;
  className?: string;
}

export default function AmazonProductInfo({
  helmet,
  showImage = true,
  showPrice = true,
  showAvailability = true,
  className = ''
}: AmazonProductInfoProps) {
  // Get stored ASIN if available
  const storedInfo = getHelmetAmazonInfo(helmet.brand, helmet.name);

  const { product, loading, error } = useAmazonProduct({
    asin: storedInfo?.asin,
    brand: !storedInfo?.asin ? helmet.brand : undefined,
    model: !storedInfo?.asin ? helmet.model : undefined,
    enabled: true
  });

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {showImage && (
          <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
        )}
        {showPrice && (
          <div className="bg-gray-200 h-6 w-20 rounded mb-2"></div>
        )}
        {showAvailability && (
          <div className="bg-gray-200 h-4 w-24 rounded"></div>
        )}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {showImage && (
          <div className="bg-gray-100 rounded-lg h-48 mb-3 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        <p>Price not available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showImage && product.imageUrl && (
        <div className="relative h-48 mb-3">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {showPrice && (
        <div className="mb-2">
          {product.price ? (
            <div>
              <span className="text-2xl font-bold text-green-600">
                {product.price.displayAmount}
              </span>
              {product.isPrime && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  Prime
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Price unavailable</span>
          )}
        </div>
      )}

      {showAvailability && (
        <div className="text-sm">
          {product.availability ? (
            <span className={product.availability.includes('In Stock')
              ? 'text-green-600'
              : 'text-orange-600'
            }>
              {product.availability}
            </span>
          ) : (
            <span className="text-gray-500">Availability unknown</span>
          )}
        </div>
      )}

      <a
        href={product.detailPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
      >
        View on Amazon
      </a>
    </div>
  );
}