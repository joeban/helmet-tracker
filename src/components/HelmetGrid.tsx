'use client';

import { useState, useMemo } from 'react';
import { Helmet } from '@/types/helmet';
import HelmetImage from '@/components/HelmetImage';
import { getHelmetAmazonInfo } from '@/utils/amazonImages';
import { trackHelmetView, trackHelmetClick } from '@/utils/analytics';

interface HelmetGridProps {
  helmets: Helmet[];
  showFilters?: boolean;
}

export default function HelmetGrid({ helmets, showFilters = false }: HelmetGridProps) {
  const [sortBy, setSortBy] = useState<'rating' | 'safety' | 'price'>('safety');

  const sortedHelmets = useMemo(() => {
    return [...helmets].sort((a, b) => {
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
  }, [helmets, sortBy]);

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const handleHelmetView = (helmet: Helmet) => {
    trackHelmetView({
      id: helmet.id,
      name: helmet.name,
      brand: helmet.brand,
      category: helmet.category,
      safety_score: helmet.safety_score,
      star_rating: helmet.star_rating,
      min_price: helmet.min_price
    });
  };

  const handleHelmetClick = (helmet: Helmet, linkType: 'amazon_direct' | 'amazon_search' | 'retailer_link') => {
    trackHelmetClick({
      id: helmet.id,
      name: helmet.name,
      brand: helmet.brand,
      category: helmet.category,
      safety_score: helmet.safety_score,
      link_type: linkType
    });
  };

  return (
    <div>
      {/* Sort Controls */}
      {showFilters && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="safety">Best Safety Score</option>
              <option value="rating">Best Rating</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
          {sortedHelmets.length} Helmet{sortedHelmets.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      {/* Helmet Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {sortedHelmets.map((helmet) => (
          <div
            key={helmet.id}
            className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 group"
            onMouseEnter={() => handleHelmetView(helmet)}
          >
            {/* Helmet Image */}
            <div className="h-40 lg:h-48 bg-slate-50 flex items-center justify-center overflow-hidden group-hover:bg-slate-100 transition-colors duration-200">
              <HelmetImage
                brand={helmet.brand}
                name={helmet.name}
                category={helmet.category}
                imageUrl={helmet.image_url}
                amazonUrl={helmet.amazon_url}
              />
            </div>

            {/* Helmet Details */}
            <div className="p-4 lg:p-5">
              <div className="mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-1.5 lg:mb-2 leading-tight group-hover:text-blue-800 transition-colors duration-200">
                  {helmet.brand} {helmet.name}
                </h3>
                <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                  {helmet.category}
                </span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-2 mb-2.5 lg:mb-3">
                <span className="text-yellow-500 text-lg lg:text-xl tracking-wider">
                  {renderStars(helmet.star_rating)}
                </span>
                <span className="text-gray-600 text-sm font-medium">({helmet.star_rating}/5)</span>
              </div>

              {/* Safety Score */}
              <div className={`mb-3 lg:mb-4 p-2.5 lg:p-3 rounded-lg border-l-4 shadow-sm ${
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
                  <div className="text-sm lg:text-base text-gray-700 font-medium">
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
                <div className="text-xs text-gray-600 mt-1.5 font-medium">Lower score = better protection</div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 lg:p-4 rounded-lg border border-gray-200">
                <div className="text-lg lg:text-xl font-bold text-green-600 mb-1.5">
                  {helmet.min_price === helmet.max_price
                    ? formatPrice(helmet.min_price)
                    : `${formatPrice(helmet.min_price)} - ${formatPrice(helmet.max_price)}`
                  }
                </div>
                <div className="text-xs lg:text-sm text-gray-600 mb-1">
                  VT Test Price: {formatPrice(helmet.vt_test_price)}
                </div>
                <div className="text-xs lg:text-sm text-gray-700 font-medium">
                  {helmet.available_count} of {helmet.listing_count} retailers have it in stock
                </div>
              </div>

              {/* Amazon Shopping Links */}
              <div className="mt-3 lg:mt-4 space-y-2">
                {(() => {
                  const amazonInfo = getHelmetAmazonInfo(helmet.brand, helmet.name);

                  if (helmet.amazon_url) {
                    // Direct Amazon product link
                    return (
                      <a
                        href={helmet.amazon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleHelmetClick(helmet, 'amazon_direct')}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 lg:py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 touch-manipulation text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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
                        onClick={() => handleHelmetClick(helmet, 'amazon_direct')}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 lg:py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 touch-manipulation text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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
                        onClick={() => handleHelmetClick(helmet, 'amazon_search')}
                        className="w-full inline-flex items-center justify-center px-4 lg:px-6 py-3 lg:py-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 touch-manipulation text-sm lg:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
      {sortedHelmets.length === 0 && (
        <div className="text-center py-12 lg:py-16 col-span-full">
          <div className="max-w-sm mx-auto">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-700 mb-2">No helmets found</h3>
            <p className="text-gray-500 text-sm lg:text-base">Try adjusting your search criteria or clearing filters</p>
          </div>
        </div>
      )}
    </div>
  );
}