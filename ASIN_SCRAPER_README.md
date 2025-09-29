# Amazon ASIN Scraper System

A complete Playwright-based system for automatically discovering Amazon ASINs for your helmet database. This replaces the paid Keepa API with a free, self-hosted solution.

## 🚀 Features

- **Free & Open Source**: No API costs or subscription fees
- **Smart Matching**: Uses fuzzy matching with confidence scoring
- **Rate Limited**: Built-in delays to respect Amazon's servers
- **Batch Processing**: Processes helmets in configurable batches
- **Multiple Export Formats**: JSON and CSV output
- **Integration Ready**: Works with existing ASIN management system
- **Anti-Detection**: Randomized delays and human-like headers

## 📋 Prerequisites

- Node.js 18+ installed
- Playwright browser binaries (automatically installed)
- Your helmet database (loads from `src/data/helmets.ts`)

## 🛠️ Installation

The scraper is already set up in your project! Playwright was installed during setup:

```bash
npm install playwright
npx playwright install chromium
```

## 🕷️ Usage

### Basic Scraping

Scrape the first 10 helmets (recommended for testing):
```bash
node scripts/scrape-asins.mjs --limit 10
```

### Advanced Options

```bash
# Scrape specific range of helmets
node scripts/scrape-asins.mjs --offset 20 --limit 15

# Run with visible browser (for debugging)
node scripts/scrape-asins.mjs --limit 5 --headless false

# Larger batches (more aggressive)
node scripts/scrape-asins.mjs --limit 25 --batch-size 5

# Custom output file
node scripts/scrape-asins.mjs --limit 10 --output my-results.json
```

### All Options

| Option | Default | Description |
|--------|---------|-------------|
| `--limit` | 10 | Number of helmets to scrape |
| `--offset` | 0 | Starting index in helmet database |
| `--headless` | true | Run browser in background |
| `--output` | scraped-asins.json | Output filename |
| `--batch-size` | 3 | Helmets per batch |
| `--help` | - | Show help message |

## 📊 Output Formats

The scraper creates two files:

### JSON Output (`scraped-asins.json`)
```json
[
  {
    "helmet": { "id": 1, "brand": "Giro", "name": "Synthe MIPS" },
    "asins": ["B08XYZ123A", "B09ABC456B"],
    "searchQueries": ["Giro Synthe MIPS bicycle helmet", "Giro Synthe bike helmet"],
    "confidence": 85.5,
    "titles": ["Giro Synthe MIPS Road Cycling Helmet", "Giro Synthe Adult Bike Helmet"],
    "prices": ["$199.99", "$189.95"],
    "productUrls": ["https://amazon.com/dp/B08XYZ123A", "https://amazon.com/dp/B09ABC456B"],
    "scrapedAt": "2024-01-15T10:30:00.000Z",
    "success": true
  }
]
```

### CSV Output (`scraped-asins.csv`)
| helmet_id | brand | model | asins_found | best_asin | confidence |
|-----------|-------|-------|-------------|-----------|------------|
| 1 | Giro | Synthe MIPS | 2 | B08XYZ123A | 85.5 |

## 🎯 Confidence Scoring

The scraper calculates confidence scores based on:

- **Brand Match (40 points)**: Exact brand name in Amazon title
- **Model Match (40 points)**: Helmet model name in Amazon title
- **Category Match (10 points)**: "helmet" in title
- **Bike Match (5 points)**: "bike", "cycling", or "bicycle" in title
- **Tech Match (5 points)**: MIPS/WaveCel if applicable

**Confidence Levels:**
- 80-100%: High confidence, auto-verify recommended
- 60-79%: Good confidence, manual review suggested
- 30-59%: Medium confidence, careful review needed
- Below 30%: Low confidence, likely false positive

## 🔄 Integration with ASIN Manager

### Via Dashboard
1. Add `?scraper_dashboard=true` to your URL
2. Click the 🕷️ Scraper button
3. Use the Import tab to paste JSON results
4. Auto-imports with confidence scoring

### Via Code
```typescript
import { ScraperIntegration } from '@/utils/scraperIntegration';

const integration = new ScraperIntegration();
const results = JSON.parse(scrapedResultsJSON);

const stats = integration.importScrapedResults(results, {
  minConfidence: 30,
  autoVerifyHighConfidence: true,
  highConfidenceThreshold: 80
});

console.log(`Added ${stats.newASINsAdded} new ASINs`);
```

## 📈 Best Practices

### Recommended Workflow

1. **Start Small**: Test with 5-10 helmets first
   ```bash
   node scripts/scrape-asins.mjs --limit 5 --headless false
   ```

2. **Review Results**: Check confidence scores and accuracy

