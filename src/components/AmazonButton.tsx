'use client';

import { useEffect, useState } from 'react';
import { getButtonConfig, trackButtonImpression, trackButtonClick } from '@/utils/abTesting';
import { trackAdvancedAffiliateClick } from '@/utils/analytics';
import type { ABTestVariant } from '@/utils/abTesting';
import type { Helmet } from '@/types/helmet';

interface AmazonButtonProps {
  helmet: Helmet;
  className?: string;
  testId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export default function AmazonButton({
  helmet,
  className = '',
  testId = 'amazon_button_color_test_1',
  size = 'md',
  variant = 'primary'
}: AmazonButtonProps) {
  const [buttonConfig, setButtonConfig] = useState<ABTestVariant['config'] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get A/B test configuration
    const config = getButtonConfig(testId);
    setButtonConfig(config);
    setIsLoaded(true);

    // Track impression when component mounts
    if (config) {
      trackButtonImpression(testId);
    }
  }, [testId]);

  const handleClick = () => {
    // Track A/B test click
    if (buttonConfig) {
      trackButtonClick(testId);
    }

    // Track advanced affiliate click for analytics
    trackAdvancedAffiliateClick(helmet, 'amazon', 'direct');

    // Open Amazon with affiliate link
    const amazonUrl = helmet.amazon_url ||
      `https://amazon.com/s?k=${encodeURIComponent(`${helmet.brand} ${helmet.name} helmet`)}&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'}`;

    window.open(amazonUrl, '_blank');
  };

  // Fallback configuration if no A/B test
  const defaultConfig: ABTestVariant['config'] = {
    buttonText: 'View on Amazon',
    buttonColor: 'orange',
    buttonSize: size,
    buttonStyle: 'solid',
    iconPosition: 'right',
    showPrice: true,
    showRating: false
  };

  const config = buttonConfig || defaultConfig;

  // Color mappings
  const colorClasses = {
    orange: {
      solid: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500',
      outline: 'border-orange-500 text-orange-600 hover:bg-orange-50',
      ghost: 'text-orange-600 hover:bg-orange-50'
    },
    blue: {
      solid: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      outline: 'border-blue-600 text-blue-600 hover:bg-blue-50',
      ghost: 'text-blue-600 hover:bg-blue-50'
    },
    green: {
      solid: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      outline: 'border-green-600 text-green-600 hover:bg-green-50',
      ghost: 'text-green-600 hover:bg-green-50'
    },
    red: {
      solid: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      outline: 'border-red-600 text-red-600 hover:bg-red-50',
      ghost: 'text-red-600 hover:bg-red-50'
    },
    purple: {
      solid: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600',
      outline: 'border-purple-600 text-purple-600 hover:bg-purple-50',
      ghost: 'text-purple-600 hover:bg-purple-50'
    },
    yellow: {
      solid: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500',
      outline: 'border-yellow-500 text-yellow-600 hover:bg-yellow-50',
      ghost: 'text-yellow-600 hover:bg-yellow-50'
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Style classes
  const styleClasses = {
    solid: 'border',
    outline: 'border-2 bg-white',
    ghost: 'border-0 bg-transparent'
  };

  const buttonColorClass = colorClasses[config.buttonColor || 'orange'];
  const buttonStyleClass = buttonColorClass[config.buttonStyle || 'solid'];
  const buttonSizeClass = sizeClasses[config.buttonSize || 'md'];
  const baseStyleClass = styleClasses[config.buttonStyle || 'solid'];

  const amazonIcon = (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.045 18.02c9.23 6.8 22.662 6.8 23.93 0 .06-.23-.17-.46-.48-.34-7.06 3.66-17.78 3.57-22.99-.05-.38-.26-.82.15-.46.39zm2.8-3.51c.5-.64 3.29-.3 4.52.08 1.23.38 2.92 1.2 3.3 1.75.37.55-.05.86-.5.42-.45-.45-1.32-1.05-2.47-1.35-1.15-.3-3.63-.74-4.85.1z"/>
      <path d="M18.87 9.39c0-2.3-.62-3.93-1.87-4.9-1.24-.96-3.08-1.45-5.51-1.45-4.94 0-7.41 2.25-7.41 6.75h2.48c0-1.8.47-3.15 1.41-4.05.94-.9 2.31-1.35 4.11-1.35 1.56 0 2.73.33 3.51.98.78.66 1.17 1.65 1.17 2.97v.75l-4.5.68c-2.25.34-3.87.85-4.87 1.53s-1.5 1.71-1.5 3.12c0 1.2.42 2.16 1.26 2.88.84.72 1.98 1.08 3.42 1.08 1.92 0 3.36-.69 4.32-2.07h.15l.3 1.68h2.17v-8.6zm-2.55 5.4c0 .96-.37 1.74-1.11 2.34-.74.6-1.71.9-2.91.9-.96 0-1.68-.21-2.16-.63-.48-.42-.72-.99-.72-1.71 0-.84.33-1.47.99-1.89.66-.42 1.71-.71 3.15-.87l2.76-.42v2.28z"/>
    </svg>
  );

  const buttonIcon = config.iconPosition !== 'none' ? amazonIcon : null;

  // Show loading state while A/B test loads
  if (!isLoaded) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${buttonSizeClass} ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        className={`
          ${baseStyleClass}
          ${buttonStyleClass}
          ${buttonSizeClass}
          ${className}
          font-medium rounded-md transition-colors duration-200
          flex items-center justify-center space-x-2 w-full
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
          shadow-sm hover:shadow-md
        `}
        aria-label={`Buy ${helmet.brand} ${helmet.name} on Amazon`}
      >
        {config.iconPosition === 'left' && buttonIcon}
        <span>{config.buttonText || 'View on Amazon'}</span>
        {config.iconPosition === 'right' && buttonIcon}
      </button>

      {/* Additional elements based on A/B test config */}
      {config.urgencyText && (
        <div className="text-xs text-orange-600 font-medium text-center">
          {config.urgencyText}
        </div>
      )}

      {config.ctaText && (
        <div className="text-xs text-green-600 font-medium text-center">
          {config.ctaText}
        </div>
      )}

      {config.showPrice && helmet.min_price && (
        <div className="text-xs text-gray-600 text-center">
          From ${helmet.min_price}
        </div>
      )}

      {config.showRating && (
        <div className="text-xs text-center">
          <span className="text-yellow-500">
            {'★'.repeat(helmet.star_rating)}{'☆'.repeat(5 - helmet.star_rating)}
          </span>
          <span className="text-gray-600 ml-1">({helmet.star_rating}/5)</span>
        </div>
      )}
    </div>
  );
}

