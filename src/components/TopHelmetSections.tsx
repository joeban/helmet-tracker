'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import { generateHelmetSlug } from '@/utils/helmet-slug';
import AmazonButton from '@/components/AmazonButton';
import { trackAdvancedSearch } from '@/utils/analytics';

interface TopSectionProps {
  title: string;
  description: string;
  icon: string;
  helmets: Helmet[];
  category: string;
}

function TopSection({ title, description, icon, helmets, category }: TopSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayHelmets = showAll ? helmets : helmets.slice(0, 3);

  const handleShowAll = () => {
    setShowAll(true);
    // Track as a search event
    trackAdvancedSearch(`top_${category.toLowerCase()}`, helmets.length, {
      section: `top_${category}`,
      expanded: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayHelmets.map((helmet, index) => {
          const helmetSlug = generateHelmetSlug(helmet.brand, helmet.name);
          return (
            <div key={helmet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="text-yellow-500">
                  {'★'.repeat(helmet.star_rating)}
                </div>
              </div>

              <h4 className="font-bold text-gray-800 mb-1 text-sm">
                {helmet.brand} {helmet.name}
              </h4>

              <div className="flex justify-between items-center mb-3">
                <span className="text-green-600 font-bold">${helmet.min_price}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Safety: {helmet.safety_score}
                </span>
              </div>

              <div className="space-y-2">
                <AmazonButton
                  helmet={helmet}
                  testId="top_sections_amazon_test"
                  size="sm"
                  className="w-full"
                />
                <Link
                  href={`/helmet/${helmetSlug}`}
                  className="block w-full text-center px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                >
                  Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && helmets.length > 3 && (
        <div className="text-center mt-4">
          <button
            onClick={handleShowAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            View all {helmets.length} {title.toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopHelmetSections() {
  // Safest Overall - 5-star helmets with best safety scores
  const safestHelmets = HELMETS
    .filter(h => h.star_rating === 5)
    .sort((a, b) => a.safety_score - b.safety_score)
    .slice(0, 10);

  // Best Value - Good safety vs price ratio
  const bestValueHelmets = HELMETS
    .filter(h => h.star_rating >= 4)
    .map(h => ({ ...h, valueScore: h.safety_score / h.min_price }))
    .sort((a, b) => a.valueScore - b.valueScore)
    .slice(0, 10);

  // Best for Commuting - Urban and Multi-sport helmets
  const commutingHelmets = HELMETS
    .filter(h => h.category === 'Urban' || h.category === 'Multi-sport')
    .filter(h => h.star_rating >= 4)
    .sort((a, b) => {
      if (a.star_rating !== b.star_rating) {
        return b.star_rating - a.star_rating;
      }
      return a.safety_score - b.safety_score;
    })
    .slice(0, 10);

  // Road Racing - Road category with best aerodynamics
  const roadHelmets = HELMETS
    .filter(h => h.category === 'Road')
    .filter(h => h.star_rating >= 4)
    .sort((a, b) => {
      if (a.star_rating !== b.star_rating) {
        return b.star_rating - a.star_rating;
      }
      return a.safety_score - b.safety_score;
    })
    .slice(0, 10);

  // Budget Picks - Under $100 with good safety
  const budgetHelmets = HELMETS
    .filter(h => h.min_price <= 100)
    .filter(h => h.star_rating >= 4)
    .sort((a, b) => {
      if (a.star_rating !== b.star_rating) {
        return b.star_rating - a.star_rating;
      }
      return a.min_price - b.min_price;
    })
    .slice(0, 10);

  // Premium Picks - High-end helmets
  const premiumHelmets = HELMETS
    .filter(h => h.min_price >= 200)
    .filter(h => h.star_rating >= 4)
    .sort((a, b) => {
      if (a.star_rating !== b.star_rating) {
        return b.star_rating - a.star_rating;
      }
      return a.safety_score - b.safety_score;
    })
    .slice(0, 10);

  const sections = [
    {
      title: 'Safest Helmets',
      description: 'Top-rated 5-star helmets with exceptional protection',
      icon: '🛡️',
      helmets: safestHelmets,
      category: 'safety'
    },
    {
      title: 'Best Value Picks',
      description: 'Maximum safety for your budget',
      icon: '💎',
      helmets: bestValueHelmets,
      category: 'value'
    },
    {
      title: 'Best for Commuting',
      description: 'Perfect for daily rides and urban cycling',
      icon: '🚴‍♂️',
      helmets: commutingHelmets,
      category: 'commuting'
    },
    {
      title: 'Road Racing Favorites',
      description: 'Aerodynamic and lightweight for speed',
      icon: '🏁',
      helmets: roadHelmets,
      category: 'road'
    },
    {
      title: 'Budget Champions',
      description: 'Great protection under $100',
      icon: '💰',
      helmets: budgetHelmets,
      category: 'budget'
    },
    {
      title: 'Premium Collection',
      description: 'Top-tier helmets with advanced features',
      icon: '👑',
      helmets: premiumHelmets,
      category: 'premium'
    }
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          🎯 Quick Picks by Category
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Skip the search. Here are our expert-curated selections for every type of cyclist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <TopSection
            key={section.category}
            title={section.title}
            description={section.description}
            icon={section.icon}
            helmets={section.helmets}
            category={section.category}
          />
        ))}
      </div>
    </div>
  );
}