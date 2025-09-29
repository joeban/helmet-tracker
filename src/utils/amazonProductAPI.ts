/**
 * Amazon Product Advertising API 5.0 Integration
 *
 * Clean implementation for fetching product data from Amazon
 * Documentation: https://webservices.amazon.com/paapi5/documentation/
 */

import crypto from 'crypto';

// API Configuration
const API_CONFIG = {
  host: 'webservices.amazon.com',
  region: 'us-east-1',
  endpoint: 'https://webservices.amazon.com/paapi5/searchitems',
  accessKey: process.env.AMAZON_ACCESS_KEY || '',
  secretKey: process.env.AMAZON_SECRET_KEY || '',
  partnerTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'
};

// Product data types
export interface AmazonProduct {
  asin: string;
  title: string;
  price?: {
    amount: number;
    currency: string;
    displayAmount: string;
  };
  imageUrl?: string;
  detailPageUrl: string;
  availability?: string;
  isPrime?: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface SearchResult {
  products: AmazonProduct[];
  totalResults: number;
  searchUrl: string;
}

/**
 * Search for products on Amazon
 * @param keywords - Search query (e.g., "Bell Z20 MIPS helmet")
 * @param options - Additional search options
 */
export async function searchProducts(
  keywords: string,
  options: {
    maxResults?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'Relevance' | 'Price' | 'NewArrivals' | 'AvgCustomerReviews';
  } = {}
): Promise<SearchResult> {
  const { maxResults = 10, sortBy = 'Relevance' } = options;

  // Build request payload
  const payload = {
    Keywords: keywords,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price',
      'Offers.Listings.Availability',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible'
    ],
    ItemCount: maxResults,
    SortBy: sortBy,
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  // Add price filters if specified
  if (options.minPrice !== undefined) {
    (payload as any).MinPrice = options.minPrice * 100; // Convert to cents
  }
  if (options.maxPrice !== undefined) {
    (payload as any).MaxPrice = options.maxPrice * 100; // Convert to cents
  }

  try {
    // TODO: Implement request signing (requires AWS Signature Version 4)
    // For now, return mock data for development
    console.warn('Amazon Product API not configured. Using mock data.');
    return getMockSearchResults(keywords);
  } catch (error) {
    console.error('Amazon Product API error:', error);
    throw new Error('Failed to search Amazon products');
  }
}

/**
 * Get product details by ASIN
 * @param asin - Amazon Standard Identification Number
 */
export async function getProductByASIN(asin: string): Promise<AmazonProduct | null> {
  const payload = {
    ItemIds: [asin],
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ProductInfo',
      'Offers.Listings.Price',
      'Offers.Listings.Availability',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count'
    ],
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  try {
    // TODO: Implement request signing
    console.warn('Amazon Product API not configured. Using mock data.');
    return getMockProductByASIN(asin);
  } catch (error) {
    console.error('Amazon Product API error:', error);
    return null;
  }
}

/**
 * Batch get multiple products by ASINs
 * @param asins - Array of ASINs (max 10 per request)
 */
export async function getProductsByASINs(asins: string[]): Promise<AmazonProduct[]> {
  if (asins.length > 10) {
    console.warn('Maximum 10 ASINs per request. Truncating.');
    asins = asins.slice(0, 10);
  }

  const payload = {
    ItemIds: asins,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'Offers.Listings.Price',
      'Offers.Listings.Availability'
    ],
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  try {
    // TODO: Implement request signing
    console.warn('Amazon Product API not configured. Using mock data.');
    return asins.map(asin => getMockProductByASIN(asin)).filter(Boolean) as AmazonProduct[];
  } catch (error) {
    console.error('Amazon Product API error:', error);
    return [];
  }
}

/**
 * Build affiliate link with tracking
 */
export function buildAffiliateLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${API_CONFIG.partnerTag}`;
}

/**
 * Mock data for development (remove when API is configured)
 */
function getMockSearchResults(keywords: string): SearchResult {
  return {
    products: [
      {
        asin: 'B07ZZLCBS5',
        title: 'Bell Z20 MIPS Cycling Helmet',
        price: {
          amount: 159.99,
          currency: 'USD',
          displayAmount: '$159.99'
        },
        imageUrl: 'https://m.media-amazon.com/images/I/71abcdefgh._AC_SX679_.jpg',
        detailPageUrl: buildAffiliateLink('B07ZZLCBS5'),
        availability: 'In Stock',
        isPrime: true,
        rating: 4.5,
        reviewCount: 127
      }
    ],
    totalResults: 1,
    searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(keywords)}&tag=${API_CONFIG.partnerTag}`
  };
}

function getMockProductByASIN(asin: string): AmazonProduct {
  return {
    asin,
    title: 'Mock Helmet Product',
    price: {
      amount: 149.99,
      currency: 'USD',
      displayAmount: '$149.99'
    },
    detailPageUrl: buildAffiliateLink(asin),
    availability: 'In Stock',
    isPrime: true
  };
}

/**
 * Configuration check
 */
export function isAPIConfigured(): boolean {
  return !!(API_CONFIG.accessKey && API_CONFIG.secretKey);
}

/**
 * Get configuration status for debugging
 */
export function getAPIStatus(): {
  configured: boolean;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  partnerTag: string;
} {
  return {
    configured: isAPIConfigured(),
    hasAccessKey: !!API_CONFIG.accessKey,
    hasSecretKey: !!API_CONFIG.secretKey,
    partnerTag: API_CONFIG.partnerTag
  };
}