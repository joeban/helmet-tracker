import { chromium, Browser, Page } from 'playwright';
import { Helmet } from '@/types/helmet';

export interface ScrapedASINResult {
  helmet: Helmet;
  asins: string[];
  searchQueries: string[];
  confidence: number;
  titles: string[];
  prices: string[];
  imageUrls: string[];
  productUrls: string[];
  scrapedAt: Date;
  success: boolean;
  error?: string;
}

export interface ScrapeConfig {
  headless: boolean;
  delayMin: number;
  delayMax: number;
  maxRetries: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export class AmazonASINScraper {
  private browser: Browser | null = null;
  private config: ScrapeConfig;

  constructor(config: Partial<ScrapeConfig> = {}) {
    this.config = {
      headless: true,
      delayMin: 2000,
      delayMax: 5000,
      maxRetries: 3,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      ...config
    };
  }

  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  private async delay(): Promise<void> {
    const ms = Math.random() * (this.config.delayMax - this.config.delayMin) + this.config.delayMin;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSearchQueries(helmet: Helmet): string[] {
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

    return baseQueries.slice(0, 3); // Limit to 3 queries to avoid excessive requests
  }

  private async scrapeSearchPage(page: Page, query: string): Promise<{
    asins: string[];
    titles: string[];
    prices: string[];
    imageUrls: string[];
    productUrls: string[];
  }> {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&ref=sr_pg_1`;

    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle' });

      // Wait for search results to load
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });

      // Extract product data
      const productData = await page.evaluate(() => {
        const results = {
          asins: [] as string[],
          titles: [] as string[],
          prices: [] as string[],
          imageUrls: [] as string[],
          productUrls: [] as string[]
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

  private calculateConfidence(helmet: Helmet, titles: string[]): number {
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

  async scrapeHelmet(helmet: Helmet): Promise<ScrapedASINResult> {
    await this.initBrowser();

    const result: ScrapedASINResult = {
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

    let page: Page | null = null;

    try {
      if (!this.browser) throw new Error('Browser not initialized');

      page = await this.browser.newPage();

      // Set user agent and viewport
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewportSize(this.config.viewport!);

      // Set extra headers to look more human
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive'
      });

      const queries = this.generateSearchQueries(helmet);
      result.searchQueries = queries;

      const allAsins = new Set<string>();
      const allTitles: string[] = [];
      const allPrices: string[] = [];
      const allImageUrls: string[] = [];
      const allProductUrls: string[] = [];

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
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      console.error(`❌ Error scraping helmet ${helmet.id} (${helmet.brand} ${helmet.name}):`, error);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return result;
  }

  async scrapeMultipleHelmets(helmets: Helmet[], batchSize: number = 5): Promise<ScrapedASINResult[]> {
    const results: ScrapedASINResult[] = [];

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

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Export results to CSV format
  static exportToCSV(results: ScrapedASINResult[]): string {
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