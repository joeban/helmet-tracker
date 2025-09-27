/**
 * Amazon SP-API Integration Utilities
 *
 * This module will handle Amazon Selling Partner API integration for fetching
 * real product data including images, prices, and availability.
 *
 * NOTE: Implementation pending Amazon SP-API application approval.
 */

export interface AmazonSpApiConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  marketplaceId: string;
}

export interface AmazonProductData {
  asin: string;
  title: string;
  description?: string;
  images: {
    main: string;
    variants: string[];
  };
  price?: {
    amount: number;
    currency: string;
  };
  availability: boolean;
  brand?: string;
  features?: string[];
  lastUpdated: string;
}

/**
 * Placeholder for SP-API client initialization
 * Will be implemented once we receive API credentials from Amazon
 */
export class AmazonSpApiClient {
  private config: AmazonSpApiConfig;

  constructor(config: AmazonSpApiConfig) {
    this.config = config;
  }

  /**
   * Get product information by ASIN
   * @param asin Amazon Standard Identification Number
   * @returns Product data including images and pricing
   */
  async getProductByAsin(asin: string): Promise<AmazonProductData | null> {
    // TODO: Implement SP-API call to fetch product data
    // This will use the Catalog Items API v0 endpoint:
    // GET /catalog/v0/items/{asin}

    console.log(`[SP-API] Fetching product data for ASIN: ${asin}`);

    // Placeholder return - will be replaced with actual API call
    return null;
  }

  /**
   * Get multiple products by ASINs (batch operation)
   * @param asins Array of ASINs to fetch
   * @returns Array of product data
   */
  async getProductsByAsins(asins: string[]): Promise<AmazonProductData[]> {
    // TODO: Implement batch product fetching
    // This will optimize API calls by fetching multiple products at once

    console.log(`[SP-API] Fetching batch product data for ${asins.length} ASINs`);

    // Placeholder return
    return [];
  }

  /**
   * Update helmet database with fresh Amazon product data
   * @param helmetsWithAsins Array of helmet objects that have Amazon ASINs
   */
  async updateHelmetImages(helmetsWithAsins: any[]): Promise<void> {
    // TODO: Implement database update logic
    // This will fetch fresh product data and update helmet image URLs

    console.log(`[SP-API] Updating images for ${helmetsWithAsins.length} helmets`);
  }
}

/**
 * Extract ASIN from HelmetScore Amazon URL
 * @param amazonUrl HelmetScore Amazon affiliate URL
 * @returns ASIN or null if not found
 */
export function extractAsinFromHelmetScoreUrl(amazonUrl: string): string | null {
  // Extract ASIN from URLs like: https://www.amazon.com/dp/B0CKRYSQ88?tag=helmetscore-20
  const match = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

/**
 * Validate if an image URL is from Amazon's CDN
 * (Updated version of existing function)
 */
export function isValidAmazonImageUrl(url: string): boolean {
  const validDomains = [
    'images-na.ssl-images-amazon.com',
    'm.media-amazon.com',
    'images.amazon.com',
    'images-eu.ssl-images-amazon.com',
    'images-jp.ssl-images-amazon.com'
  ];

  try {
    const urlObj = new URL(url);
    return validDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Environment variable validation
 */
export function validateSpApiConfig(): boolean {
  const required = [
    'AMAZON_SP_CLIENT_ID',
    'AMAZON_SP_CLIENT_SECRET',
    'AMAZON_SP_REFRESH_TOKEN',
    'AMAZON_SP_ACCESS_KEY_ID',
    'AMAZON_SP_SECRET_ACCESS_KEY'
  ];

  return required.every(key => process.env[key]);
}

// Export configuration loader for when credentials are available
export function loadSpApiConfig(): AmazonSpApiConfig | null {
  if (!validateSpApiConfig()) {
    console.warn('[SP-API] Missing required environment variables');
    return null;
  }

  return {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    accessKeyId: process.env.AMAZON_SP_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMAZON_SP_SECRET_ACCESS_KEY!,
    region: process.env.AMAZON_SP_REGION || 'us-east-1',
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'ATVPDKIKX0DER' // US marketplace
  };
}