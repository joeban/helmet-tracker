#!/usr/bin/env node

/**
 * Test Amazon Product Advertising API
 * Run with: node test-amazon-api.js
 */

import('dotenv/config');
import aws4 from 'aws4';
import fetch from 'node-fetch';

const API_CONFIG = {
  host: 'webservices.amazon.com',
  region: 'us-east-1',
  service: 'ProductAdvertisingAPI',
  accessKey: process.env.AMAZON_ACCESS_KEY || '',
  secretKey: process.env.AMAZON_SECRET_KEY || '',
  partnerTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'
};

async function testAPI() {
  console.log('Testing Amazon Product Advertising API...');
  console.log('Access Key:', API_CONFIG.accessKey ? '✅ Set' : '❌ Missing');
  console.log('Secret Key:', API_CONFIG.secretKey ? '✅ Set' : '❌ Missing');
  console.log('Partner Tag:', API_CONFIG.partnerTag);
  console.log('');

  if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
    console.error('❌ API credentials not found in .env.local');
    return;
  }

  // Test with a simple search
  const operation = 'SearchItems';
  const payload = {
    Keywords: 'Bell Z20 MIPS helmet',
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

  // Sign the request
  const signedRequest = aws4.sign(request, {
    accessKeyId: API_CONFIG.accessKey,
    secretAccessKey: API_CONFIG.secretKey
  });

  try {
    console.log('Sending request to Amazon PA-API...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: signedRequest.headers,
      body: signedRequest.body
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ API Test Successful!');
    console.log('Total Results:', data.SearchResult?.TotalResultCount);

    if (data.SearchResult?.Items?.length > 0) {
      console.log('\nProducts Found:');
      data.SearchResult.Items.forEach((item, i) => {
        console.log(`${i + 1}. ${item.ItemInfo?.Title?.DisplayValue || 'Unknown'}`);
        console.log(`   ASIN: ${item.ASIN}`);
        console.log(`   Price: ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAPI();