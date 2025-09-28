/**
 * Helmet Comparison System
 * Manages helmet comparison state, analytics, and export functionality
 */

import { Helmet } from '@/types/helmet';
import { event } from '@/utils/analytics';

// TypeScript interfaces for comparison system
export interface ComparisonItem {
  helmet: Helmet;
  addedAt: number;
  source: 'homepage' | 'detail_page' | 'search' | 'direct';
}

export interface ComparisonAnalysis {
  safest: Helmet;
  cheapest: Helmet;
  bestValue: Helmet; // Best safety-to-price ratio
  mostPopular: Helmet; // Highest star rating
  heaviest: Helmet;
  lightest: Helmet;
  recommendations: {
    budget: Helmet;
    premium: Helmet;
    balanced: Helmet;
  };
}

export interface ComparisonMetrics {
  safetyRange: { min: number; max: number; average: number };
  priceRange: { min: number; max: number; average: number };
  ratingRange: { min: number; max: number; average: number };
  categoryDistribution: Record<string, number>;
  brandDistribution: Record<string, number>;
  mipsCount: number;
  averageWeight?: number;
}

// Maximum number of helmets that can be compared
const MAX_COMPARISON_ITEMS = 4;

// Add helmet to comparison
export const addToComparison = (helmet: Helmet, source: ComparisonItem['source'] = 'homepage'): ComparisonItem[] => {
  const currentComparison = getStoredComparison();

  // Check if helmet is already in comparison
  const existingIndex = currentComparison.findIndex(item => item.helmet.id === helmet.id);
  if (existingIndex !== -1) {
    return currentComparison; // Already in comparison
  }

  // Check if we've reached the maximum
  if (currentComparison.length >= MAX_COMPARISON_ITEMS) {
    // Remove the oldest item (FIFO)
    currentComparison.shift();
  }

  const newItem: ComparisonItem = {
    helmet,
    addedAt: Date.now(),
    source
  };

  const updatedComparison = [...currentComparison, newItem];
  storeComparison(updatedComparison);

  // Track comparison addition
  event({
    action: 'helmet_added_to_comparison',
    category: 'comparison',
    label: `${helmet.brand}_${helmet.name}`,
    helmet_id: helmet.id.toString(),
    comparison_count: updatedComparison.length,
    source: source,
    value: 1
  });

  return updatedComparison;
};

// Remove helmet from comparison
export const removeFromComparison = (helmetId: number): ComparisonItem[] => {
  const currentComparison = getStoredComparison();
  const updatedComparison = currentComparison.filter(item => item.helmet.id !== helmetId);
  storeComparison(updatedComparison);

  // Track comparison removal
  event({
    action: 'helmet_removed_from_comparison',
    category: 'comparison',
    label: helmetId.toString(),
    helmet_id: helmetId.toString(),
    comparison_count: updatedComparison.length,
    value: 1
  });

  return updatedComparison;
};

// Clear all comparisons
export const clearComparison = (): void => {
  const currentComparison = getStoredComparison();

  if (currentComparison.length > 0) {
    localStorage.removeItem('helmet_comparison');

    event({
      action: 'comparison_cleared',
      category: 'comparison',
      label: 'all_helmets',
      comparison_count: currentComparison.length,
      value: 1
    });
  }
};

// Get comprehensive comparison analysis
export const analyzeComparison = (comparison: ComparisonItem[]): ComparisonAnalysis | null => {
  if (comparison.length < 2) return null;

  const helmets = comparison.map(item => item.helmet);

  // Find safest (lowest safety score)
  const safest = helmets.reduce((prev, curr) =>
    curr.safety_score < prev.safety_score ? curr : prev
  );

  // Find cheapest
  const cheapest = helmets.reduce((prev, curr) =>
    curr.min_price < prev.min_price ? curr : prev
  );

  // Find best value (safety score per dollar - lower is better)
  const bestValue = helmets.reduce((prev, curr) => {
    const prevValue = prev.safety_score / prev.min_price;
    const currValue = curr.safety_score / curr.min_price;
    return currValue < prevValue ? curr : prev;
  });

  // Find most popular (highest star rating)
  const mostPopular = helmets.reduce((prev, curr) =>
    curr.star_rating > prev.star_rating ? curr : prev
  );

  // Find heaviest and lightest (if weight data available)
  const heaviest = helmets[0]; // Placeholder - would need weight data
  const lightest = helmets[0]; // Placeholder - would need weight data

  // Generate recommendations
  const sortedByPrice = [...helmets].sort((a, b) => a.min_price - b.min_price);
  const sortedBySafety = [...helmets].sort((a, b) => a.safety_score - b.safety_score);

  const recommendations = {
    budget: sortedByPrice[0],
    premium: sortedByPrice[sortedByPrice.length - 1],
    balanced: sortedBySafety[Math.floor(sortedBySafety.length / 2)]
  };

  return {
    safest,
    cheapest,
    bestValue,
    mostPopular,
    heaviest,
    lightest,
    recommendations
  };
};

