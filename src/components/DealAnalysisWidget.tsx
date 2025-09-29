'use client';

import { useState, useEffect } from 'react';
import { Helmet } from '@/types/helmet';
import { analyzeEnhancedDeals, DealAnalysis } from '@/utils/priceTracking';
import { CompactPriceChart } from './PriceChart';

interface DealAnalysisWidgetProps {
  helmet: Helmet;
  className?: string;
  showChart?: boolean;
}

export default function DealAnalysisWidget({
  helmet,
  className = '',
  showChart = false
}: DealAnalysisWidgetProps) {
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [helmet.id]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const dealAnalysis = analyzeEnhancedDeals(helmet);
      setAnalysis(dealAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze deal');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationDetails = (recommendation: DealAnalysis['recommendation']) => {
    switch (recommendation) {
      case 'excellent_deal':
        return {
          color: 'text-green-700 bg-green-100 border-green-300',
          icon: '🔥',
          message: 'Excellent Deal!',
          description: 'This is a great price. Consider buying now.'
        };
      case 'good_deal':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: '👍',
          message: 'Good Deal',
          description: 'Better than average price. Worth considering.'
        };
      case 'fair_price':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: '⚖️',
          message: 'Fair Price',
          description: 'Around average market price.'
        };
      case 'wait':
        return {
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          icon: '⏰',
          message: 'Consider Waiting',
          description: 'Price is above average. Might drop soon.'
        };
      case 'overpriced':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: '❌',
          message: 'Overpriced',
          description: 'Price is significantly above average.'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: '❓',
          message: 'Unknown',
          description: 'Unable to determine deal quality.'
        };
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  if (loading) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm">{error || 'Deal analysis unavailable'}</p>
          <button
            onClick={loadAnalysis}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const recommendation = getRecommendationDetails(analysis.recommendation);

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${recommendation.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{recommendation.icon}</span>
            <div>
              <h3 className="font-medium">{recommendation.message}</h3>
              <p className="text-xs opacity-80">{recommendation.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{analysis.dealScore}/100</div>
            <div className="text-xs opacity-80">Deal Score</div>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(analysis.currentPrice)}
            </div>
            <div className="text-sm text-gray-500">Current Price</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatPrice(analysis.historicalLow)}
            </div>
            <div className="text-sm text-gray-500">Historical Low</div>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Average Price:</span>
            <span className="font-medium">{formatPrice(analysis.averagePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Historical High:</span>
            <span className="font-medium">{formatPrice(analysis.historicalHigh)}</span>
          </div>
          {analysis.priceDropPercentage > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Recent Drop:</span>
              <span className="font-medium text-green-600">
                {analysis.priceDropPercentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>High</span>
            <span>Current</span>
            <span>Low</span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-green-500 rounded"
              style={{
                width: `${((analysis.historicalHigh - analysis.currentPrice) / (analysis.historicalHigh - analysis.historicalLow)) * 100}%`
              }}
            ></div>
            <div
              className="absolute top-0 w-1 h-full bg-gray-800 rounded"
              style={{
                left: `${((analysis.historicalHigh - analysis.currentPrice) / (analysis.historicalHigh - analysis.historicalLow)) * 100}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatPrice(analysis.historicalHigh)}</span>
            <span>{formatPrice(analysis.historicalLow)}</span>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium">{analysis.confidence}%</div>
            <div className="text-gray-500">Confidence</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium">{analysis.daysAtCurrentPrice}</div>
            <div className="text-gray-500">Days at Price</div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {showChart && (
        <div className="border-t">
          <CompactPriceChart helmet={helmet} className="p-4" />
        </div>
      )}
    </div>
  );
}

// Compact version for cards
export function CompactDealAnalysis({ helmet }: { helmet: Helmet }) {
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = () => {
      try {
        const dealAnalysis = analyzeEnhancedDeals(helmet);
        setAnalysis(dealAnalysis);
      } catch (error) {
        console.warn('Failed to load deal analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [helmet.id]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-gray-500">Analyzing...</span>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getQuickIndicator = (recommendation: DealAnalysis['recommendation'], score: number) => {
    if (score >= 90) return { icon: '🔥', color: 'text-green-700', label: 'Hot Deal' };
    if (score >= 75) return { icon: '👍', color: 'text-green-600', label: 'Good Deal' };
    if (score >= 50) return { icon: '⚖️', color: 'text-yellow-600', label: 'Fair' };
    if (score >= 25) return { icon: '⏰', color: 'text-orange-600', label: 'Wait' };
    return { icon: '❌', color: 'text-red-600', label: 'High' };
  };

  const indicator = getQuickIndicator(analysis.recommendation, analysis.dealScore);

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-lg">{indicator.icon}</span>
      <div className={indicator.color}>
        <span className="font-medium">{indicator.label}</span>
        <span className="ml-1 text-xs">({analysis.dealScore})</span>
      </div>
      {analysis.priceDropPercentage > 5 && (
        <span className="text-xs text-green-600">
          -{analysis.priceDropPercentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// Deal alert suggestion component
export function DealAlertSuggestion({ helmet }: { helmet: Helmet }) {
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const loadAnalysis = () => {
      try {
        const dealAnalysis = analyzeEnhancedDeals(helmet);
        setAnalysis(dealAnalysis);

        // Show suggestion if it's not a great deal but could become one
        if (dealAnalysis.dealScore < 80 && dealAnalysis.confidence > 70) {
          setShowSuggestion(true);
        }
      } catch (error) {
        console.warn('Failed to load deal analysis for suggestion:', error);
      }
    };

    loadAnalysis();
  }, [helmet.id]);

  if (!showSuggestion || !analysis) {
    return null;
  }

  const suggestedPrice = Math.round(analysis.averagePrice * 0.85); // 15% below average

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
      <div className="flex items-start space-x-2">
        <span className="text-blue-500 text-lg">💡</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900">Price Alert Suggestion</h4>
          <p className="text-xs text-blue-700 mt-1">
            Set an alert for ${suggestedPrice} to catch a good deal on this helmet.
            That&apos;s about 15% below the average price of ${analysis.averagePrice.toFixed(0)}.
          </p>
          <button className="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium">
            Create Alert →
          </button>
        </div>
      </div>
    </div>
  );
}