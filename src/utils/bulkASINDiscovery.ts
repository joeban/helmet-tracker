/**
 * Bulk ASIN Discovery Tools
 * Utilities to help systematically discover ASINs for multiple helmets
 */

import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import { ASINDiscoveryManager, generateSearchQueries } from './amazonASINDiscovery';

export interface BulkDiscoveryPlan {
  totalHelmets: number;
  helmetsWithoutASINs: Helmet[];
  priorityHelmets: Helmet[]; // High-value helmets to focus on first
  searchStrategies: {
    helmet: Helmet;
    queries: string[];
    amazonUrls: string[];
    priority: number;
  }[];
}

export interface DiscoverySession {
  startTime: number;
  helmetsProcessed: number;
  asinsFound: number;
  currentHelmet?: Helmet;
  notes: string[];
}

/**
 * Generate a comprehensive plan for discovering ASINs
 */
export function generateBulkDiscoveryPlan(): BulkDiscoveryPlan {
  const manager = ASINDiscoveryManager.getInstance();
  manager.loadDatabase();

  // Find helmets without ASINs
  const helmetsWithoutASINs = HELMETS.filter(helmet => {
    const asins = manager.getASINs(helmet.id);
    return asins.length === 0 || !asins.some(a => a.verified);
  });

  // Prioritize helmets by value (high-rated, reasonably priced)
  const priorityHelmets = helmetsWithoutASINs
    .filter(h => h.star_rating >= 4 && h.min_price >= 50 && h.min_price <= 300)
    .sort((a, b) => {
      // Sort by rating first, then by safety score
      if (a.star_rating !== b.star_rating) {
        return b.star_rating - a.star_rating;
      }
      return a.safety_score - b.safety_score;
    });

  // Generate search strategies for each helmet
  const searchStrategies = helmetsWithoutASINs.map(helmet => {
    const queries = generateSearchQueries(helmet);
    const amazonUrls = queries.map(query =>
      `https://amazon.com/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`
    );

    // Calculate priority score
    let priority = 0;
    if (helmet.star_rating >= 5) priority += 3;
    else if (helmet.star_rating >= 4) priority += 2;
    else if (helmet.star_rating >= 3) priority += 1;

    if (helmet.safety_score <= 10) priority += 2;
    else if (helmet.safety_score <= 15) priority += 1;

    if (helmet.min_price >= 100 && helmet.min_price <= 200) priority += 1;

    return {
      helmet,
      queries,
      amazonUrls,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);

  return {
    totalHelmets: HELMETS.length,
    helmetsWithoutASINs,
    priorityHelmets,
    searchStrategies
  };
}

/**
 * Generate discovery session plan
 */
export function createDiscoverySession(maxHelmets: number = 10): DiscoverySession {
  const plan = generateBulkDiscoveryPlan();
  const session: DiscoverySession = {
    startTime: Date.now(),
    helmetsProcessed: 0,
    asinsFound: 0,
    notes: [
      `Starting discovery session for ${Math.min(maxHelmets, plan.helmetsWithoutASINs.length)} helmets`,
      `Priority focus: ${plan.priorityHelmets.length} high-value helmets`,
      `Total missing ASINs: ${plan.helmetsWithoutASINs.length}`
    ]
  };

  return session;
}

/**
 * Generate browser bookmarklet for ASIN discovery
 */
export function generateBookmarklet(): string {
  const bookmarkletCode = `
    javascript:(function(){
      const url = window.location.href;
      const title = document.title;
      const asin = url.match(/\\/dp\\/([A-Z0-9]{10})/);

      if (asin) {
        const data = {
          asin: asin[1],
          url: url,
          title: title,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem('found_asin_' + Date.now(), JSON.stringify(data));
        alert('ASIN ' + asin[1] + ' saved!\\nTitle: ' + title);
      } else {
        alert('No ASIN found on this page');
      }
    })();
  `;

  return bookmarkletCode.replace(/\s+/g, ' ').trim();
}

/**
 * Parse ASINs collected by bookmarklet
 */
export function parseCollectedASINs(): Array<{
  asin: string;
  url: string;
  title: string;
  timestamp: string;
}> {
  if (typeof window === 'undefined') return [];

  const collected = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('found_asin_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '');
        collected.push(data);
      } catch (error) {
        console.warn('Failed to parse collected ASIN:', key);
      }
    }
  }

  return collected.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Clear collected ASINs
 */
export function clearCollectedASINs(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('found_asin_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Generate report of ASIN discovery progress
 */
export function generateProgressReport(): {
  summary: {
    totalHelmets: number;
    helmetsWithASINs: number;
    verifiedASINs: number;
    coveragePercentage: number;
  };
  breakdown: {
    byBrand: Record<string, { total: number; withASINs: number; percentage: number }>;
    byCategory: Record<string, { total: number; withASINs: number; percentage: number }>;
    byPriceRange: Record<string, { total: number; withASINs: number; percentage: number }>;
  };
  recommendations: string[];
} {
  const manager = ASINDiscoveryManager.getInstance();
  manager.loadDatabase();

  const stats = manager.getStatistics();

  // Breakdown by brand
  const byBrand: Record<string, { total: number; withASINs: number; percentage: number }> = {};
  HELMETS.forEach(helmet => {
    if (!byBrand[helmet.brand]) {
      byBrand[helmet.brand] = { total: 0, withASINs: 0, percentage: 0 };
    }
    byBrand[helmet.brand].total++;

    const asins = manager.getASINs(helmet.id);
    if (asins.length > 0) {
      byBrand[helmet.brand].withASINs++;
    }
  });

  Object.keys(byBrand).forEach(brand => {
    byBrand[brand].percentage = (byBrand[brand].withASINs / byBrand[brand].total) * 100;
  });

  // Breakdown by category
  const byCategory: Record<string, { total: number; withASINs: number; percentage: number }> = {};
  HELMETS.forEach(helmet => {
    if (!byCategory[helmet.category]) {
      byCategory[helmet.category] = { total: 0, withASINs: 0, percentage: 0 };
    }
    byCategory[helmet.category].total++;

    const asins = manager.getASINs(helmet.id);
    if (asins.length > 0) {
      byCategory[helmet.category].withASINs++;
    }
  });

  Object.keys(byCategory).forEach(category => {
    byCategory[category].percentage = (byCategory[category].withASINs / byCategory[category].total) * 100;
  });

  // Breakdown by price range
  const byPriceRange: Record<string, { total: number; withASINs: number; percentage: number }> = {
    'Under $100': { total: 0, withASINs: 0, percentage: 0 },
    '$100-200': { total: 0, withASINs: 0, percentage: 0 },
    '$200-300': { total: 0, withASINs: 0, percentage: 0 },
    'Over $300': { total: 0, withASINs: 0, percentage: 0 }
  };

  HELMETS.forEach(helmet => {
    let range = 'Over $300';
    if (helmet.min_price < 100) range = 'Under $100';
    else if (helmet.min_price < 200) range = '$100-200';
    else if (helmet.min_price < 300) range = '$200-300';

    byPriceRange[range].total++;

    const asins = manager.getASINs(helmet.id);
    if (asins.length > 0) {
      byPriceRange[range].withASINs++;
    }
  });

  Object.keys(byPriceRange).forEach(range => {
    byPriceRange[range].percentage = (byPriceRange[range].withASINs / byPriceRange[range].total) * 100;
  });

  // Generate recommendations
  const recommendations = [];

  if (stats.coveragePercentage < 25) {
    recommendations.push('Focus on high-priority helmets first (4+ stars, popular brands)');
  }

  if (stats.coveragePercentage < 50) {
    recommendations.push('Use bulk discovery tools to systematically find ASINs');
  }

  const lowCoverageBrands = Object.entries(byBrand)
    .filter(([_, data]) => data.total >= 5 && data.percentage < 30)
    .map(([brand, _]) => brand);

  if (lowCoverageBrands.length > 0) {
    recommendations.push(`Focus on brands with low coverage: ${lowCoverageBrands.slice(0, 3).join(', ')}`);
  }

  if (stats.verifiedASINs < stats.helmetsWithASINs * 0.7) {
    recommendations.push('Verify more existing ASINs to ensure link quality');
  }

  return {
    summary: stats,
    breakdown: { byBrand, byCategory, byPriceRange },
    recommendations
  };
}

/**
 * Export ASINs in CSV format for analysis
 */
export function exportASINsToCSV(): string {
  const manager = ASINDiscoveryManager.getInstance();
  manager.loadDatabase();

  const headers = [
    'Helmet ID',
    'Brand',
    'Name',
    'Category',
    'Price',
    'Star Rating',
    'Safety Score',
    'ASIN',
    'Verified',
    'Confidence',
    'Source',
    'Amazon URL'
  ];

  const rows = [headers.join(',')];

  HELMETS.forEach(helmet => {
    const asins = manager.getASINs(helmet.id);
    if (asins.length > 0) {
      asins.forEach(asin => {
        const row = [
          helmet.id,
          `"${helmet.brand}"`,
          `"${helmet.name}"`,
          helmet.category,
          helmet.min_price,
          helmet.star_rating,
          helmet.safety_score,
          asin.asin,
          asin.verified,
          asin.confidence,
          asin.source,
          `"${asin.url}"`
        ];
        rows.push(row.join(','));
      });
    } else {
      const row = [
        helmet.id,
        `"${helmet.brand}"`,
        `"${helmet.name}"`,
        helmet.category,
        helmet.min_price,
        helmet.star_rating,
        helmet.safety_score,
        'NO_ASIN',
        'false',
        '0',
        'none',
        'NO_URL'
      ];
      rows.push(row.join(','));
    }
  });

  return rows.join('\n');
}