#!/usr/bin/env node

/**
 * Local script to update Amazon product data
 * Run this locally to fetch and cache product info
 * The cached data is then served to users (no API calls from public site)
 */

import('dotenv/config');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aws4 from 'aws4';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_CONFIG = {
  host: 'webservices.amazon.com',
  region: 'us-east-1',
  service: 'ProductAdvertisingAPI',
  accessKey: process.env.AMAZON_ACCESS_KEY || '',
  secretKey: process.env.AMAZON_SECRET_KEY || '',
  partnerTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'
};

// Load existing ASINs from amazonImages.ts
const amazonImagesPath = path.join(__dirname, '..', 'src', 'utils', 'amazonImages.ts');
const amazonImagesContent = fs.readFileSync(amazonImagesPath, 'utf-8');

// Extract ASINs from the file
const asinMatches = [...amazonImagesContent.matchAll(/'([A-Z0-9]{10})'/g)];
const asins = asinMatches.map(match => match[1]).filter(asin => /^B[A-Z0-9]{9}$/.test(asin));

// Extract helmet mappings
const mappingMatches = [...amazonImagesContent.matchAll(/'([^']+)':\s*'(B[A-Z0-9]{9})'/g)];
const helmetMappings = Object.fromEntries(
  mappingMatches.map(match => [match[1], match[2]])
);

console.log(`Found ${asins.length} unique ASINs to update`);
console.log(`Found ${Object.keys(helmetMappings).length} helmet mappings`);

async function getProductByASIN(asin) {
  const operation = 'GetItems';
  const payload = {
    ItemIds: [asin],
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
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

  const endpoint = `https://${API_CONFIG.host}/paapi5/${operation.toLowerCase()}`;
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

  const signedRequest = aws4.sign(request, {
    accessKeyId: API_CONFIG.accessKey,
    secretAccessKey: API_CONFIG.secretKey
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: signedRequest.headers,
      body: signedRequest.body
    });

    if (response.status === 429) {
      return { rateLimited: true };
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error for ${asin}:`, error.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];

    if (!item) return null;

    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue,
      price: item.Offers?.Listings?.[0]?.Price ? {
        amount: parseFloat(item.Offers.Listings[0].Price.Amount || '0'),
        currency: item.Offers.Listings[0].Price.Currency || 'USD',
        displayAmount: item.Offers.Listings[0].Price.DisplayAmount || ''
      } : null,
      imageUrl: item.Images?.Primary?.Large?.URL,
      detailPageUrl: `https://www.amazon.com/dp/${item.ASIN}?tag=${API_CONFIG.partnerTag}`,
      availability: item.Offers?.Listings?.[0]?.Availability?.Message,
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Failed to fetch ${asin}:`, error.message);
    return null;
  }
}

async function updateAllProducts() {
  console.log('\n🔄 Updating Amazon Product Data (Local Only)\n');
  console.log('This data will be cached and served to users.');
  console.log('No API calls will be made from the public site.\n');

  // Load existing cached data
  const cachePath = path.join(__dirname, '..', 'public', 'amazon-products.json');
  let cachedData = {};

  if (fs.existsSync(cachePath)) {
    cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    console.log(`Loaded existing cache with ${Object.keys(cachedData).length} products`);
  }

  const updatedData = { ...cachedData };
  let updated = 0;
  let rateLimited = false;

  // Process ASINs with respectful rate limiting
  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];

    // Skip if recently updated (within 24 hours)
    if (updatedData[asin]?.lastUpdated) {
      const lastUpdate = new Date(updatedData[asin].lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 24) {
        console.log(`[${i + 1}/${asins.length}] Skipping ${asin} - updated ${hoursSinceUpdate.toFixed(1)}h ago`);
        continue;
      }
    }

    console.log(`[${i + 1}/${asins.length}] Fetching ${asin}...`);

    // Wait 1.5 seconds between requests (conservative rate limiting)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const product = await getProductByASIN(asin);

    if (product?.rateLimited) {
      console.log('⚠️ Rate limited - stopping for now');
      rateLimited = true;
      break;
    }

    if (product) {
      updatedData[asin] = product;
      updated++;
      console.log(`  ✅ Updated: ${product.title?.substring(0, 50)}...`);
      console.log(`  💰 Price: ${product.price?.displayAmount || 'N/A'}`);
      console.log(`  📦 ${product.availability || 'Unknown availability'}`);

      // Save incrementally
      fs.writeFileSync(cachePath, JSON.stringify(updatedData, null, 2));
    } else {
      console.log(`  ❌ Failed to fetch data`);
    }

    // Stop if we've updated 20 items (conservative daily limit)
    if (updated >= 20) {
      console.log('\n📊 Reached update limit for this run (20 items)');
      break;
    }
  }

  // Generate TypeScript data file
  const tsContent = `/**
 * Amazon Product Data Cache
 * Auto-generated by update-amazon-data.js
 * Last updated: ${new Date().toISOString()}
 *
 * This is static data served to users - no API calls from public site
 */

export interface CachedAmazonProduct {
  asin: string;
  title?: string;
  price?: {
    amount: number;
    currency: string;
    displayAmount: string;
  } | null;
  imageUrl?: string;
  detailPageUrl: string;
  availability?: string;
  isPrime?: boolean;
  rating?: number;
  reviewCount?: number;
  lastUpdated: string;
}

export const AMAZON_PRODUCT_CACHE: Record<string, CachedAmazonProduct> = ${JSON.stringify(updatedData, null, 2)};

export const HELMET_TO_ASIN: Record<string, string> = ${JSON.stringify(helmetMappings, null, 2)};

export function getCachedProduct(asin: string): CachedAmazonProduct | undefined {
  return AMAZON_PRODUCT_CACHE[asin];
}

export function getHelmetProduct(brand: string, name: string): CachedAmazonProduct | undefined {
  const key = \`\${brand.toUpperCase()} \${name.toUpperCase()}\`;
  const asin = HELMET_TO_ASIN[key];
  return asin ? AMAZON_PRODUCT_CACHE[asin] : undefined;
}
`;

  const tsPath = path.join(__dirname, '..', 'src', 'data', 'amazonProductCache.ts');
  fs.writeFileSync(tsPath, tsContent);

  console.log('\n📊 Update Summary:');
  console.log(`  Total products in cache: ${Object.keys(updatedData).length}`);
  console.log(`  Products updated: ${updated}`);
  console.log(`  Rate limited: ${rateLimited ? 'Yes' : 'No'}`);
  console.log(`\n✅ Cache saved to:`);
  console.log(`  - ${cachePath} (JSON)`);
  console.log(`  - ${tsPath} (TypeScript)`);
  console.log('\nThe website will now use this cached data instead of making API calls.');
}

// Check credentials
if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
  console.error('❌ Amazon API credentials not configured');
  process.exit(1);
}

// Run the update
updateAllProducts().catch(console.error);