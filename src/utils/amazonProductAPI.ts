/**
 * Amazon Product Advertising API 5.0 Integration
 *
 * Clean implementation for fetching product data from Amazon
 * Documentation: https://webservices.amazon.com/paapi5/documentation/
 */

import aws4 from 'aws4';

// Type definitions for Amazon API responses
interface AmazonItem {
  ASIN: string;
  ItemInfo?: {
    Title?: {
      DisplayValue?: string;
    };
    Features?: {
      DisplayValues?: string[];
    };
    ProductInfo?: {
      Color?: {
        DisplayValue?: string;
      };
      Size?: {
        DisplayValue?: string;
      };
    };
  };
  Images?: {
    Primary?: {
      Large?: {
        URL?: string;
      };
    };
  };
  Offers?: {
    Listings?: Array<{
      Price?: {
        Amount?: string;
        Currency?: string;
        DisplayAmount?: string;
      };
      Availability?: {
        Message?: string;
      };
      DeliveryInfo?: {
        IsPrimeEligible?: boolean;
      };
    }>;
  };
  CustomerReviews?: {
    StarRating?: {
      Value?: number;
    };
    Count?: number;
  };
  DetailPageURL?: string;
}

interface SearchItemsResponse {
  SearchResult?: {
    Items?: AmazonItem[];
    TotalResultCount?: number;
  };
}

interface GetItemsResponse {
  ItemsResult?: {
    Items?: AmazonItem[];
  };
}

// API Configuration
const API_CONFIG = {
  host: 'webservices.amazon.com',
  region: 'us-east-1',
  service: 'ProductAdvertisingAPI',
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
 * Make a signed request to Amazon PA-API
 */
async function makeSignedRequest(operation: string, payload: Record<string, unknown>): Promise<unknown> {
  const endpoint = `https://${API_CONFIG.host}/paapi5/${operation.toLowerCase()}`;

  // Prepare request
  const request = {
    host: API_CONFIG.host,
    method: 'POST',
    path: `/paapi5/${operation.toLowerCase()}`,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-amz-target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
      'content-encoding': 'amz-1.0'
    },
    body: JSON.stringify(payload),
    service: API_CONFIG.service,
    region: API_CONFIG.region
  };

  // Sign the request with AWS Signature Version 4
  const signedRequest = aws4.sign(request, {
    accessKeyId: API_CONFIG.accessKey,
    secretAccessKey: API_CONFIG.secretKey
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: signedRequest.headers as HeadersInit,
      body: signedRequest.body as string
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Amazon API Error (${response.status}):`, errorText);
      throw new Error(`Amazon API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Request failed:', err);
    throw err;
  }
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
      'Offers.Listings.Availability.Message',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible'
    ],
    ItemCount: maxResults,
    SortBy: sortBy,
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  // Add price filters if specified
  type PayloadType = typeof payload & {
    MinPrice?: number;
    MaxPrice?: number;
  };
  const payloadWithPrice = payload as PayloadType;
  if (options.minPrice !== undefined) {
    payloadWithPrice.MinPrice = options.minPrice * 100; // Convert to cents
  }
  if (options.maxPrice !== undefined) {
    payloadWithPrice.MaxPrice = options.maxPrice * 100; // Convert to cents
  }

  try {
    if (!isAPIConfigured()) {
      console.warn('Amazon Product API not configured. Using mock data.');
      return getMockSearchResults(keywords);
    }

    const response = await makeSignedRequest('SearchItems', payload) as SearchItemsResponse;

    // Parse response
    const products: AmazonProduct[] = (response.SearchResult?.Items || []).map((item: AmazonItem) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      price: item.Offers?.Listings?.[0]?.Price ? {
        amount: parseFloat(item.Offers.Listings[0].Price.Amount || '0'),
        currency: item.Offers.Listings[0].Price.Currency || 'USD',
        displayAmount: item.Offers.Listings[0].Price.DisplayAmount || ''
      } : undefined,
      imageUrl: item.Images?.Primary?.Large?.URL,
      detailPageUrl: item.DetailPageURL || buildAffiliateLink(item.ASIN),
      availability: item.Offers?.Listings?.[0]?.Availability?.Message,
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false
    }));

    return {
      products,
      totalResults: response.SearchResult?.TotalResultCount || 0,
      searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(keywords)}&tag=${API_CONFIG.partnerTag}`
    };
  } catch (err) {
    console.error('Amazon Product API error:', err);
    // Fallback to mock data if API fails
    return getMockSearchResults(keywords);
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
      'Offers.Listings.Availability.Message',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count'
    ],
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  try {
    if (!isAPIConfigured()) {
      console.warn('Amazon Product API not configured. Using mock data.');
      return getMockProductByASIN(asin);
    }

    const response = await makeSignedRequest('GetItems', payload) as GetItemsResponse;

    if (!response.ItemsResult?.Items?.length) {
      return null;
    }

    const item = response.ItemsResult.Items[0];
    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      price: item.Offers?.Listings?.[0]?.Price ? {
        amount: parseFloat(item.Offers.Listings[0].Price.Amount || '0'),
        currency: item.Offers.Listings[0].Price.Currency || 'USD',
        displayAmount: item.Offers.Listings[0].Price.DisplayAmount || ''
      } : undefined,
      imageUrl: item.Images?.Primary?.Large?.URL,
      detailPageUrl: item.DetailPageURL || buildAffiliateLink(item.ASIN),
      availability: item.Offers?.Listings?.[0]?.Availability?.Message,
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count
    };
  } catch (err) {
    console.error('Amazon Product API error:', err);
    return getMockProductByASIN(asin);
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
      'Offers.Listings.Availability.Message'
    ],
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com'
  };

  try {
    if (!isAPIConfigured()) {
      console.warn('Amazon Product API not configured. Using mock data.');
      return asins.map(asin => getMockProductByASIN(asin)).filter(Boolean) as AmazonProduct[];
    }

    const response = await makeSignedRequest('GetItems', payload) as GetItemsResponse;

    return (response.ItemsResult?.Items || []).map((item: AmazonItem) => ({
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
      price: item.Offers?.Listings?.[0]?.Price ? {
        amount: parseFloat(item.Offers.Listings[0].Price.Amount || '0'),
        currency: item.Offers.Listings[0].Price.Currency || 'USD',
        displayAmount: item.Offers.Listings[0].Price.DisplayAmount || ''
      } : undefined,
      imageUrl: item.Images?.Primary?.Large?.URL,
      detailPageUrl: item.DetailPageURL || buildAffiliateLink(item.ASIN),
      availability: item.Offers?.Listings?.[0]?.Availability?.Message,
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false
    }));
  } catch (err) {
    console.error('Amazon Product API error:', err);
    return asins.map(asin => getMockProductByASIN(asin)).filter(Boolean) as AmazonProduct[];
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
  return !!(API_CONFIG.accessKey && API_CONFIG.secretKey &&
           API_CONFIG.accessKey !== 'YOUR_ACCESS_KEY_HERE');
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
    hasAccessKey: !!API_CONFIG.accessKey && API_CONFIG.accessKey !== 'YOUR_ACCESS_KEY_HERE',
    hasSecretKey: !!API_CONFIG.secretKey && API_CONFIG.secretKey !== 'YOUR_SECRET_KEY_HERE',
    partnerTag: API_CONFIG.partnerTag
  };
}