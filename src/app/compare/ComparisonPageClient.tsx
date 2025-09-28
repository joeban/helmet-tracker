'use client';

import { useState, useEffect } from 'react';
import { Helmet } from '@/types/helmet';
import {
  getStoredComparison,
  addToComparison,
  ComparisonItem
} from '@/utils/comparison';
import HelmetComparison from '@/components/HelmetComparison';
import { AddToComparisonButton } from '@/components/ComparisonWidget';
import { trackAdvancedSearch, trackFilterUsage, initializeConversionTracking } from '@/utils/analytics';
import { useDebounce } from '@/hooks/useDebounce';

interface ComparisonPageClientProps {
  preselectedHelmets: Helmet[];
  allHelmets: Helmet[];
}

export default function ComparisonPageClient({ preselectedHelmets, allHelmets }: ComparisonPageClientProps) {
  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [showFullComparison, setShowFullComparison] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  // Debounce search term for analytics
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Initialize analytics session
  useEffect(() => {
    const id = initializeConversionTracking();
    setSessionId(id);
  }, []);

  // Get unique categories and brands for filters
  const categories = Array.from(new Set(allHelmets.map(h => h.category))).sort();
  const brands = Array.from(new Set(allHelmets.map(h => h.brand))).sort();

  useEffect(() => {
    // Load current comparison
    const currentComparison = getStoredComparison();
    setComparison(currentComparison);

    // Add preselected helmets if any
    if (preselectedHelmets.length > 0) {
      const existingIds = new Set(currentComparison.map(item => item.helmet.id));

      for (const helmet of preselectedHelmets) {
        if (!existingIds.has(helmet.id)) {
          addToComparison(helmet, 'direct');
        }
      }

      // Refresh comparison after adding preselected helmets
      setTimeout(() => {
        setComparison(getStoredComparison());
      }, 100);
    }
  }, [preselectedHelmets]);

  // Filter helmets based on search and filters
  const filteredHelmets = allHelmets.filter(helmet => {
    const matchesSearch = searchTerm === '' ||
      helmet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      helmet.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === '' || helmet.category === selectedCategory;
    const matchesBrand = selectedBrand === '' || helmet.brand === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Sort helmets by safety score (best first)
  const sortedHelmets = filteredHelmets.sort((a, b) => a.safety_score - b.safety_score);

  // Track search events when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm && sessionId) {
      const results = filteredHelmets.length;
      trackAdvancedSearch(debouncedSearchTerm, results, {
        selectedCategory,
        selectedBrand
      });
    }
  }, [debouncedSearchTerm, filteredHelmets.length, sessionId, selectedCategory, selectedBrand]);

  // Track filter usage
  useEffect(() => {
    if (selectedCategory && sessionId) {
      trackFilterUsage('category', selectedCategory, filteredHelmets.length);
    }
  }, [selectedCategory, filteredHelmets.length, sessionId]);

  useEffect(() => {
    if (selectedBrand && sessionId) {
      trackFilterUsage('brand', selectedBrand, filteredHelmets.length);
    }
  }, [selectedBrand, filteredHelmets.length, sessionId]);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getSafetyScoreColor = (score: number) => {
    if (score <= 10) return 'bg-green-100 text-green-800';
    if (score <= 15) return 'bg-blue-100 text-blue-800';
    if (score <= 20) return 'bg-yellow-100 text-yellow-800';
    if (score <= 25) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-8">
      {/* Current Comparison Summary */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Current Comparison ({comparison.length}/4)
            </h2>
            <button
              onClick={() => setShowFullComparison(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Full Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparison.map(item => (
              <div key={item.helmet.id} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {item.helmet.brand} {item.helmet.name}
                </h3>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className={`px-2 py-1 rounded font-medium ${getSafetyScoreColor(item.helmet.safety_score)}`}>
                      Safety: {item.helmet.safety_score}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Rating: {renderStars(item.helmet.star_rating)}
                  </div>
                  <div className="font-bold text-green-600">
                    ${item.helmet.min_price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helmet Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Add Helmets to Compare {comparison.length > 0 && `(${comparison.length}/4)`}
          </h2>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Helmets
              </label>
              <input
                type="text"
                placeholder="Search by name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedBrand('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Helmet Grid */}
        <div className="p-6">
          {sortedHelmets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No helmets found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedHelmets.map(helmet => (
                <div key={helmet.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-sm mb-1">
                      {helmet.brand} {helmet.name}
                    </h3>
                    <span className="inline-block bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                      {helmet.category}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Safety Score:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSafetyScoreColor(helmet.safety_score)}`}>
                        {helmet.safety_score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating:</span>
                      <span className="text-sm font-medium">
                        {renderStars(helmet.star_rating)} ({helmet.star_rating}/5)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-bold text-green-600">${helmet.min_price}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <AddToComparisonButton
                      helmet={helmet}
                      source="search"
                      className="w-full"
                    />
                    <a
                      href={`/helmet/${helmet.brand.toLowerCase().replace(/\s+/g, '-')}-${helmet.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="w-full inline-flex items-center justify-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show more message if there are many results */}
          {sortedHelmets.length > 20 && (
            <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Showing {sortedHelmets.length} helmets. Use filters above to narrow your search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Comparison Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Safety First:</strong> Lower safety scores indicate better protection. Look for helmets with scores under 15 for excellent safety.
          </div>
          <div>
            <strong>Compare Similar Categories:</strong> Road, mountain, and urban helmets are designed for different riding styles and conditions.
          </div>
          <div>
            <strong>Consider MIPS:</strong> Multi-directional Impact Protection System provides additional protection against rotational forces.
          </div>
          <div>
            <strong>Price vs. Safety:</strong> Higher price doesn&apos;t always mean better safety. Use our comparison to find the best value.
          </div>
        </div>
      </div>

      {/* Full Comparison Modal */}
      <HelmetComparison
        isOpen={showFullComparison}
        onClose={() => setShowFullComparison(false)}
      />
    </div>
  );
}