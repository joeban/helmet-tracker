#!/usr/bin/env node

const { AmazonASINScraper } = require('../src/utils/amazonScraper.ts');
const { HELMETS } = require('../src/data/helmets.ts');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    offset: 0,
    headless: true,
    output: 'scraped-asins.csv',
    batchSize: 3
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i]);
    } else if (arg === '--offset' && i + 1 < args.length) {
      options.offset = parseInt(args[++i]);
    } else if (arg === '--headless' && i + 1 < args.length) {
      options.headless = args[++i] === 'true';
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--batch-size' && i + 1 < args.length) {
      options.batchSize = parseInt(args[++i]);
    } else if (arg === '--help') {
      console.log(`
Amazon ASIN Scraper

Usage: node scripts/scrape-asins.js [options]

Options:
  --limit <number>        Number of helmets to scrape (default: 10)
  --offset <number>       Starting index (default: 0)
  --headless <boolean>    Run browser in headless mode (default: true)
  --output <filename>     Output CSV filename (default: scraped-asins.csv)
  --batch-size <number>   Number of helmets per batch (default: 3)
  --help                  Show this help message

Examples:
  # Scrape first 10 helmets
  node scripts/scrape-asins.js

  # Scrape helmets 10-20 with visible browser
  node scripts/scrape-asins.js --offset 10 --limit 10 --headless false

  # Scrape 25 helmets in larger batches
  node scripts/scrape-asins.js --limit 25 --batch-size 5
      `);
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  console.log('🚀 Amazon ASIN Scraper Starting...');
  console.log(`📊 Configuration:`, options);

  // Get helmet subset
  const helmetsToScrape = HELMETS.slice(options.offset, options.offset + options.limit);

  if (helmetsToScrape.length === 0) {
    console.log('❌ No helmets to scrape with current offset/limit settings');
    process.exit(1);
  }

  console.log(`📋 Will scrape ${helmetsToScrape.length} helmets:`);
  helmetsToScrape.forEach((helmet, index) => {
    console.log(`  ${options.offset + index + 1}. ${helmet.brand} ${helmet.name}`);
  });

  // Initialize scraper
  const scraper = new AmazonASINScraper({
    headless: options.headless,
    delayMin: 3000,  // 3-7 second delays
    delayMax: 7000,
    maxRetries: 3
  });

  let results = [];

  try {
    // Start scraping
    console.log('\\n🕷️  Starting scraping process...');
    results = await scraper.scrapeMultipleHelmets(helmetsToScrape, options.batchSize);

    // Generate summary
    const successful = results.filter(r => r.success).length;
    const withASINs = results.filter(r => r.asins.length > 0).length;
    const avgConfidence = results
      .filter(r => r.asins.length > 0)
      .reduce((sum, r) => sum + r.confidence, 0) / (withASINs || 1);

    console.log('\\n📊 Scraping Summary:');
    console.log(`  ✅ Successful scrapes: ${successful}/${results.length}`);
    console.log(`  🎯 Helmets with ASINs: ${withASINs}/${results.length}`);
    console.log(`  📈 Average confidence: ${avgConfidence.toFixed(1)}%`);

    // Export to CSV
    const csv = AmazonASINScraper.exportToCSV(results);
    const outputPath = path.join(process.cwd(), options.output);
    fs.writeFileSync(outputPath, csv);

    console.log(`\\n💾 Results exported to: ${outputPath}`);

    // Show top results
    console.log('\\n🏆 Top Results:');
    results
      .filter(r => r.asins.length > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.helmet.brand} ${result.helmet.name}`);
        console.log(`     ASINs: ${result.asins.slice(0, 3).join(', ')} (${result.confidence.toFixed(1)}% confidence)`);
      });

    // Show failures if any
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('\\n❌ Failed scrapes:');
      failures.forEach(result => {
        console.log(`  - ${result.helmet.brand} ${result.helmet.name}: ${result.error}`);
      });
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }

  console.log('\\n✨ Scraping complete!');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Stopping scraper...');
  process.exit(0);
});

main().catch(console.error);