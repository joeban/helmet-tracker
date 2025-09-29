#!/usr/bin/env node

/**
 * Test PA-API with a single helmet
 * Simple script to verify API connectivity
 */

const aws4 = require('aws4');
const fetch = require('node-fetch').default;
require('dotenv').config({ path: '.env.local' });

// API Configuration
const API_CONFIG = {
  accessKey: process.env.AMAZON_ACCESS_KEY,
  secretKey: process.env.AMAZON_SECRET_KEY,
  partnerTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20',
  host: 'webservices.amazon.com',
  region: 'us-east-1'
};

// Test helmet - one we know has an ASIN
const TEST_HELMET = {
  brand: 'GIRO',
  name: 'SYNTAX MIPS',
  knownASIN: 'B0CKRYSQ88' // From our existing data
};

// Make signed request to PA-API
async function makeSignedRequest(operation, payload) {
  const request = {
    host: API_CONFIG.host,
    method: 'POST',
    path: '/paapi5/' + operation.toLowerCase(),
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'amz-1.0',
      'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`
    },
    service: 'ProductAdvertisingAPI',
    region: API_CONFIG.region,
    body: JSON.stringify(payload)
  };

  // Sign the request
  const signedRequest = aws4.sign(request, {
    accessKeyId: API_CONFIG.accessKey,
    secretAccessKey: API_CONFIG.secretKey
  });

  // Make the request
  const response = await fetch(`https://${request.host}${request.path}`, {
    method: request.method,
    headers: signedRequest.headers,
    body: request.body
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.Errors?.[0]?.Message || 'Unknown API error';
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  return data;
}

// Search for a helmet
async function searchHelmet(brand, name) {
  const searchQuery = `${brand} ${name} bicycle helmet`;
  console.log(`\nSearching for: "${searchQuery}"`);

  const payload = {
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    Keywords: searchQuery,
    SearchIndex: 'All',
    ItemCount: 3,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'Offers.Listings.Price'
    ]
  };

  try {
    const response = await makeSignedRequest('SearchItems', payload);

    if (response.SearchResult && response.SearchResult.Items) {
      console.log(`Found ${response.SearchResult.Items.length} results`);

      response.SearchResult.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.ItemInfo?.Title?.DisplayValue || 'No title'}`);
        console.log(`   ASIN: ${item.ASIN}`);
        console.log(`   Price: ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
        console.log(`   URL: ${item.DetailPageURL}`);
      });

      return response.SearchResult.Items[0]; // Return first result
    } else {
      console.log('No results found');
      return null;
    }
  } catch (error) {
    console.error('Search error:', error.message);
    throw error;
  }
}

// Get product by ASIN
async function getProductByASIN(asin) {
  console.log(`\nFetching product details for ASIN: ${asin}`);

  const payload = {
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    ItemIds: [asin],
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message'
    ]
  };

  try {
    const response = await makeSignedRequest('GetItems', payload);

    if (response.ItemsResult && response.ItemsResult.Items) {
      const item = response.ItemsResult.Items[0];
      console.log('\nProduct Details:');
      console.log(`Title: ${item.ItemInfo?.Title?.DisplayValue || 'N/A'}`);
      console.log(`Price: ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
      console.log(`Availability: ${item.Offers?.Listings?.[0]?.Availability?.Message || 'N/A'}`);
      console.log(`Image: ${item.Images?.Primary?.Large?.URL || 'N/A'}`);

      if (item.ItemInfo?.Features) {
        console.log('\nFeatures:');
        item.ItemInfo.Features.DisplayValues.forEach(feature => {
          console.log(`  - ${feature}`);
        });
      }

      return item;
    } else {
      console.log('Product not found');
      return null;
    }
  } catch (error) {
    console.error('GetItems error:', error.message);
    throw error;
  }
}

// Main test function
async function testSingleHelmet() {
  console.log('=================================');
  console.log('Testing PA-API with Single Helmet');
  console.log('=================================');

  // Check credentials
  if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
    console.error('❌ Missing Amazon API credentials in .env.local');
    console.error('Required: AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY');
    return;
  }

  console.log('✅ API credentials loaded');
  console.log(`Partner tag: ${API_CONFIG.partnerTag}`);

  try {
    // Test 1: Search for the helmet
    console.log('\n--- TEST 1: Search API ---');
    const searchResult = await searchHelmet(TEST_HELMET.brand, TEST_HELMET.name);

    if (searchResult) {
      console.log('✅ Search API working!');
    }

    // Wait 2 seconds to avoid rate limiting
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Get specific product by ASIN
    console.log('\n--- TEST 2: GetItems API ---');
    const product = await getProductByASIN(TEST_HELMET.knownASIN);

    if (product) {
      console.log('✅ GetItems API working!');
    }

    console.log('\n=================================');
    console.log('✅ PA-API Test Complete - All Systems Go!');
    console.log('=================================');
    console.log('\nYou can now run the full discovery process.');
    console.log('Remember to respect rate limits (wait 2+ seconds between requests).');

  } catch (error) {
    console.log('\n=================================');
    console.log('❌ PA-API Test Failed');
    console.log('=================================');

    if (error.message.includes('429')) {
      console.log('\n⏰ Rate Limited');
      console.log('The API is temporarily blocking requests.');
      console.log('Wait at least 1 hour before trying again.');
    } else if (error.message.includes('401')) {
      console.log('\n🔑 Authentication Error');
      console.log('Check your API credentials in .env.local');
    } else {
      console.log(`\nError: ${error.message}`);
    }
  }
}

// Run the test
if (require.main === module) {
  testSingleHelmet().catch(console.error);
}

module.exports = { testSingleHelmet };