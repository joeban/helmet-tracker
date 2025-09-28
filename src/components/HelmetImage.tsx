'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { isValidAmazonImageUrl } from '@/utils/amazonImages';

interface HelmetImageProps {
  brand: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  amazonUrl?: string | null;
  className?: string;
  priority?: boolean; // For above-the-fold images
}

export default function HelmetImage({
  brand,
  name,
  category,
  imageUrl,
  amazonUrl,
  className = "w-full h-full object-contain hover:scale-105 transition-transform duration-200",
  priority = false
}: HelmetImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const imgRef = useRef<HTMLDivElement>(null);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Determine what image to show
  const shouldShowImage = imageUrl && !imageError && isValidAmazonImageUrl(imageUrl);

  if (shouldShowImage) {
    return (
      <div ref={imgRef} className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {isInView ? (
          <Image
            src={imageUrl}
            alt={`${brand} ${name} helmet`}
            className={className}
            onError={handleImageError}
            onLoad={handleImageLoad}
            width={300}
            height={300}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          // Placeholder while waiting for intersection
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        )}
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

  // Professional fallback display
  return (
    <div ref={imgRef} className="relative w-full h-full bg-white border border-slate-300 rounded-lg shadow-sm flex flex-col items-center justify-center p-5">
      {/* Clean geometric placeholder */}
      <div className="w-14 h-14 border-2 border-slate-400 rounded-lg mb-4 flex items-center justify-center bg-slate-50">
        <div className="w-7 h-7 bg-slate-300 rounded-md"></div>
      </div>

      {/* Brand and model info */}
      <div className="text-center">
        <div className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wider">{brand}</div>
        <div className="text-xs text-slate-600 font-medium leading-tight">{name}</div>
        <div className="text-xs text-slate-500 mt-1">{category}</div>
      </div>

      {/* Amazon link indicator if available */}
      {amazonUrl && (
        <div className="absolute top-3 right-3">
          <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-200 font-medium">
            Available
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