// Alternative Amazon Search Button (for helmets without direct links)
export function AmazonSearchButton({
  helmet,
  className = '',
  testId = 'amazon_button_color_test_1'
}: AmazonButtonProps) {
  const [buttonConfig, setButtonConfig] = useState<ABTestVariant['config'] | null>(null);

  useEffect(() => {
    const config = getButtonConfig(testId);
    setButtonConfig(config);

    if (config) {
      trackButtonImpression(testId);
    }
  }, [testId]);

  const handleClick = () => {
    if (buttonConfig) {
      trackButtonClick(testId);
    }

    trackAdvancedAffiliateClick(helmet, 'amazon', 'search');

    const searchUrl = `https://amazon.com/s?k=${encodeURIComponent(`${helmet.brand} ${helmet.name} helmet`)}&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'}`;
    window.open(searchUrl, '_blank');
  };

  const config = buttonConfig || {
    buttonText: 'Search on Amazon',
    buttonColor: 'orange' as const,
    buttonSize: 'md' as const,
    buttonStyle: 'outline' as const,
    iconPosition: 'right' as const
  };

  return (
    <button
      onClick={handleClick}
      className={`
        px-4 py-2 text-sm font-medium rounded-md border-2
        border-orange-500 text-orange-600 bg-white hover:bg-orange-50
        transition-colors duration-200 flex items-center justify-center space-x-2 w-full
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={`Search for ${helmet.brand} ${helmet.name} on Amazon`}
    >
      {config.iconPosition === 'left' && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      )}
      <span>{config.buttonText || 'Search on Amazon'}</span>
      {config.iconPosition === 'right' && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      )}
    </button>
  );
}

// Simplified Amazon Link (for comparison/detail pages)
export function AmazonLink({
  helmet,
  className = '',
  children,
  testId = 'amazon_button_color_test_1'
}: AmazonButtonProps & { children?: React.ReactNode }) {
  const handleClick = () => {
    // Track click for A/B testing
    trackButtonClick(testId);

    // Track analytics
    trackAdvancedAffiliateClick(helmet, 'amazon', 'direct');
  };

  const amazonUrl = helmet.amazon_url ||
    `https://amazon.com/s?k=${encodeURIComponent(`${helmet.brand} ${helmet.name} helmet`)}&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'}`;

  return (
    <a
      href={amazonUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`
        inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800
        underline decoration-1 underline-offset-2 hover:decoration-2
        transition-all duration-200 ${className}
      `}
    >
      {children || (
        <>
          <span>View on Amazon</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </>
      )}
    </a>
  );
}