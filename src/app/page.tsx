'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { HELMETS } from '@/data/helmets';
import { SortOption, CategoryFilter, BrandFilter } from '@/types/helmet';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('');
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<{min: number; max: number}>({min: 0, max: 600});
  const [safetyScoreRange, setSafetyScoreRange] = useState<{min: number; max: number}>({min: 6.8, max: 27.0});
  const [mipsOnly, setMipsOnly] = useState(false);

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique brands for filter
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(HELMETS.map(helmet => helmet.brand))].sort();
    return brands;
  }, []);

  const filteredAndSortedHelmets = useMemo(() => {
    const filtered = HELMETS.filter(helmet => {
      const matchesSearch = helmet.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           helmet.brand.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           helmet.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || helmet.category === categoryFilter;
      const matchesBrand = !brandFilter || helmet.brand === brandFilter;
      const matchesAvailability = !showAvailableOnly || helmet.available_count > 0;
      const matchesPrice = helmet.min_price >= priceRange.min && helmet.max_price <= priceRange.max;
      const matchesSafetyScore = helmet.safety_score >= safetyScoreRange.min && helmet.safety_score <= safetyScoreRange.max;
      const matchesMips = !mipsOnly || helmet.name.toLowerCase().includes('mips');

      return matchesSearch && matchesCategory && matchesBrand && matchesAvailability && matchesPrice && matchesSafetyScore && matchesMips;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          if (a.star_rating !== b.star_rating) {
            return b.star_rating - a.star_rating;
          }
          return a.safety_score - b.safety_score;
        case 'safety':
          return a.safety_score - b.safety_score;
        case 'price':
          return a.min_price - b.min_price;
        default:
          return 0;
      }
    });
  }, [debouncedSearchTerm, categoryFilter, brandFilter, sortBy, showAvailableOnly, priceRange, safetyScoreRange, mipsOnly]);

  // Optimize rendering functions with useCallback
  const renderStars = useCallback((rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }, []);

  const formatPrice = useCallback((price: number) => {
    return `$${price.toFixed(2)}`;
  }, []);

  // Loading state for better UX during search
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">🚴 Helmet Tracker</h1>
          <p className="text-xl opacity-90">Virginia Tech helmet safety ratings with real-time pricing</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Filters</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search helmets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Road">Road</option>
                  <option value="All Mountain">All Mountain</option>
                  <option value="Urban">Urban</option>
                  <option value="Multi-sport">Multi-sport</option>
                  <option value="Full-Face">Full-Face</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value as BrandFilter)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Brands</option>
                  {uniqueBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rating">Best Rating</option>
                  <option value="safety">Best Safety Score</option>
                  <option value="price">Lowest Price</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value) || 0}))}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value) || 500}))}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    ${priceRange.min} - ${priceRange.max}
                  </div>
                </div>
              </div>

              {/* Safety Score Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safety Score Range (STAR)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={safetyScoreRange.min}
                      step="0.1"
                      min="6.8"
                      max="27.0"
                      onChange={(e) => setSafetyScoreRange(prev => ({...prev, min: Number(e.target.value) || 6.8}))}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={safetyScoreRange.max}
                      step="0.1"
                      min="6.8"
                      max="27.0"
                      onChange={(e) => setSafetyScoreRange(prev => ({...prev, max: Number(e.target.value) || 27.0}))}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    {safetyScoreRange.min} - {safetyScoreRange.max} (lower = safer)
                  </div>
                </div>
              </div>

              {/* MIPS Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={mipsOnly}
                    onChange={(e) => setMipsOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    MIPS technology only
                  </span>
                </label>
              </div>

              {/* Availability Filter */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show available only
                  </span>
                </label>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setBrandFilter('');
                  setSortBy('rating');
                  setShowAvailableOnly(false);
                  setPriceRange({min: 0, max: 600});
                  setSafetyScoreRange({min: 6.8, max: 27.0});
                  setMipsOnly(false);
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* Right Content - Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    {filteredAndSortedHelmets.length} Helmet{filteredAndSortedHelmets.length !== 1 ? 's' : ''} Found
                  </>
                )}
              </h2>
            </div>

            {/* Helmet Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedHelmets.map((helmet) => (
            <div key={helmet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Helmet Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {helmet.image_url ? (
                  <img
                    src={helmet.image_url}
                    alt={`${helmet.brand} ${helmet.name}`}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <div className="text-4xl mb-2">🚴</div>
                    <div className="text-sm">No Image Available</div>
                  </div>
                )}
              </div>

              {/* Helmet Details */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {helmet.brand} {helmet.name}
                  </h3>
                  <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                    {helmet.category}
                  </span>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-500 text-xl tracking-wider">
                    {renderStars(helmet.star_rating)}
                  </span>
                  <span className="text-gray-600 text-sm">({helmet.star_rating}/5)</span>
                </div>

                {/* Safety Score */}
                <div className="mb-4 p-2 bg-gray-50 rounded border-l-4 border-green-500">
                  <div className="text-sm text-gray-700">
                    <strong>Safety Score:</strong> {helmet.safety_score} (lower is better)
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg">
                  <div className="text-xl font-bold text-green-600 mb-1">
                    {helmet.min_price === helmet.max_price
                      ? formatPrice(helmet.min_price)
                      : `${formatPrice(helmet.min_price)} - ${formatPrice(helmet.max_price)}`
                    }
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    VT Test Price: {formatPrice(helmet.vt_test_price)}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {helmet.available_count} of {helmet.listing_count} retailers have it in stock
                  </div>
                </div>

                {/* Amazon Purchase Link */}
                {helmet.amazon_url && (
                  <div className="mt-4">
                    <a
                      href={helmet.amazon_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.74 12c-.092-.071-.306-.232-.306-.232V9.53c0-.105.008-.21.025-.314h1.745c.085.104.154.22.206.348.05.128.076.267.076.416v.457c0 .085-.02.168-.058.25-.036.082-.092.154-.17.214-.077.061-.178.109-.301.145-.123.036-.267.054-.432.054h-.785c-.085 0-.07.09-.07.175v.755zM10.26 12c.085-.071.306-.232.306-.232V9.53c0-.105-.008-.21-.025-.314H8.796c-.085.104-.154.22-.206.348-.05.128-.076.267-.076.416v.457c0 .085.02.168.058.25.036.082.092.154.17.214.077.061.178.109.301.145.123.036.267.054.432.054h.785c.085 0 .07.09.07.175v.755zM22.5 6.908V17.09c0 .604-.246 1.152-.643 1.549-.397.396-.945.643-1.549.643H3.692c-.604 0-1.152-.247-1.549-.643-.396-.397-.643-.945-.643-1.549V6.908c0-.604.247-1.152.643-1.549.397-.396.945-.643 1.549-.643h16.616c.604 0 1.152.247 1.549.643.397.397.643.945.643 1.549z"/>
                      </svg>
                      Buy on Amazon
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
            </div>

            {/* No Results */}
            {filteredAndSortedHelmets.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No helmets found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="mb-2">
            Safety data from{' '}
            <a
              href="https://www.helmet.beam.vt.edu/bicycle-helmet-ratings.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Virginia Tech Helmet Lab
            </a>
          </p>
          <p>Built with ♥ for cyclist safety</p>
        </div>
      </footer>
    </div>
  );
}
