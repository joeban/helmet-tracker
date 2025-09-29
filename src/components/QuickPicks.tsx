'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import { generateHelmetSlug } from '@/utils/helmet-slug';
import AmazonButton from '@/components/AmazonButton';
import { trackAdvancedSearch } from '@/utils/analytics';
import HelmetImage from '@/components/HelmetImage';

interface QuickPickCardProps {
  helmet: Helmet;
  rank: number;
  category: string;
}

function QuickPickCard({ helmet, rank, category }: QuickPickCardProps) {
  const helmetSlug = generateHelmetSlug(helmet.brand, helmet.name);
  const amazonInfo = helmet.amazon_url || null;

  // Determine badge color based on rank
  const getBadgeColor = () => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'; // Gold
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400'; // Silver
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500'; // Bronze
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 group overflow-hidden">
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className={`${getBadgeColor()} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 shadow-md`}>
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Rating */}
          <div className="mb-2">
            <h4 className="font-semibold text-gray-800 text-base group-hover:text-blue-600 transition-colors truncate" title={`${helmet.brand} ${helmet.name}`}>
              {helmet.brand} {helmet.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-yellow-500 text-sm">
                {'★'.repeat(helmet.star_rating)}{'☆'.repeat(5 - helmet.star_rating)}
              </span>
              <span className="text-xs text-gray-500">({helmet.star_rating}/5)</span>
            </div>
          </div>

          {/* Safety Score and Price */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
              <div className="text-xs text-gray-600">Safety</div>
              <div className="font-bold text-green-700">{helmet.safety_score}</div>
            </div>
            <div className="bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100">
              <div className="text-xs text-gray-600">Price</div>
              <div className="font-bold text-blue-700">${helmet.min_price}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <AmazonButton
              helmet={helmet}
              testId={`quick_pick_${category}_amazon`}
              size="sm"
              className="text-xs whitespace-nowrap"
            />
            <Link
              href={`/helmet/${helmetSlug}`}
              className="flex items-center justify-center px-2 py-2 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
            >
              View Details
            </Link>
          </div>
        </div>

        {/* Helmet Image */}
        <div className="w-20 h-20 flex-shrink-0 hidden sm:block">
          <HelmetImage
            brand={helmet.brand}
            name={helmet.name}
            category={helmet.category}
            imageUrl={helmet.image_url}
            amazonUrl={amazonInfo}
            className="w-full h-full object-contain"
            priority={rank <= 3}
          />
        </div>
      </div>
    </div>
  );
}

export default function QuickPicks() {
  const [expandedSection, setExpandedSection] = useState<'safety' | 'value' | null>(null);

  // Top Safety Picks - Absolute safest helmets (5-star, lowest safety scores)
  const topSafetyPicks = HELMETS
    .filter(h => h.star_rating === 5)
    .sort((a, b) => a.safety_score - b.safety_score)
    .slice(0, 10);

  // Best Value Under $150 - Great safety at an affordable price
  const bestValuePicks = HELMETS
    .filter(h => h.min_price <= 150 && h.star_rating >= 4)
    .sort((a, b) => {
      // Sort by value ratio (safety per dollar), lower is better
      const aValue = a.safety_score / a.min_price;
      const bValue = b.safety_score / b.min_price;
      return aValue - bValue;
    })
    .slice(0, 10);

  const handleExpand = (section: 'safety' | 'value') => {
    setExpandedSection(expandedSection === section ? null : section);
    trackAdvancedSearch(`quick_pick_${section}`, 10, {
      action: expandedSection === section ? 'collapse' : 'expand'
    });
  };

  const getDisplayCount = (section: 'safety' | 'value') => {
    return expandedSection === section ? 10 : 5;
  };

  return (
    <div className="mb-8">
      {/* Two Main Quick Pick Sections - No header needed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Safety Picks */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Top Safety Picks</h3>
            <p className="text-sm text-gray-600">
              The absolute safest helmets. All 5-star rated with lowest injury risk.
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                5-Star Only
              </span>
              <span className="text-gray-500">
                Avg Score: {(topSafetyPicks.slice(0, 5).reduce((sum, h) => sum + h.safety_score, 0) / 5).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {topSafetyPicks.slice(0, getDisplayCount('safety')).map((helmet, index) => (
              <QuickPickCard
                key={helmet.id}
                helmet={helmet}
                rank={index + 1}
                category="safety"
              />
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => handleExpand('safety')}
              className="text-green-700 hover:text-green-800 font-medium text-sm inline-flex items-center gap-2"
            >
              {expandedSection === 'safety' ? (
                <>Show Less <span className="text-lg">↑</span></>
              ) : (
                <>View All Top 10 Safest <span className="text-lg">↓</span></>
              )}
            </button>
          </div>
        </div>

        {/* Best Value Under $150 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 lg:p-8 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Best Value Under $150</h3>
            <p className="text-sm text-gray-600">
              Maximum safety on a budget. 4+ star helmets under $150.
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                Max $150
              </span>
              <span className="text-gray-500">
                Avg Price: ${Math.round(bestValuePicks.slice(0, 5).reduce((sum, h) => sum + h.min_price, 0) / 5)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {bestValuePicks.slice(0, getDisplayCount('value')).map((helmet, index) => (
              <QuickPickCard
                key={helmet.id}
                helmet={helmet}
                rank={index + 1}
                category="value"
              />
            ))}
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => handleExpand('value')}
              className="text-blue-700 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-2"
            >
              {expandedSection === 'value' ? (
                <>Show Less <span className="text-lg">↑</span></>
              ) : (
                <>View All Top 10 Values <span className="text-lg">↓</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}