3. **Scale Gradually**: Process 25-50 helmets per session
   ```bash
   node scripts/scrape-asins.mjs --limit 25 --batch-size 3
   ```

4. **Import & Verify**: Use the dashboard to import and verify results

5. **Continue**: Process next batch with `--offset`

### Rate Limiting Guidelines

- **Batch Size**: Keep under 5 helmets per batch
- **Session Limit**: Max 50 helmets per session
- **Frequency**: Wait 30+ minutes between sessions
- **Monitoring**: Watch for CAPTCHA or blocking

### Optimal Settings by Use Case

**Development/Testing:**
```bash
node scripts/scrape-asins.mjs --limit 3 --headless false --batch-size 1
```

**Production (Conservative):**
```bash
node scripts/scrape-asins.mjs --limit 25 --batch-size 3
```

**Production (Aggressive):**
```bash
node scripts/scrape-asins.mjs --limit 50 --batch-size 5
```

## 🔧 Configuration

The scraper includes anti-detection features:

- **Random Delays**: 3-7 seconds between requests
- **Human Headers**: Realistic browser headers
- **Batch Delays**: 10 second breaks between batches
- **Viewport**: Standard desktop resolution
- **User Agent**: Latest Chrome on macOS

## ⚠️ Important Notes

### Compliance
- Respects Amazon's robots.txt where possible
- Uses reasonable delays to avoid overwhelming servers
- For educational/research purposes

### Limitations
- Amazon may show CAPTCHAs with heavy usage
- Some helmets may not exist on US Amazon
- Discontinued models will show NOT_FOUND
- Results depend on current Amazon search algorithm

### Troubleshooting

**Common Issues:**

1. **"Helmet data not found"**
   - Script falls back to sample data
   - Check `src/data/helmets.ts` exists

2. **"page.setUserAgent is not a function"**
   - Fixed in current version
   - Update Playwright: `npm update playwright`

3. **No results found**
   - Try with `--headless false` to see what's happening
   - Amazon may be showing CAPTCHAs
   - Wait 30+ minutes and try again

4. **Low confidence scores**
   - Normal for some helmets
   - Adjust search queries in `generateSearchQueries()`
   - Some models may not be available on Amazon

## 📊 Example Session

```bash
$ node scripts/scrape-asins.mjs --limit 5

🚀 Amazon ASIN Scraper Starting...
📊 Configuration: { limit: 5, offset: 0, headless: true, batchSize: 3 }
📋 Loaded 281 helmets from database
📋 Will scrape 5 helmets:
  1. Giro Synthe MIPS
  2. Smith Persist MIPS
  3. Bell Z20 MIPS
  4. POC Octal MIPS
  5. Specialized S-Works Prevail

🕷️ Starting scraping process...

📦 Processing batch 1/2 (3 helmets)
Scraping helmet 1: "Giro Synthe MIPS bicycle helmet" (1/3)
✅ Successfully scraped 3 ASINs for Giro Synthe MIPS (confidence: 87.2%)
Scraping helmet 2: "Smith Persist MIPS bicycle helmet" (1/3)
✅ Successfully scraped 2 ASINs for Smith Persist MIPS (confidence: 82.1%)
Scraping helmet 3: "Bell Z20 MIPS bicycle helmet" (1/3)
✅ Successfully scraped 4 ASINs for Bell Z20 MIPS (confidence: 91.3%)

⏳ Waiting between batches...

📦 Processing batch 2/2 (2 helmets)
Scraping helmet 4: "POC Octal MIPS bicycle helmet" (1/3)
✅ Successfully scraped 1 ASINs for POC Octal MIPS (confidence: 75.8%)
Scraping helmet 5: "Specialized S-Works Prevail bicycle helmet" (1/3)
✅ Successfully scraped 2 ASINs for Specialized S-Works Prevail (confidence: 88.9%)

📊 Scraping Summary:
  ✅ Successful scrapes: 5/5
  🎯 Helmets with ASINs: 5/5
  📈 Average confidence: 85.1%

💾 Results exported to: scraped-asins.json
📊 CSV export saved to: scraped-asins.csv

🏆 Top Results:
  1. Bell Z20 MIPS
     ASINs: B08ABC123, B09DEF456, B07GHI789 (91.3% confidence)
  2. Specialized S-Works Prevail
     ASINs: B08JKL012, B09MNO345 (88.9% confidence)

✨ Scraping complete!
```

## 🎯 Next Steps

1. **Test the scraper** with a small batch
2. **Import results** via the scraper dashboard
3. **Verify high-confidence ASINs** manually
4. **Scale up gradually** to process more helmets
5. **Monitor success rates** and adjust as needed

The scraper is now ready to replace your Keepa API dependency completely! 🎉