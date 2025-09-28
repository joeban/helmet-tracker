/**
 * Helmet slug utilities for URL generation and helmet lookup
 */

import { Helmet } from '@/types/helmet';

/**
 * Generate a URL-friendly slug from helmet brand and name
 */
export function generateHelmetSlug(brand: string, name: string): string {
  const combined = `${brand} ${name}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Find helmet by slug from the helmets array
 */
export function findHelmetBySlug(helmets: Helmet[], slug: string): Helmet | null {
  return helmets.find(helmet =>
    generateHelmetSlug(helmet.brand, helmet.name) === slug
  ) || null;
}

/**
 * Generate all helmet slugs for static generation
 */
export function getAllHelmetSlugs(helmets: Helmet[]): string[] {
  return helmets.map(helmet => generateHelmetSlug(helmet.brand, helmet.name));
}

/**
 * Get helmet display title for SEO and page headers
 */
export function getHelmetDisplayTitle(helmet: Helmet): string {
  return `${helmet.brand} ${helmet.name}`;
}

/**
 * Get helmet SEO description
 */
export function getHelmetSEODescription(helmet: Helmet): string {
  const starText = helmet.star_rating === 5 ? '5-star Virginia Tech safety rating' :
                   helmet.star_rating === 4 ? '4-star Virginia Tech safety rating' :
                   `${helmet.star_rating}-star Virginia Tech rating`;

  return `${getHelmetDisplayTitle(helmet)} - ${starText} with ${helmet.safety_score} STAR safety score. ${helmet.category} helmet starting at $${helmet.min_price}. Compare prices and safety data.`;
}