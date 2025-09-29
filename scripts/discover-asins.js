#!/usr/bin/env node

/**
 * ASIN Discovery Script
 * Systematically finds Amazon ASINs for all helmets
 * Handles rate limiting and saves progress incrementally
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import our API utilities
const { searchProducts, getProductByASIN } = require('../src/utils/amazonProductAPI');
const helmetsData = require('../src/data/helmets.ts');

// Configuration
const PROGRESS_FILE = path.join(__dirname, '../data/asin-discovery-progress.json');
const ASIN_MAP_FILE = path.join(__dirname, '../data/helmet-asin-map.json');
const DELAY_BETWEEN_SEARCHES = 2000; // 2 seconds
const MAX_SEARCHES_PER_SESSION = 1; // Test with just 1 helmet for now

// Load or initialize progress
async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      completed: [],
      asins: {},
      lastProcessedIndex: 0,
      stats: {
        found: 0,
        notFound: 0,
        errors: 0,
        totalProcessed: 0
      }
    };
  }
}

// Save progress
async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  await fs.writeFile(ASIN_MAP_FILE, JSON.stringify(progress.asins, null, 2));
  console.log('Progress saved');
}

// Prioritize helmets by value
function prioritizeHelmets(helmets) {
  return helmets.sort((a, b) => {
    // Priority 1: 5-star safety rating
    if (a.star_rating === 5 && b.star_rating !== 5) return -1;
    if (b.star_rating === 5 && a.star_rating !== 5) return 1;

    // Priority 2: Popular brands
    const premiumBrands = ['SPECIALIZED', 'TREK', 'BONTRAGER', 'GIRO', 'BELL', 'POC', 'SMITH'];
    const aBrandPriority = premiumBrands.includes(a.brand.toUpperCase()) ? 1 : 0;
    const bBrandPriority = premiumBrands.includes(b.brand.toUpperCase()) ? 1 : 0;
    if (aBrandPriority !== bBrandPriority) return bBrandPriority - aBrandPriority;

    // Priority 3: Higher price (better commission)
    return b.min_price - a.min_price;
  });
}

// Search for helmet ASIN
async function findHelmetASIN(helmet) {
  const searchQueries = [
    // Try exact match first
    `${helmet.brand} ${helmet.name} bicycle helmet`,
    // Try without "bicycle"
    `${helmet.brand} ${helmet.name} helmet`,
    // Try with "cycling" instead
    `${helmet.brand} ${helmet.name} cycling helmet`
  ];

  for (const query of searchQueries) {
    try {
      console.log(`  Searching: "${query}"`);
      const results = await searchProducts(query, { maxResults: 5 });

      if (results && results.products && results.products.length > 0) {
        // Look for best match
        const helmetNameLower = helmet.name.toLowerCase();
        const brandLower = helmet.brand.toLowerCase();

        for (const product of results.products) {
          const titleLower = product.title.toLowerCase();

          // Check if title contains brand and model
          if (titleLower.includes(brandLower) &&
              (titleLower.includes(helmetNameLower) ||
               helmetNameLower.split(' ').every(word => titleLower.includes(word)))) {

            // Verify it's a helmet
            if (titleLower.includes('helmet')) {
              console.log(`  ✅ Found match: ${product.title}`);
              console.log(`     ASIN: ${product.asin}`);
              console.log(`     Price: ${product.price?.displayAmount || 'N/A'}`);

              return {
                asin: product.asin,
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                confidence: 'high',
                searchQuery: query
              };
            }
          }
        }

        // If no exact match, take first helmet result
        const firstHelmet = results.products.find(p => p.title.toLowerCase().includes('helmet'));
        if (firstHelmet) {
          console.log(`  ⚠️ Approximate match: ${firstHelmet.title}`);
          console.log(`     ASIN: ${firstHelmet.asin}`);
          return {
            asin: firstHelmet.asin,
            title: firstHelmet.title,
            price: firstHelmet.price,
            imageUrl: firstHelmet.imageUrl,
            confidence: 'medium',
            searchQuery: query
          };
        }
      }
    } catch (error) {
      if (error.message?.includes('429')) {
        console.log('  ❌ Rate limited! Stopping...');
        throw error;
      }
      console.log(`  Error searching: ${error.message}`);
    }

    // Small delay between search variations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('  ❌ No ASIN found');
  return null;
}

// Main discovery process
async function discoverASINs() {
  console.log('Starting ASIN Discovery Process');
  console.log('================================\n');

  // Load helmets and prioritize
  const helmets = prioritizeHelmets(helmetsData.helmets);
  const progress = await loadProgress();

  console.log(`Total helmets: ${helmets.length}`);
  console.log(`Already processed: ${progress.stats.totalProcessed}`);
  console.log(`ASINs found: ${progress.stats.found}`);
  console.log(`Starting from index: ${progress.lastProcessedIndex}\n`);

  let searchCount = 0;
  let rateLimited = false;

  for (let i = progress.lastProcessedIndex; i < helmets.length; i++) {
    const helmet = helmets[i];
    const helmetKey = `${helmet.brand}_${helmet.name}`.replace(/\s+/g, '_').toUpperCase();

    // Skip if already processed
    if (progress.completed.includes(helmetKey)) {
      console.log(`Skipping ${helmet.brand} ${helmet.name} (already processed)`);
      continue;
    }

    // Check session limit
    if (searchCount >= MAX_SEARCHES_PER_SESSION) {
      console.log('\n🛑 Session limit reached. Run again to continue.');
      break;
    }

    console.log(`\n[${i + 1}/${helmets.length}] Processing: ${helmet.brand} ${helmet.name}`);
    console.log(`  Safety: ${helmet.star_rating} stars, Score: ${helmet.safety_score}`);
    console.log(`  Price: $${helmet.min_price} - $${helmet.max_price}`);

    try {
      const result = await findHelmetASIN(helmet);

      if (result) {
        progress.asins[helmetKey] = result;
        progress.stats.found++;
      } else {
        progress.stats.notFound++;
      }

      progress.completed.push(helmetKey);
      progress.stats.totalProcessed++;
      progress.lastProcessedIndex = i + 1;
      searchCount++;

      // Save progress after each helmet
      await saveProgress(progress);

      // Rate limit delay
      console.log(`  Waiting ${DELAY_BETWEEN_SEARCHES}ms...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_SEARCHES));

    } catch (error) {
      if (error.message?.includes('429')) {
        console.log('\n🚨 Rate limited! Progress saved. Try again in 1 hour.');
        rateLimited = true;
        break;
      }
      console.log(`  Error: ${error.message}`);
      progress.stats.errors++;
    }
  }

  // Final report
  console.log('\n================================');
  console.log('Session Summary');
  console.log('================================');
  console.log(`Processed this session: ${searchCount}`);
  console.log(`Total processed: ${progress.stats.totalProcessed}/${helmets.length}`);
  console.log(`ASINs found: ${progress.stats.found}`);
  console.log(`Not found: ${progress.stats.notFound}`);
  console.log(`Errors: ${progress.stats.errors}`);
  console.log(`Progress: ${((progress.stats.totalProcessed / helmets.length) * 100).toFixed(1)}%`);

  if (rateLimited) {
    console.log('\n⏰ Rate limited. Wait at least 1 hour before running again.');
  } else if (progress.stats.totalProcessed < helmets.length) {
    console.log('\n✅ Session complete. Run again to continue discovery.');
  } else {
    console.log('\n🎉 All helmets processed!');
    console.log(`Found ASINs for ${progress.stats.found} out of ${helmets.length} helmets`);
    console.log(`Success rate: ${((progress.stats.found / helmets.length) * 100).toFixed(1)}%`);
  }
}

// Run if executed directly
if (require.main === module) {
  discoverASINs().catch(console.error);
}

module.exports = { discoverASINs, findHelmetASIN };