'use client';

import { useEffect } from 'react';
import { Helmet } from '@/types/helmet';
import {
  initializeConversionTracking,
  trackAdvancedHelmetView,
  trackAdvancedAffiliateClick
} from '@/utils/analytics';

interface HelmetDetailTrackerProps {
  helmet: Helmet;
}

export default function HelmetDetailTracker({ helmet }: HelmetDetailTrackerProps) {
  useEffect(() => {
    // Initialize conversion tracking
    initializeConversionTracking();

    // Track helmet view
    trackAdvancedHelmetView({
      id: helmet.id.toString(),
      name: helmet.name,
      brand: helmet.brand,
      category: helmet.category,
      safety_score: helmet.safety_score,
      star_rating: helmet.star_rating,
      min_price: helmet.min_price
    }, 'direct_link');
  }, [helmet]);

  return null; // This component is only for tracking
}

// Enhanced Amazon button with tracking
interface TrackedAmazonButtonProps {
  helmet: Helmet;
  url: string;
  type: 'direct' | 'search';
  children: React.ReactNode;
  className?: string;
}

export function TrackedAmazonButton({ helmet, url, type, children, className }: TrackedAmazonButtonProps) {
  const handleClick = () => {
    trackAdvancedAffiliateClick({
      id: helmet.id.toString(),
      name: helmet.name,
      brand: helmet.brand,
      category: helmet.category,
      star_rating: helmet.star_rating,
      safety_score: helmet.safety_score,
      min_price: helmet.min_price
    }, 'amazon', type);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}