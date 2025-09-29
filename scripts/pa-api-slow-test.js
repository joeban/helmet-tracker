#!/usr/bin/env node

/**
 * Ultra-conservative PA-API test
 * Respects 1 TPS rate limit for new accounts
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

console.log('=====================================');
console.log('PA-API Rate Limit Aware Test');
console.log('=====================================');
console.log('NEW ACCOUNT LIMITS:');
console.log('- 1 Transaction Per Second (TPS)');
console.log('- 8,640 Transactions Per Day (TPD)');
console.log('- Limits increase with affiliate sales\n');

async function makeRequest(operation, payload) {
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

  const signedRequest = aws4.sign(request, {
    accessKeyId: API_CONFIG.accessKey,
    secretAccessKey: API_CONFIG.secretKey
  });

  const response = await fetch(`https://${request.host}${request.path}`, {
    method: request.method,
    headers: signedRequest.headers,
    body: request.body
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data?.Errors?.[0]?.Message || 'Unknown error';
    throw new Error(`${response.status}: ${errorMessage}`);
  }

  return data;
}

async function testSingleRequest() {
  // Test with a single ASIN we know exists
  const payload = {
    PartnerTag: API_CONFIG.partnerTag,
    PartnerType: 'Associates',
    ItemIds: ['B0CKRYSQ88'], // Giro Syntax MIPS
    Resources: ['ItemInfo.Title']
  };

  console.log('Making SINGLE request (respecting 1 TPS limit)...\n');

  try {
    const startTime = Date.now();
    const result = await makeRequest('GetItems', payload);
    const elapsed = Date.now() - startTime;

    if (result.ItemsResult?.Items?.[0]) {
      const item = result.ItemsResult.Items[0];
      console.log('✅ SUCCESS! API is working!');
      console.log(`Response time: ${elapsed}ms`);
      console.log(`Product: ${item.ItemInfo?.Title?.DisplayValue}`);
      console.log(`ASIN: ${item.ASIN}\n`);

      // Calculate safe request rate
      const dailyLimit = 8640;
      const hoursPerDay = 24;
      const safeRequestsPerHour = Math.floor(dailyLimit / hoursPerDay);
      const secondsBetweenRequests = Math.ceil(3600 / safeRequestsPerHour);

      console.log('SAFE USAGE GUIDELINES:');
      console.log(`- Daily limit: ${dailyLimit} requests`);
      console.log(`- Safe rate: ${safeRequestsPerHour} requests/hour`);
      console.log(`- Wait time: ${secondsBetweenRequests} seconds between requests`);
      console.log(`- Processing all 281 helmets: ~${Math.ceil(281 / safeRequestsPerHour)} hours`);

      return true;
    }
  } catch (error) {
    if (error.message.includes('429')) {
      console.log('❌ STILL RATE LIMITED');
      console.log('\nPossible reasons:');
      console.log('1. Daily quota (8,640) may be exhausted');
      console.log('2. Need to wait for daily reset (midnight PST)');
      console.log('3. Account may need 24-hour cooldown\n');

      const now = new Date();
      const pstOffset = -8; // PST is UTC-8
      const utcHours = now.getUTCHours();
      const pstHours = (utcHours + pstOffset + 24) % 24;
      const hoursUntilMidnightPST = (24 - pstHours) % 24 || 24;

      console.log(`Time until midnight PST: ${hoursUntilMidnightPST} hours`);
      console.log('Try again after midnight PST for fresh daily quota.');
    } else {
      console.log('❌ Error:', error.message);
    }
    return false;
  }
}

// Run test
if (require.main === module) {
  if (!API_CONFIG.accessKey || !API_CONFIG.secretKey) {
    console.error('❌ Missing credentials in .env.local');
    process.exit(1);
  }

  testSingleRequest().then(success => {
    if (success) {
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('1. Use 10-second delays between requests (ultra-safe)');
      console.log('2. Process helmets in small batches (10-20 per hour)');
      console.log('3. Run overnight to use full daily quota');
      console.log('4. Generate affiliate sales to increase limits');
    }
  });
}