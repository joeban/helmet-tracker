'use client';

import { useState, useEffect } from 'react';
import {
  getStoredComparison,
  removeFromComparison,
  clearComparison,
  analyzeComparison,
  calculateComparisonMetrics,
  generateComparisonLink,
  downloadComparisonJSON,
  trackComparisonView,
  trackComparisonAction,
  ComparisonItem,
  ComparisonAnalysis,
  ComparisonMetrics
} from '@/utils/comparison';
import { analyzeDeal } from '@/utils/priceTracking';
import { TrackedAmazonButton } from '@/components/HelmetDetailTracker';
import { generateHelmetSlug } from '@/utils/helmet-slug';

interface HelmetComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelmetComparison({ isOpen, onClose }: HelmetComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'charts'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [comparisonLink, setComparisonLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentComparison = getStoredComparison();
      setComparison(currentComparison);

      if (currentComparison.length >= 2) {
        setAnalysis(analyzeComparison(currentComparison));
        setMetrics(calculateComparisonMetrics(currentComparison));
      }

      trackComparisonView(currentComparison, 'modal');
    }
  }, [isOpen]);

  const handleRemoveHelmet = (helmetId: number) => {
    const updatedComparison = removeFromComparison(helmetId);
    setComparison(updatedComparison);

    if (updatedComparison.length >= 2) {
      setAnalysis(analyzeComparison(updatedComparison));
      setMetrics(calculateComparisonMetrics(updatedComparison));
    } else {
      setAnalysis(null);
      setMetrics(null);
    }
  };

  const handleClearAll = () => {
    clearComparison();
    setComparison([]);
    setAnalysis(null);
    setMetrics(null);
  };

  const handleShare = () => {
    const link = generateComparisonLink(comparison);
    setComparisonLink(link);
    setShowShareModal(true);
    trackComparisonAction(comparison, 'share');
  };

  const handleExport = () => {
    downloadComparisonJSON(comparison);
    trackComparisonAction(comparison, 'export');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getSafetyScoreColor = (score: number) => {
    if (score <= 10) return 'text-green-600 bg-green-50';
    if (score <= 15) return 'text-blue-600 bg-blue-50';
    if (score <= 20) return 'text-yellow-600 bg-yellow-50';
    if (score <= 25) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Helmet Comparison</h2>
            <p className="text-gray-600 mt-1">
              Compare {comparison.length} helmet{comparison.length !== 1 ? 's' : ''} side by side
            </p>
          </div>
          <div className="flex items-center gap-3">
            {comparison.length >= 2 && (
              <>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Share
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Export
                </button>
              </>
            )}
            {comparison.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {comparison.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">⚖️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No helmets to compare</h3>
              <p className="text-gray-600">Add helmets to your comparison from the homepage or helmet pages</p>
            </div>
          ) : comparison.length === 1 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">➕</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Add more helmets</h3>
              <p className="text-gray-600">Add at least one more helmet to start comparing</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'details', label: 'Detailed Comparison' },
                    { key: 'charts', label: 'Visual Analysis' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as 'overview' | 'details' | 'charts')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && analysis && (
                  <div className="space-y-6">
                    {/* Quick Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">🏆 Safest</h4>
                        <p className="text-sm font-medium">{analysis.safest.brand} {analysis.safest.name}</p>
                        <p className="text-xs text-green-600 mt-1">Score: {analysis.safest.safety_score}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">💰 Cheapest</h4>
                        <p className="text-sm font-medium">{analysis.cheapest.brand} {analysis.cheapest.name}</p>
                        <p className="text-xs text-blue-600 mt-1">${analysis.cheapest.min_price}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">⭐ Best Value</h4>
                        <p className="text-sm font-medium">{analysis.bestValue.brand} {analysis.bestValue.name}</p>
                        <p className="text-xs text-purple-600 mt-1">
                          {analysis.bestValue.star_rating}★ / ${analysis.bestValue.min_price}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">🌟 Most Popular</h4>
                        <p className="text-sm font-medium">{analysis.mostPopular.brand} {analysis.mostPopular.name}</p>
                        <p className="text-xs text-orange-600 mt-1">{analysis.mostPopular.star_rating}★ rating</p>
                      </div>
                    </div>

                    {/* Helmet Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {comparison.map(item => {
                        const dealAnalysis = analyzeDeal(item.helmet);
                        return (
                          <div key={item.helmet.id} className="bg-gray-50 rounded-lg p-4 relative">
                            <button
                              onClick={() => handleRemoveHelmet(item.helmet.id)}
                              className="absolute top-2 right-2 text-red-600 hover:text-red-800 font-bold text-lg"
                            >
                              ×
                            </button>

                            <div className="mb-3">
                              <h4 className="font-bold text-gray-900 text-sm mb-1">
                                {item.helmet.brand} {item.helmet.name}
                              </h4>
                              <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                                {item.helmet.category}
                              </span>
                            </div>

                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-600">Safety Score:</span>
                                <span className={`ml-2 px-2 py-1 rounded font-medium ${getSafetyScoreColor(item.helmet.safety_score)}`}>
                                  {item.helmet.safety_score}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Rating:</span>
                                <span className="ml-2 font-medium">
                                  {renderStars(item.helmet.star_rating)} ({item.helmet.star_rating}/5)
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Price:</span>
                                <span className="ml-2 font-bold text-green-600">${item.helmet.min_price}</span>
                              </div>
                              {dealAnalysis.recommendation !== 'fair_price' && (
                                <div className="text-xs">
                                  <span className={`px-2 py-1 rounded ${
                                    dealAnalysis.recommendation === 'excellent_deal' ? 'bg-green-100 text-green-800' :
                                    dealAnalysis.recommendation === 'good_deal' ? 'bg-blue-100 text-blue-800' :
                                    dealAnalysis.recommendation === 'overpriced' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {dealAnalysis.recommendation.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 space-y-2">
                              <TrackedAmazonButton
                                helmet={item.helmet}
                                url={item.helmet.amazon_url || `https://amazon.com/s?k=${encodeURIComponent(item.helmet.brand + ' ' + item.helmet.name)}`}
                                type={item.helmet.amazon_url ? 'direct' : 'search'}
                                className="w-full inline-flex items-center justify-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors"
                              >
                                🛒 View on Amazon
                              </TrackedAmazonButton>
                              <a
                                href={`/helmet/${generateHelmetSlug(item.helmet.brand, item.helmet.name)}`}
                                className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors"
                              >
                                📋 Full Details
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Feature
                          </th>
                          {comparison.map(item => (
                            <th key={item.helmet.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {item.helmet.brand} {item.helmet.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Safety Score</td>
                          {comparison.map(item => (
                            <td key={item.helmet.id} className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${getSafetyScoreColor(item.helmet.safety_score)}`}>
                                {item.helmet.safety_score}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Star Rating</td>
                          {comparison.map(item => (
                            <td key={item.helmet.id} className="px-6 py-4 whitespace-nowrap text-sm">
                              {renderStars(item.helmet.star_rating)} ({item.helmet.star_rating}/5)
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Price Range</td>
                          {comparison.map(item => (
                            <td key={item.helmet.id} className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="font-bold text-green-600">${item.helmet.min_price}</div>
                              <div className="text-xs text-gray-500">
                                Avg: ${item.helmet.avg_price} | Max: ${item.helmet.max_price}
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Category</td>
                          {comparison.map(item => (
                            <td key={item.helmet.id} className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                {item.helmet.category}
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Availability</td>
                          {comparison.map(item => (
                            <td key={item.helmet.id} className="px-6 py-4 whitespace-nowrap text-sm">
                              {item.helmet.available_count} of {item.helmet.listing_count} listings
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && metrics && (
                  <div className="space-y-8">
                    {/* Metrics Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Safety Score Range</h4>
                        <div className="space-y-2 text-sm">
                          <div>Min: <span className="font-bold">{metrics.safetyRange.min}</span></div>
                          <div>Max: <span className="font-bold">{metrics.safetyRange.max}</span></div>
                          <div>Avg: <span className="font-bold">{metrics.safetyRange.average.toFixed(1)}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                        <div className="space-y-2 text-sm">
                          <div>Min: <span className="font-bold">${metrics.priceRange.min}</span></div>
                          <div>Max: <span className="font-bold">${metrics.priceRange.max}</span></div>
                          <div>Avg: <span className="font-bold">${metrics.priceRange.average.toFixed(0)}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Star Rating Range</h4>
                        <div className="space-y-2 text-sm">
                          <div>Min: <span className="font-bold">{metrics.ratingRange.min}★</span></div>
                          <div>Max: <span className="font-bold">{metrics.ratingRange.max}★</span></div>
                          <div>Avg: <span className="font-bold">{metrics.ratingRange.average.toFixed(1)}★</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Category Distribution</h4>
                        <div className="space-y-2">
                          {Object.entries(metrics.categoryDistribution).map(([category, count]) => (
                            <div key={category} className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Brand Distribution</h4>
                        <div className="space-y-2">
                          {Object.entries(metrics.brandDistribution).map(([brand, count]) => (
                            <div key={brand} className="flex justify-between text-sm">
                              <span>{brand}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Additional Insights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">MIPS Helmets:</span>
                          <span className="ml-2 font-medium">{metrics.mipsCount} of {comparison.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price Spread:</span>
                          <span className="ml-2 font-medium">${(metrics.priceRange.max - metrics.priceRange.min).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Share Comparison</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comparison Link
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={comparisonLink}
                  readOnly
                  className="flex-1 rounded-l-md border border-r-0 border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(comparisonLink)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}