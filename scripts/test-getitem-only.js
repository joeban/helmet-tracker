#!/usr/bin/env node

/**
 * Minimal GetItems test - sometimes has different rate limits than Search
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

// Test with a known ASIN
const TEST_ASIN = 'B0CKRYSQ88'; // Giro Syntax MIPS

async function testGetItem() {
  console.log('Testing GetItems API with known ASIN:', TEST_ASIN);
  console.log('This uses a different endpoint that may have separate rate limits.\n');

  const payload = {
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    ItemIds: [TEST_ASIN],
    Resources: ['ItemInfo.Title', 'Offers.Listings.Price']
  };

  const request = {
    host: API_CONFIG.host,
    method: 'POST',
    path: '/paapi5/getitems',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'amz-1.0',
      'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
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

  try {
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

    if (data.ItemsResult && data.ItemsResult.Items && data.ItemsResult.Items[0]) {
      const item = data.ItemsResult.Items[0];
      console.log('✅ SUCCESS! GetItems API is working!\n');
      console.log('Product found:');
      console.log(`Title: ${item.ItemInfo?.Title?.DisplayValue || 'N/A'}`);
      console.log(`ASIN: ${item.ASIN}`);
      console.log(`Price: ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
      console.log(`URL: ${item.DetailPageURL}`);
      return true;
    } else {
      console.log('⚠️ No product data returned');
      return false;
    }
  } catch (error) {
    if (error.message.includes('429')) {
      console.log('❌ Still rate limited on GetItems endpoint');
      console.log('Both Search and GetItems APIs are blocked.');
      console.log('Amazon rate limits are account-wide.');
    } else {
      console.log('❌ Error:', error.message);
    }
    return false;
  }
}

// Run test
if (require.main === module) {
  if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
    console.error('❌ Missing Amazon API credentials in .env.local');
    process.exit(1);
  }

  testGetItem().then(success => {
    if (success) {
      console.log('\n🎉 You can now run the data collection scripts!');
      console.log('Remember to maintain 2+ second delays between requests.');
    } else {
      console.log('\n⏰ Please wait before trying again.');
      console.log('Rate limits typically reset after 1-24 hours.');
    }
  });
}