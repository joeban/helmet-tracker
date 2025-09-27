/**
 * Amazon Image Integration Utilities
 *
 * This module provides safe methods to work with Amazon product images
 * while maintaining compliance with Amazon Associates program terms.
 */

export interface HelmetSearchResult {
  title: string;
  image_url: string | null;
  amazon_url: string | null;
  confidence: number;
}

/**
 * Search for helmet on Amazon using brand and model name
 * This creates compliant affiliate links for manual verification
 */
export function generateAmazonSearchUrl(brand: string, name: string, affiliateTag?: string): string {
  const searchQuery = `${brand} ${name} helmet bike cycling`;
  const baseUrl = 'https://www.amazon.com/s';
  const params = new URLSearchParams({
    k: searchQuery, // URLSearchParams will handle encoding
    ref: 'sr_st_relevancerank',
    ...(affiliateTag && { tag: affiliateTag })
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extract ASIN from Amazon URL if present
 */
export function extractASINFromUrl(url: string): string | null {
  const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  return asinMatch ? asinMatch[1] : null;
}

/**
 * Generate Amazon product URL from ASIN with affiliate tag
 */
export function generateAmazonProductUrl(asin: string, affiliateTag?: string): string {
  const baseUrl = `https://www.amazon.com/dp/${asin}`;
  return affiliateTag ? `${baseUrl}?tag=${affiliateTag}` : baseUrl;
}

/**
 * Validate that an image URL is from Amazon's CDN
 */
export function isValidAmazonImageUrl(url: string): boolean {
  const validDomains = [
    'images-na.ssl-images-amazon.com',
    'm.media-amazon.com',
    'images.amazon.com'
  ];

  try {
    const urlObj = new URL(url);
    return validDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Fallback image generator for helmets without Amazon images
 */
export function getHelmetFallbackImage(brand: string, category: string): string {
  // Return a data URI for a simple helmet SVG icon
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">
      <rect width="100" height="100" fill="#f3f4f6"/>
      <circle cx="50" cy="45" r="25" fill="none" stroke="#6b7280" stroke-width="3"/>
      <path d="M30 45 Q50 25 70 45" fill="none" stroke="#6b7280" stroke-width="2"/>
      <text x="50" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#6b7280">
        ${brand}
      </text>
      <text x="50" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" fill="#9ca3af">
        ${category}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgIcon)}`;
}

/**
 * Manual helmet-to-ASIN mapping for popular models
 * These are verified Amazon product ASINs from manual research
 */
export const MANUAL_HELMET_ASINS: Record<string, string> = {
  // Verified Amazon ASINs - researched December 2024
  'GIRO SYNTAX MIPS': 'B0CKRYSQ88', // Giro Syntax MIPS Adult Road Cycling Helmet
  'SMITH SIGNAL MIPS': 'B08WBMM4MG', // SMITH Signal Cycling Helmet with MIPS Technology
  'SMITH ROUTE MIPS': 'B08WBLSHBB', // SMITH Route MIPS from search results

  // First batch of Amazon ASINs - December 2024
  'GIRO AETHER SPHERICAL': 'B07FTSN2QP', // Giro Aether Spherical Adult Road Cycling Helmet
  'BELL Z20 MIPS': 'B07JC3Q6PG', // BELL Z20 Aero MIPS Adult Road Bike Helmet
  'BELL Z20 AERO MIPS': 'B07JC3Q6PG', // Same product, alternate name match
  'POC VENTRAL AIR MIPS': 'B09Q5S7BYB', // POC Ventral Air MIPS Road Cycling Helmet

  // Comprehensive search batch - December 2024
  'GIRO SYNTHE MIPS': 'B017Y92QUQ', // Giro Synthe MIPS Adult Road Cycling Helmet
  'GIRO FORAY MIPS': 'B07GT7F78H', // Giro Foray MIPS Cycling Helmet
  'MET TRENTA MIPS': 'B0993F24FM', // MET Trenta MIPS Road Cycling Helmet
  'KASK PROTONE': 'B013EYA5OY', // KASK Protone Helmet

  // Additional research batch - December 2024
  'SPECIALIZED ALIGN II MIPS': 'B07PBQG8QP', // Specialized Align II MIPS Adult Helmet
  'BELL DRAFT MIPS': 'B07DLHCR2L', // Bell Draft MIPS Adult Road Bike Helmet
  'GIRO REGISTER MIPS': 'B07NQBVD6X', // Giro Register MIPS Adult Road Cycling Helmet
  'SMITH PERSIST MIPS': 'B08G8B8M2G', // Smith Persist MIPS Cycling Helmet

  // Add more verified helmets as researched
  // 'SPECIALIZED PREVAIL 3': 'B08XXXXX', // Need to research
};

/**
 * Get Amazon product info for a helmet if available
 */
export function getHelmetAmazonInfo(brand: string, name: string): {
  hasAmazonLink: boolean;
  searchUrl: string;
  productUrl?: string;
  asin?: string;
} {
  const helmetKey = `${brand.toUpperCase()} ${name.toUpperCase()}`;
  const asin = MANUAL_HELMET_ASINS[helmetKey];

  const searchUrl = generateAmazonSearchUrl(brand, name, process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG);

  if (asin) {
    return {
      hasAmazonLink: true,
      searchUrl,
      productUrl: generateAmazonProductUrl(asin, process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG),
      asin
    };
  }

  return {
    hasAmazonLink: false,
    searchUrl
  };
}