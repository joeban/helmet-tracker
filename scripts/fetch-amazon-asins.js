#!/usr/bin/env node

/**
 * Fetch ASINs and images for all helmets from Amazon API
 * Run with: node scripts/fetch-amazon-asins.js
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

// Load existing helmet data
const helmetsPath = path.join(__dirname, '..', 'src', 'data', 'helmets.ts');
const helmetsContent = fs.readFileSync(helmetsPath, 'utf-8');

// Extract helmet data from the TypeScript file
const helmetsMatch = helmetsContent.match(/export const HELMETS: Helmet\[\] = (\[[\s\S]*?\]);/);
if (!helmetsMatch) {
  console.error('Could not parse helmets data');
  process.exit(1);
}

// Parse the helmet data (careful with eval, only use on trusted data)
const helmetsData = eval(helmetsMatch[1]);

// Load existing ASIN mappings
const asinMappingsPath = path.join(__dirname, '..', 'src', 'data', 'amazonASINs.json');
let existingMappings = {};
if (fs.existsSync(asinMappingsPath)) {
  existingMappings = JSON.parse(fs.readFileSync(asinMappingsPath, 'utf-8'));
}

async function searchProduct(keywords, delay = 1100) {
  // Rate limiting: wait before making request
  await new Promise(resolve => setTimeout(resolve, delay));

  const operation = 'SearchItems';
  const payload = {
    Keywords: keywords,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price'
    ],
    ItemCount: 5,
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
      console.log('Rate limited, waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return searchProduct(keywords, 0); // Retry without additional delay
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`API Error for "${keywords}":`, error);
      return null;
    }

    const data = await response.json();
    return data.SearchResult?.Items || [];
  } catch (error) {
    console.error(`Failed to search for "${keywords}":`, error.message);
    return null;
  }
}

function findBestMatch(items, brand, model) {
  if (!items || items.length === 0) return null;

  // Score each item based on title match
  const scoredItems = items.map(item => {
    const title = item.ItemInfo?.Title?.DisplayValue || '';
    const titleLower = title.toLowerCase();
    const brandLower = brand.toLowerCase();
    const modelLower = model.toLowerCase();

    let score = 0;

    // Brand match
    if (titleLower.includes(brandLower)) score += 10;

    // Model match (more specific = better)
    const modelWords = modelLower.split(/\s+/);
    modelWords.forEach(word => {
      if (word.length > 2 && titleLower.includes(word)) {
        score += 5;
      }
    });

    // MIPS match
    if (modelLower.includes('mips') && titleLower.includes('mips')) score += 5;

    // Helmet keyword
    if (titleLower.includes('helmet')) score += 3;

    // Cycling/bike keyword
    if (titleLower.includes('cycling') || titleLower.includes('bike')) score += 2;

    return { item, score };
  });

  // Sort by score and return best match
  scoredItems.sort((a, b) => b.score - a.score);
  const best = scoredItems[0];

  // Only return if it seems like a reasonable match
  if (best.score >= 10) {
    return best.item;
  }

  return null;
}

async function fetchAllASINs() {
  console.log(`\n🔍 Fetching ASINs for ${helmetsData.length} helmets...\n`);

  const results = { ...existingMappings };
  let processed = 0;
  let found = 0;
  let skipped = 0;

  for (const helmet of helmetsData) {
    processed++;
    const helmetKey = `${helmet.brand}_${helmet.name}`.replace(/\s+/g, '_');

    // Skip if we already have this helmet's ASIN
    if (results[helmetKey]?.asin) {
      console.log(`[${processed}/${helmetsData.length}] ✓ Already have ASIN for ${helmet.brand} ${helmet.name}`);
      skipped++;
      continue;
    }

    // Search for the helmet
    const searchQuery = `${helmet.brand} ${helmet.name} helmet`;
    console.log(`[${processed}/${helmetsData.length}] Searching: ${searchQuery}`);

    const items = await searchProduct(searchQuery);

    if (items && items.length > 0) {
      const bestMatch = findBestMatch(items, helmet.brand, helmet.name);

      if (bestMatch) {
        results[helmetKey] = {
          asin: bestMatch.ASIN,
          title: bestMatch.ItemInfo?.Title?.DisplayValue,
          imageUrl: bestMatch.Images?.Primary?.Large?.URL,
          price: bestMatch.Offers?.Listings?.[0]?.Price?.DisplayAmount,
          detailPageUrl: `https://www.amazon.com/dp/${bestMatch.ASIN}?tag=${API_CONFIG.partnerTag}`,
          lastUpdated: new Date().toISOString()
        };

        found++;
        console.log(`  ✅ Found: ${bestMatch.ItemInfo?.Title?.DisplayValue}`);
        console.log(`  ASIN: ${bestMatch.ASIN}`);

        // Save progress incrementally
        fs.writeFileSync(asinMappingsPath, JSON.stringify(results, null, 2));
      } else {
        console.log(`  ❌ No good match found`);
      }
    } else {
      console.log(`  ⚠️ No results or API error`);
    }
  }

  console.log(`\n📊 Results Summary:`);
  console.log(`  Total helmets: ${helmetsData.length}`);
  console.log(`  New ASINs found: ${found}`);
  console.log(`  Already had ASINs: ${skipped}`);
  console.log(`  Total with ASINs: ${Object.keys(results).length}`);

  // Save final results
  fs.writeFileSync(asinMappingsPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to ${asinMappingsPath}`);

  // Generate TypeScript mappings
  generateTypeScriptMappings(results);
}

function generateTypeScriptMappings(mappings) {
  const tsContent = `/**
 * Amazon ASIN mappings for helmets
 * Auto-generated by fetch-amazon-asins.js
 * Last updated: ${new Date().toISOString()}
 */

export interface AmazonProductData {
  asin: string;
  title?: string;
  imageUrl?: string;
  price?: string;
  detailPageUrl: string;
  lastUpdated: string;
}

export const AMAZON_ASIN_MAPPINGS: Record<string, AmazonProductData> = ${JSON.stringify(mappings, null, 2)};

export function getHelmetASIN(brand: string, name: string): AmazonProductData | undefined {
  const key = \`\${brand}_\${name}\`.replace(/\\s+/g, '_');
  return AMAZON_ASIN_MAPPINGS[key];
}
`;

  const tsPath = path.join(__dirname, '..', 'src', 'data', 'amazonASINMappings.ts');
  fs.writeFileSync(tsPath, tsContent);
  console.log(`✅ TypeScript mappings saved to ${tsPath}`);
}

// Check API credentials
if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
  console.error('❌ Amazon API credentials not found in environment variables');
  console.error('Please ensure AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY are set in .env.local');
  process.exit(1);
}

// Run the script
fetchAllASINs().catch(console.error);