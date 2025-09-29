import { NextRequest, NextResponse } from 'next/server';
import { getProductByASIN, searchProducts } from '@/utils/amazonProductAPI';

// Cache for API responses (in-memory for now, could use Redis in production)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  // API DISABLED to prevent rate limiting on public site
  // Use npm run update-amazon locally to update product data
  return NextResponse.json({
    success: false,
    error: 'API temporarily disabled. Product data is served from cache.',
    message: 'Run npm run update-amazon locally to refresh product data'
  }, { status: 503 });

  /* Original implementation preserved for reference
  const searchParams = request.nextUrl.searchParams;
  const asin = searchParams.get('asin');
  const search = searchParams.get('search');
  const brand = searchParams.get('brand');
  const model = searchParams.get('model');

  try {
    // Check cache first
    const cacheKey = asin || `${brand}-${model}` || search || '';
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let result;

    if (asin) {
      // Direct ASIN lookup (most accurate)
      const product = await getProductByASIN(asin);
      result = {
        success: true,
        source: 'asin',
        product
      };
    } else if (brand && model) {
      // Search by brand and model
      const searchQuery = `${brand} ${model} helmet`;
      const searchResult = await searchProducts(searchQuery, { maxResults: 3 });

      // Try to find the best match
      const bestMatch = searchResult.products.find(p =>
        p.title.toLowerCase().includes(brand.toLowerCase()) &&
        p.title.toLowerCase().includes(model.toLowerCase())
      ) || searchResult.products[0];

      result = {
        success: true,
        source: 'search',
        product: bestMatch,
        alternatives: searchResult.products.filter(p => p !== bestMatch).slice(0, 2)
      };
    } else if (search) {
      // Generic search
      const searchResult = await searchProducts(search, { maxResults: 3 });
      result = {
        success: true,
        source: 'search',
        product: searchResult.products[0],
        alternatives: searchResult.products.slice(1)
      };
    } else {
      return NextResponse.json({
        success: false,
        error: 'Please provide either an ASIN, brand/model, or search query'
      }, { status: 400 });
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);

    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({
        success: false,
        error: 'Rate limited. Please try again in a moment.',
        retryAfter: 1000
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch product data'
    }, { status: 500 });
  }
  */
}