#!/usr/bin/env node

/**
 * Limited version - Fetch ASINs for first 5 helmets
 * Run with: node scripts/fetch-amazon-asins-limited.js
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

// Test helmets - just the first 5
const testHelmets = [
  { brand: 'Specialized', name: 'Prevail III' },
  { brand: 'Giro', name: 'Aether Spherical' },
  { brand: 'Bell', name: 'Z20 MIPS' },
  { brand: 'POC', name: 'Ventral Spin' },
  { brand: 'Trek', name: 'Velocis MIPS' }
];

async function searchProduct(keywords) {
  console.log(`  Searching Amazon for: "${keywords}"`);

  const operation = 'SearchItems';
  const payload = {
    Keywords: keywords,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'Offers.Listings.Price'
    ],
    ItemCount: 3,
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

    console.log(`  Response status: ${response.status}`);

    if (response.status === 429) {
      console.log('  ⚠️ Rate limited - will wait before next request');
      return { rateLimited: true };
    }

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ API Error:`, error.substring(0, 200));
      return null;
    }

    const data = await response.json();
    const items = data.SearchResult?.Items || [];
    console.log(`  ✅ Found ${items.length} results`);
    return items;
  } catch (error) {
    console.error(`  ❌ Request failed:`, error.message);
    return null;
  }
}

async function fetchTestASINs() {
  console.log('🔍 Amazon ASIN Fetcher - Limited Test\n');
  console.log('API Configuration:');
  console.log('  Access Key:', API_CONFIG.accessKey ? '✅ Set' : '❌ Missing');
  console.log('  Secret Key:', API_CONFIG.secretKey ? '✅ Set' : '❌ Missing');
  console.log('  Partner Tag:', API_CONFIG.partnerTag);
  console.log('');

  if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
    console.error('❌ API credentials not configured');
    return;
  }

  const results = {};

  for (let i = 0; i < testHelmets.length; i++) {
    const helmet = testHelmets[i];
    console.log(`\n[${i + 1}/${testHelmets.length}] ${helmet.brand} ${helmet.name}`);

    // Wait 1.1 seconds between requests to respect rate limits
    if (i > 0) {
      console.log('  Waiting 1.1s for rate limit...');
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    const searchQuery = `${helmet.brand} ${helmet.name} helmet`;
    const items = await searchProduct(searchQuery);

    if (items?.rateLimited) {
      console.log('  Waiting 5 seconds due to rate limit...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      i--; // Retry this helmet
      continue;
    }

    if (items && items.length > 0) {
      const firstItem = items[0];
      const key = `${helmet.brand}_${helmet.name}`.replace(/\s+/g, '_');

      results[key] = {
        asin: firstItem.ASIN,
        title: firstItem.ItemInfo?.Title?.DisplayValue,
        imageUrl: firstItem.Images?.Primary?.Large?.URL,
        price: firstItem.Offers?.Listings?.[0]?.Price?.DisplayAmount,
        detailPageUrl: `https://www.amazon.com/dp/${firstItem.ASIN}?tag=${API_CONFIG.partnerTag}`,
        lastUpdated: new Date().toISOString()
      };

      console.log(`  📦 ASIN: ${firstItem.ASIN}`);
      console.log(`  📷 Image: ${firstItem.Images?.Primary?.Large?.URL ? 'Yes' : 'No'}`);
      console.log(`  💰 Price: ${firstItem.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
    }
  }

  // Save results
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'amazonASINs-test.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Results saved to ${outputPath}`);
  console.log(`Found ${Object.keys(results).length} ASINs out of ${testHelmets.length} helmets`);
}

// Run the test
fetchTestASINs().catch(console.error);