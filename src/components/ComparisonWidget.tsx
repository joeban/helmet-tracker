'use client';

import { useState, useEffect } from 'react';
import { getStoredComparison, ComparisonItem } from '@/utils/comparison';
import HelmetComparison from './HelmetComparison';

export default function ComparisonWidget() {
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateComparison = () => {
      const currentComparison = getStoredComparison();
      setComparison(currentComparison);
      setIsVisible(currentComparison.length > 0);
    };

    // Initial load
    updateComparison();

    // Listen for storage changes (when helmets are added/removed from comparison)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'helmet_comparison') {
        updateComparison();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case of same-tab updates
    const interval = setInterval(updateComparison, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Comparison Widget */}
      <div className="fixed bottom-20 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-sm">⚖️ Comparison</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {comparison.length}
          </span>
        </div>

        {/* Helmet Preview List */}
        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
          {comparison.map(item => (
            <div key={item.helmet.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="truncate font-medium text-gray-700">
                {item.helmet.brand} {item.helmet.name}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setShowComparison(true)}
            className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Compare Now
          </button>
          {comparison.length >= 2 && (
            <div className="text-xs text-gray-500 text-center">
              Ready to compare {comparison.length} helmets
            </div>
          )}
          {comparison.length === 1 && (
            <div className="text-xs text-gray-500 text-center">
              Add more helmets to compare
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <HelmetComparison
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />
    </>
  );
}

// Individual Add to Comparison Button Component
interface AddToComparisonProps {
  helmet: import('@/types/helmet').Helmet;
  source?: ComparisonItem['source'];
  className?: string;
  variant?: 'button' | 'icon' | 'text';
}

export function AddToComparisonButton({
  helmet,
  source = 'homepage',
  className = '',
  variant = 'button'
}: AddToComparisonProps) {
  const [isInComparison, setIsInComparison] = useState(false);
  const [comparisonCount, setComparisonCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      const comparison = getStoredComparison();
      setIsInComparison(comparison.some(item => item.helmet.id === helmet.id));
      setComparisonCount(comparison.length);
    };

    updateStatus();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'helmet_comparison') {
        updateStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [helmet.id]);

  const handleClick = async () => {
    if (isInComparison) {
      // Remove from comparison
      const { removeFromComparison } = await import('@/utils/comparison');
      removeFromComparison(helmet.id);
    } else {
      // Add to comparison
      const { addToComparison } = await import('@/utils/comparison');
      addToComparison(helmet, source);
    }
  };

  const baseClasses = 'transition-all duration-200 flex items-center justify-center';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} w-8 h-8 rounded-full border border-gray-300 hover:border-blue-500 ${
          isInComparison ? 'bg-blue-100 text-blue-600 border-blue-500' : 'bg-white text-gray-600 hover:text-blue-600'
        } ${className}`}
        title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isInComparison ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          )}
        </svg>
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} text-sm font-medium underline ${
          isInComparison ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        } ${className}`}
      >
        {isInComparison ? '✓ In Comparison' : '+ Compare'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!isInComparison && comparisonCount >= 4}
      className={`${baseClasses} px-3 py-2 rounded text-sm font-medium border ${
        isInComparison
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : comparisonCount >= 4
          ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
      } ${className}`}
    >
      {isInComparison ? (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          In Comparison
        </>
      ) : comparisonCount >= 4 ? (
        'Max Reached'
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Compare
        </>
      )}
    </button>
  );
}