'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { HELMETS } from '@/data/helmets';
import { SortOption, CategoryFilter, BrandFilter } from '@/types/helmet';
import HelmetImage from '@/components/HelmetImage';
import { getHelmetAmazonInfo } from '@/utils/amazonImages';

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Navigation */}
          <nav className="flex justify-end mb-8">
            <div className="flex gap-6">
              <a
                href="/about"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
              >
                About
              </a>
              <a
                href="/methodology"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
              >
                Methodology
              </a>
            </div>
          </nav>

          <h1 className="text-6xl font-semibold text-slate-800 mb-4 tracking-wide">
            Helmet<span className="text-blue-600 font-light">Score</span>
          </h1>
          <p className="text-2xl text-slate-700 font-semibold mb-4">🛡️ Find the Safest Bike Helmet for Your Life</p>
          <p className="text-lg text-slate-600 font-medium mb-6">The only site with complete Virginia Tech safety test results for 281+ helmets.</p>

          {/* Safety Score Explainer */}
          <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-lg p-4 mb-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-700">📊 How Safety Scores Work:</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 font-medium">Lower Score = Better Protection</span>
              <span className="text-red-700 font-medium">Higher Score = More Risk</span>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              Example: A score of 8.0 is 50% safer than 15.0
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSortBy('rating')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🏆 Browse Safest Helmets
            </button>
            <a
              href="/methodology"
              className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              📚 Learn About Safety Testing
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar - Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
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
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-base font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                Filters & Search
              </button>
            </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedHelmets.map((helmet) => (
            <div key={helmet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow touch-manipulation">
              {/* Helmet Image */}
              <div className="h-40 sm:h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                <HelmetImage
                  brand={helmet.brand}
                  name={helmet.name}
                  category={helmet.category}
                  imageUrl={helmet.image_url}
                  amazonUrl={helmet.amazon_url}
                />
              </div>

              {/* Helmet Details */}
              <div className="p-4 sm:p-6">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-tight">
                    {helmet.brand} {helmet.name}
                  </h3>
                  <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs sm:text-sm">
                    {helmet.category}
                  </span>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-yellow-500 text-lg sm:text-xl tracking-wider">
                    {renderStars(helmet.star_rating)}
                  </span>
                  <span className="text-gray-600 text-sm">({helmet.star_rating}/5)</span>
                </div>

                {/* Safety Score */}
                <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded border-l-4 ${
                  helmet.safety_score <= 10
                    ? 'bg-green-50 border-green-500'
                    : helmet.safety_score <= 15
                    ? 'bg-blue-50 border-blue-500'
                    : helmet.safety_score <= 20
                    ? 'bg-yellow-50 border-yellow-500'
                    : helmet.safety_score <= 25
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs sm:text-sm text-gray-700">
                      <strong>Safety Score:</strong> {helmet.safety_score}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded font-medium ${
                      helmet.safety_score <= 10
                        ? 'bg-green-100 text-green-800'
                        : helmet.safety_score <= 15
                        ? 'bg-blue-100 text-blue-800'
                        : helmet.safety_score <= 20
                        ? 'bg-yellow-100 text-yellow-800'
                        : helmet.safety_score <= 25
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {helmet.safety_score <= 10 ? 'EXCELLENT'
                       : helmet.safety_score <= 15 ? 'GOOD'
                       : helmet.safety_score <= 20 ? 'FAIR'
                       : helmet.safety_score <= 25 ? 'MARGINAL'
                       : 'AVOID'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Lower score = better protection</div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">
                    {helmet.min_price === helmet.max_price
                      ? formatPrice(helmet.min_price)
                      : `${formatPrice(helmet.min_price)} - ${formatPrice(helmet.max_price)}`
                    }
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">
                    VT Test Price: {formatPrice(helmet.vt_test_price)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 font-medium">
                    {helmet.available_count} of {helmet.listing_count} retailers have it in stock
                  </div>
                </div>

                {/* Amazon Shopping Links */}
                <div className="mt-3 sm:mt-4 space-y-2">
                  {(() => {
                    const amazonInfo = getHelmetAmazonInfo(helmet.brand, helmet.name);

                    if (helmet.amazon_url) {
                      // Direct Amazon product link
                      return (
                        <a
                          href={helmet.amazon_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 touch-manipulation text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.74 12c-.092-.071-.306-.232-.306-.232V9.53c0-.105.008-.21.025-.314h1.745c.085.104.154.22.206.348.05.128.076.267.076.416v.457c0 .085-.02.168-.058.25-.036.082-.092.154-.17.214-.077.061-.178.109-.301.145-.123.036-.267.054-.432.054h-.785c-.085 0-.07.09-.07.175v.755zM10.26 12c.085-.071.306-.232.306-.232V9.53c0-.105-.008-.21-.025-.314H8.796c-.085.104-.154.22-.206.348-.05.128-.076.267-.076.416v.457c0 .085.02.168.058.25.036.082.092.154.17.214.077.061.178.109.301.145.123.036.267.054.432.054h.785c.085 0 .07.09.07.175v.755zM22.5 6.908V17.09c0 .604-.246 1.152-.643 1.549-.397.396-.945.643-1.549.643H3.692c-.604 0-1.152-.247-1.549-.643-.396-.397-.643-.945-.643-1.549V6.908c0-.604.247-1.152.643-1.549.397-.396.945-.643 1.549-.643h16.616c.604 0 1.152.247 1.549.643.397.397.643.945.643 1.549z"/>
                          </svg>
                          Buy on Amazon
                        </a>
                      );
                    } else if (amazonInfo.hasAmazonLink && amazonInfo.productUrl) {
                      // Verified product link
                      return (
                        <a
                          href={amazonInfo.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 touch-manipulation text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.74 12c-.092-.071-.306-.232-.306-.232V9.53c0-.105.008-.21.025-.314h1.745c.085.104.154.22.206.348.05.128.076.267.076.416v.457c0 .085-.02.168-.058.25-.036.082-.092.154-.17.214-.077.061-.178.109-.301.145-.123.036-.267.054-.432.054h-.785c-.085 0-.07.09-.07.175v.755zM10.26 12c.085-.071.306-.232.306-.232V9.53c0-.105-.008-.21-.025-.314H8.796c-.085.104-.154.22-.206.348-.05.128-.076.267-.076.416v.457c0 .085.02.168.058.25.036.082.092.154.17.214.077.061.178.109.301.145.123.036.267.054.432.054h.785c.085 0 .07.09.07.175v.755zM22.5 6.908V17.09c0 .604-.246 1.152-.643 1.549-.397.396-.945.643-1.549.643H3.692c-.604 0-1.152-.247-1.549-.643-.396-.397-.643-.945-.643-1.549V6.908c0-.604.247-1.152.643-1.549.397-.396.945-.643 1.549-.643h16.616c.604 0 1.152.247 1.549.643.397.397.643.945.643 1.549z"/>
                          </svg>
                          Buy on Amazon
                        </a>
                      );
                    } else {
                      // Search link for helmets without direct product links
                      return (
                        <a
                          href={amazonInfo.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 touch-manipulation text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search on Amazon
                        </a>
                      );
                    }
                  })()}
                </div>
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

      {/* Mobile Filter Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileFiltersOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
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
                    <option value="All Mountain">All Mountain</option>
                    <option value="Road">Road</option>
                    <option value="Urban">Urban</option>
                    <option value="Full-Face">Full-Face</option>
                    <option value="Multi-sport">Multi-sport</option>
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
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
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

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
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

              {/* Footer */}
              <div className="p-4 border-t">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-base font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