// Calculate comparison metrics
export const calculateComparisonMetrics = (comparison: ComparisonItem[]): ComparisonMetrics => {
  const helmets = comparison.map(item => item.helmet);

  // Safety score metrics
  const safetyScores = helmets.map(h => h.safety_score);
  const safetyRange = {
    min: Math.min(...safetyScores),
    max: Math.max(...safetyScores),
    average: safetyScores.reduce((sum, score) => sum + score, 0) / safetyScores.length
  };

  // Price metrics
  const prices = helmets.map(h => h.min_price);
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: prices.reduce((sum, price) => sum + price, 0) / prices.length
  };

  // Rating metrics
  const ratings = helmets.map(h => h.star_rating);
  const ratingRange = {
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  };

  // Category distribution
  const categoryDistribution = helmets.reduce((acc, helmet) => {
    acc[helmet.category] = (acc[helmet.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Brand distribution
  const brandDistribution = helmets.reduce((acc, helmet) => {
    acc[helmet.brand] = (acc[helmet.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count MIPS helmets (assuming MIPS is indicated in the name)
  const mipsCount = helmets.filter(helmet =>
    helmet.name.toLowerCase().includes('mips')
  ).length;

  return {
    safetyRange,
    priceRange,
    ratingRange,
    categoryDistribution,
    brandDistribution,
    mipsCount
  };
};

// Generate shareable comparison link
export const generateComparisonLink = (comparison: ComparisonItem[]): string => {
  const helmetIds = comparison.map(item => item.helmet.id).join(',');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://helmetscore.com';

  const comparisonUrl = `${baseUrl}/compare?helmets=${helmetIds}`;

  // Track link generation
  event({
    action: 'comparison_link_generated',
    category: 'comparison',
    label: helmetIds,
    comparison_count: comparison.length,
    value: 1
  });

  return comparisonUrl;
};

// Export comparison data as structured object
export const exportComparisonData = (comparison: ComparisonItem[]) => {
  const analysis = analyzeComparison(comparison);
  const metrics = calculateComparisonMetrics(comparison);

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      helmetsCompared: comparison.length,
      exportVersion: '1.0'
    },
    helmets: comparison.map(item => ({
      id: item.helmet.id,
      name: item.helmet.name,
      brand: item.helmet.brand,
      category: item.helmet.category,
      safetyScore: item.helmet.safety_score,
      starRating: item.helmet.star_rating,
      minPrice: item.helmet.min_price,
      maxPrice: item.helmet.max_price,
      avgPrice: item.helmet.avg_price,
      listingCount: item.helmet.listing_count,
      availableCount: item.helmet.available_count,
      addedToComparisonAt: new Date(item.addedAt).toISOString(),
      source: item.source
    })),
    analysis,
    metrics,
    recommendations: analysis?.recommendations,
    comparisonUrl: generateComparisonLink(comparison)
  };

  // Track export
  event({
    action: 'comparison_exported',
    category: 'comparison',
    label: 'data_export',
    comparison_count: comparison.length,
    value: 2
  });

  return exportData;
};

// Download comparison as JSON file
export const downloadComparisonJSON = (comparison: ComparisonItem[]) => {
  const data = exportComparisonData(comparison);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `helmet-comparison-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Track comparison view/interaction
export const trackComparisonView = (comparison: ComparisonItem[], viewType: 'modal' | 'page' | 'widget') => {
  const helmetIds = comparison.map(item => item.helmet.id).join(',');

  event({
    action: 'comparison_viewed',
    category: 'comparison',
    label: helmetIds,
    view_type: viewType,
    comparison_count: comparison.length,
    value: 1
  });
};

// Track comparison decision/action
export const trackComparisonAction = (
  comparison: ComparisonItem[],
  action: 'purchase_click' | 'add_to_watchlist' | 'share' | 'export',
  helmetId?: number
) => {
  event({
    action: `comparison_${action}`,
    category: 'comparison',
    label: helmetId?.toString() || 'all',
    helmet_id: helmetId?.toString(),
    comparison_count: comparison.length,
    value: action === 'purchase_click' ? 5 : 2
  });
};

// Utility functions for data persistence
const getStoredComparison = (): ComparisonItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('helmet_comparison');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeComparison = (comparison: ComparisonItem[]): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('helmet_comparison', JSON.stringify(comparison));
};

// Export utility functions
export {
  getStoredComparison,
  MAX_COMPARISON_ITEMS
};

// Get comparison suggestions based on current selection
export const getComparisonSuggestions = (
  currentComparison: ComparisonItem[],
  allHelmets: Helmet[]
): Helmet[] => {
  if (currentComparison.length === 0) return [];

  const currentHelmetIds = new Set(currentComparison.map(item => item.helmet.id));
  const currentCategories = new Set(currentComparison.map(item => item.helmet.category));
  const currentBrands = new Set(currentComparison.map(item => item.helmet.brand));

  // Find similar helmets in same categories or brands
  const suggestions = allHelmets
    .filter(helmet => !currentHelmetIds.has(helmet.id))
    .filter(helmet =>
      currentCategories.has(helmet.category) ||
      currentBrands.has(helmet.brand)
    )
    .sort((a, b) => {
      // Prioritize by safety score and star rating
      const aScore = (5 - a.star_rating) + (a.safety_score / 10);
      const bScore = (5 - b.star_rating) + (b.safety_score / 10);
      return aScore - bScore;
    })
    .slice(0, 6);

  return suggestions;
};