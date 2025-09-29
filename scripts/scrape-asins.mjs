#!/usr/bin/env node

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import helmet data (we'll read it as JSON)
function loadHelmets() {
  try {
    // Try to read from the TypeScript file and extract the data
    const helmetFilePath = join(__dirname, '..', 'src', 'data', 'helmets.ts');
    const helmetFileContent = readFileSync(helmetFilePath, 'utf-8');

    // Extract the JSON array from the TypeScript export - improved regex
    const jsonMatch = helmetFileContent.match(/export const HELMETS: Helmet\[\] = (\[[\s\S]*?\]);[\s\S]*$/);
    if (!jsonMatch) {
      throw new Error('Could not parse HELMETS array from helmets.ts');
    }

    // More robust JSON cleaning
    let jsonString = jsonMatch[1]
      // Quote unquoted property names
      .replace(/(\w+):/g, '"$1":')
      // Change single quotes to double quotes
      .replace(/'/g, '"')
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Handle undefined values
      .replace(/:\s*undefined/g, ': null');

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error loading helmets data:', error.message);
    console.log('Using sample helmet data for testing...');

    // Extended fallback with more realistic test data
    return [
      { id: 1, brand: 'Giro', name: 'Synthe MIPS', category: 'Road', min_price: 200, max_price: 250 },
      { id: 2, brand: 'Smith', name: 'Network MIPS', category: 'Road', min_price: 120, max_price: 150 },
      { id: 3, brand: 'Bell', name: 'Zephyr MIPS', category: 'Road', min_price: 100, max_price: 130 },
      { id: 4, brand: 'POC', name: 'Ventral Air Spin', category: 'Road', min_price: 180, max_price: 220 },
      { id: 5, brand: 'Specialized', name: 'Align II', category: 'Urban', min_price: 50, max_price: 70 }
    ];
  }
}

// Scraper implementation
class AmazonASINScraper {
  constructor(config = {}) {
    this.config = {
      headless: true,
      delayMin: 2000,
      delayMax: 5000,
      maxRetries: 3,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ...config
    };
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--no-first-run',
          '--no-default-browser-check'
        ]
      });
    }
  }

  async delay() {
    const ms = Math.random() * (this.config.delayMax - this.config.delayMin) + this.config.delayMin;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSearchQueries(helmet) {
    const baseQueries = [
      `${helmet.brand} ${helmet.name} bicycle helmet`,
      `${helmet.brand} ${helmet.name} bike helmet`,
      `${helmet.brand} ${helmet.name} cycling helmet`
    ];

    // Add MIPS/WaveCel variants if helmet name suggests it
    const name = helmet.name.toLowerCase();
    if (name.includes('mips')) {
      baseQueries.push(`${helmet.brand} ${helmet.name.replace(/mips/i, '').trim()} MIPS helmet`);
    }
    if (name.includes('wavecel')) {
      baseQueries.push(`${helmet.brand} ${helmet.name.replace(/wavecel/i, '').trim()} WaveCel helmet`);
    }

    return baseQueries.slice(0, 3); // Limit to 3 queries
  }

  async scrapeSearchPage(page, query) {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&ref=sr_pg_1`;

    try {
      // More lenient page loading with longer timeout
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      // Check for CAPTCHA or bot detection
      const captchaExists = await page.locator('form[action*="validateCaptcha"]').count();
      const robotCheckExists = await page.locator('text=Robot Check').count();

      if (captchaExists > 0 || robotCheckExists > 0) {
        console.log('⚠️  Amazon CAPTCHA/Robot check detected - skipping this query');
        return {
          asins: [],
          titles: [],
          prices: [],
          imageUrls: [],
          productUrls: []
        };
      }

      // Try multiple selectors as Amazon changes their markup
      const searchResultSelectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item',
        '[data-asin]:not([data-asin=""])',
        '.sg-col-inner .s-widget-container'
      ];

      let resultsLoaded = false;
      for (const selector of searchResultSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 15000 });
          resultsLoaded = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!resultsLoaded) {
        console.log('⚠️  No search results found - Amazon may have changed layout');
        return {
          asins: [],
          titles: [],
          prices: [],
          imageUrls: [],
          productUrls: []
        };
      }

      // Extract product data
      const productData = await page.evaluate(() => {
        const results = {
          asins: [],
          titles: [],
          prices: [],
          imageUrls: [],
          productUrls: []
        };

        // Find all product containers
        const productContainers = document.querySelectorAll('[data-component-type="s-search-result"]');

        productContainers.forEach((container) => {
          // Extract ASIN
          const asin = container.getAttribute('data-asin');
          if (!asin || asin.length !== 10) return;

          // Extract title
          const titleElement = container.querySelector('h2 a span, .s-size-mini span');
          const title = titleElement?.textContent?.trim() || '';

          // Skip if not helmet-related
          const titleLower = title.toLowerCase();
          if (!titleLower.includes('helmet') && !titleLower.includes('bike') && !titleLower.includes('cycling')) {
            return;
          }

          // Extract price
          const priceElement = container.querySelector('.a-price .a-offscreen, .a-price-whole');
          const price = priceElement?.textContent?.trim() || '';

          // Extract image URL
          const imageElement = container.querySelector('img');
          const imageUrl = imageElement?.getAttribute('src') || '';

          // Build product URL
          const productUrl = `https://www.amazon.com/dp/${asin}`;

          results.asins.push(asin);
          results.titles.push(title);
          results.prices.push(price);
          results.imageUrls.push(imageUrl);
          results.productUrls.push(productUrl);
        });

        return results;
      });

      return productData;
    } catch (error) {
      console.error(`Error scraping search page for query "${query}":`, error);
      return {
        asins: [],
        titles: [],
        prices: [],
        imageUrls: [],
        productUrls: []
      };
    }
  }

  calculateConfidence(helmet, titles) {
    if (titles.length === 0) return 0;

    const helmetBrand = helmet.brand.toLowerCase();
    const helmetName = helmet.name.toLowerCase();

    let totalScore = 0;
    let validTitles = 0;

    titles.forEach(title => {
      const titleLower = title.toLowerCase();
      let score = 0;

      // Brand match (high importance)
      if (titleLower.includes(helmetBrand)) score += 40;

      // Model name match (high importance)
      if (titleLower.includes(helmetName)) score += 40;

      // Category match
      if (titleLower.includes('helmet')) score += 10;
      if (titleLower.includes('bike') || titleLower.includes('cycling') || titleLower.includes('bicycle')) score += 5;

      // MIPS/WaveCel match
      if (helmetName.includes('mips') && titleLower.includes('mips')) score += 5;
      if (helmetName.includes('wavecel') && titleLower.includes('wavecel')) score += 5;

      if (score > 0) {
        totalScore += score;
        validTitles++;
      }
    });

    return validTitles > 0 ? Math.min(100, totalScore / validTitles) : 0;
  }

  async scrapeHelmet(helmet) {
    await this.initBrowser();

    const result = {
      helmet,
      asins: [],
      searchQueries: [],
      confidence: 0,
      titles: [],
      prices: [],
      imageUrls: [],
      productUrls: [],
      scrapedAt: new Date(),
      success: false
    };

    let page = null;

    try {
      if (!this.browser) throw new Error('Browser not initialized');

      page = await this.browser.newPage();

      // Set viewport
      await page.setViewportSize(this.config.viewport);

      // Set headers to look more human
      await page.setExtraHTTPHeaders({
        'User-Agent': this.config.userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive'
      });

      const queries = this.generateSearchQueries(helmet);
      result.searchQueries = queries;

      const allAsins = new Set();
      const allTitles = [];
      const allPrices = [];
      const allImageUrls = [];
      const allProductUrls = [];

      // Scrape each search query
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];

        console.log(`Scraping helmet ${helmet.id}: "${query}" (${i + 1}/${queries.length})`);

        const searchData = await this.scrapeSearchPage(page, query);

        // Collect unique ASINs and corresponding data
        searchData.asins.forEach((asin, index) => {
          if (!allAsins.has(asin)) {
            allAsins.add(asin);
            allTitles.push(searchData.titles[index] || '');
            allPrices.push(searchData.prices[index] || '');
            allImageUrls.push(searchData.imageUrls[index] || '');
            allProductUrls.push(searchData.productUrls[index] || '');
          }
        });

        // Delay between queries
        if (i < queries.length - 1) {
          await this.delay();
        }
      }

      result.asins = Array.from(allAsins);
      result.titles = allTitles;
      result.prices = allPrices;
      result.imageUrls = allImageUrls;
      result.productUrls = allProductUrls;
      result.confidence = this.calculateConfidence(helmet, allTitles);
      result.success = true;

      console.log(`✅ Successfully scraped ${result.asins.length} ASINs for ${helmet.brand} ${helmet.name} (confidence: ${result.confidence.toFixed(1)}%)`);

    } catch (error) {
      result.error = error.message;
      result.success = false;
      console.error(`❌ Error scraping helmet ${helmet.id} (${helmet.brand} ${helmet.name}):`, error);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return result;
  }

  async scrapeMultipleHelmets(helmets, batchSize = 5) {
    const results = [];

    console.log(`🚀 Starting scrape of ${helmets.length} helmets in batches of ${batchSize}`);

    for (let i = 0; i < helmets.length; i += batchSize) {
      const batch = helmets.slice(i, i + batchSize);

      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(helmets.length / batchSize)} (${batch.length} helmets)`);

      // Process batch sequentially to avoid overwhelming Amazon
      for (const helmet of batch) {
        const result = await this.scrapeHelmet(helmet);
        results.push(result);

        // Delay between helmets
        await this.delay();
      }

      // Longer delay between batches
      if (i + batchSize < helmets.length) {
        console.log('⏳ Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second break
      }
    }

    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  static exportToCSV(results) {
    const headers = [
      'helmet_id',
      'brand',
      'model',
      'category',
      'vt_price',
      'asins_found',
      'best_asin',
      'best_title',
      'best_price',
      'confidence',
      'search_queries',
      'scraped_at'
    ];

    const rows = results.map(result => {
      const bestIndex = 0; // Take first ASIN as "best" for now
      return [
        result.helmet.id,
        result.helmet.brand,
        result.helmet.name,
        result.helmet.category,
        result.helmet.min_price,
        result.asins.length,
        result.asins[bestIndex] || 'NOT_FOUND',
        result.titles[bestIndex] || '',
        result.prices[bestIndex] || '',
        result.confidence.toFixed(1),
        result.searchQueries.join(' | '),
        result.scrapedAt.toISOString()
      ];
    });

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 10,
    offset: 0,
    headless: true,
    output: 'scraped-asins.json',
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

Usage: node scripts/scrape-asins.mjs [options]

Options:
  --limit <number>        Number of helmets to scrape (default: 10)
  --offset <number>       Starting index (default: 0)
  --headless <boolean>    Run browser in headless mode (default: true)
  --output <filename>     Output JSON filename (default: scraped-asins.json)
  --batch-size <number>   Number of helmets per batch (default: 3)
  --help                  Show this help message

Examples:
  # Scrape first 5 helmets
  node scripts/scrape-asins.mjs --limit 5

  # Scrape helmets 10-15 with visible browser
  node scripts/scrape-asins.mjs --offset 10 --limit 5 --headless false

  # Scrape 25 helmets in larger batches
  node scripts/scrape-asins.mjs --limit 25 --batch-size 5
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

  // Load helmet data
  const HELMETS = loadHelmets();
  console.log(`📋 Loaded ${HELMETS.length} helmets from database`);

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
    console.log('\n🕷️  Starting scraping process...');
    results = await scraper.scrapeMultipleHelmets(helmetsToScrape, options.batchSize);

    // Generate summary
    const successful = results.filter(r => r.success).length;
    const withASINs = results.filter(r => r.asins.length > 0).length;
    const avgConfidence = results
      .filter(r => r.asins.length > 0)
      .reduce((sum, r) => sum + r.confidence, 0) / (withASINs || 1);

    console.log('\n📊 Scraping Summary:');
    console.log(`  ✅ Successful scrapes: ${successful}/${results.length}`);
    console.log(`  🎯 Helmets with ASINs: ${withASINs}/${results.length}`);
    console.log(`  📈 Average confidence: ${avgConfidence.toFixed(1)}%`);

    // Export to JSON
    const outputPath = join(process.cwd(), options.output);
    writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n💾 Results exported to: ${outputPath}`);

    // Also export CSV
    const csvPath = outputPath.replace('.json', '.csv');
    const csv = AmazonASINScraper.exportToCSV(results);
    writeFileSync(csvPath, csv);
    console.log(`📊 CSV export saved to: ${csvPath}`);

    // Show top results
    console.log('\n🏆 Top Results:');
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
      console.log('\n❌ Failed scrapes:');
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

  console.log('\n✨ Scraping complete!');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping scraper...');
  process.exit(0);
});

main().catch(console.error);