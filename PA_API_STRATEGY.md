# Amazon PA-API Data Collection Strategy

## Current Situation
- **281 total helmets** in Virginia Tech database
- **43 ASINs collected** (15% coverage)
- **Severe rate limiting**: ~1 request/second max, hours to recover from 429s
- **Local-only architecture** to prevent public rate limiting

## Strategic Goals
1. **100% ASIN Coverage**: Find Amazon ASINs for all 281 helmets
2. **Rich Product Data**: Images, prices, availability, ratings
3. **Sustainable Updates**: Weekly refresh without hitting rate limits
4. **Zero Downtime**: Never expose users to API failures

## Phase 1: ASIN Discovery (Week 1-2)
### Priority Tiers
**Tier 1 - High Value (50 helmets)**
- 5-star safety rated helmets (highest conversion potential)
- Popular brands: Specialized, Trek/Bontrager, Giro, Bell
- High search volume models

**Tier 2 - Medium Value (100 helmets)**
- 4-star safety rated helmets
- Mid-tier brands: POC, Scott, MET, Lazer
- $150-300 price range (good commission potential)

**Tier 3 - Low Priority (131 helmets)**
- Lower safety ratings
- Budget helmets under $100
- Obscure/discontinued models

### Discovery Methods
1. **SearchItems API** (Primary)
   ```javascript
   // Search pattern: "brand model helmet"
   const searchQuery = `${helmet.brand} ${helmet.name} bicycle helmet`;
   const results = await searchProducts(searchQuery, { maxResults: 3 });
   // Manual verification of best match
   ```

2. **Manual Collection** (Backup)
   - Use Amazon.com search for ambiguous models
   - Verify exact model match
   - Record confidence score (high/medium/low)

3. **Batch Processing**
   - 5 helmets per session (stay under rate limits)
   - 2-second delay between requests
   - Save progress after each batch

## Phase 2: Data Enrichment (Week 2-3)
### GetItems API Strategy
```javascript
// Batch retrieve product data for known ASINs
const batchSize = 10; // PA-API allows up to 10 items per request
const resources = [
  'Images.Primary.Large',
  'Offers.Listings.Price',
  'Offers.Listings.Availability.Message',
  'ItemInfo.Title',
  'ItemInfo.Features',
  'BrowseNodeInfo.BrowseNodes'
];
```

### Data Points to Collect
- **Images**: Primary product image (high-res)
- **Pricing**: Current price, list price, savings
- **Availability**: In stock, shipping time
- **Product Info**: Full title, features, description
- **Ratings**: Stars, review count (if available)
- **Category**: Browse nodes for better classification

### Rate Limit Management
```javascript
// Safe rate limiting approach
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds
const MAX_REQUESTS_PER_HOUR = 1800; // Stay well under limit
const BATCH_SIZE = 10; // Process 10 ASINs at once

async function updateWithRateLimit() {
  let requestCount = 0;
  const startTime = Date.now();

  for (const batch of batches) {
    await processB atch(batch);
    await sleep(DELAY_BETWEEN_REQUESTS);
    requestCount++;

    // Hour break after 1800 requests
    if (requestCount >= MAX_REQUESTS_PER_HOUR) {
      const elapsed = Date.now() - startTime;
      const waitTime = 3600000 - elapsed; // Wait remainder of hour
      await sleep(waitTime);
      requestCount = 0;
    }
  }
}
```

## Phase 3: Database Structure
### Enhanced amazonProductCache.ts
```typescript
interface EnrichedProductData {
  // Helmet mapping
  helmetId: string;
  brand: string;
  name: string;

  // Amazon data
  asin: string;
  title: string;
  imageUrl: string;
  price: {
    current: number;
    list: number;
    currency: string;
    savings: number;
    savingsPercent: number;
  };
  availability: {
    inStock: boolean;
    message: string;
    isPrime: boolean;
  };
  ratings: {
    stars: number;
    count: number;
  };

  // Metadata
  lastUpdated: string;
  confidence: 'high' | 'medium' | 'low';
  dataSource: 'api' | 'manual';
}

// Efficient storage
export const HELMET_PRODUCTS = new Map<string, EnrichedProductData>();
```

## Phase 4: Implementation Timeline

### Week 1: ASIN Discovery
- Day 1-2: Tier 1 helmets (50 ASINs)
- Day 3-4: Tier 2 helmets (100 ASINs)
- Day 5-7: Tier 3 helmets (131 ASINs)

### Week 2: Data Collection
- Batch process all ASINs through GetItems
- Store images locally or use Amazon CDN
- Build price/availability database

### Week 3: Integration
- Update components to use rich data
- Implement fallbacks for missing data
- Test and optimize performance

### Week 4: Automation
- Weekly update cron job
- Monitoring and alerts
- Performance optimization

## Phase 5: Automation Script
```javascript
// scripts/update-helmet-data.js
async function weeklyUpdate() {
  console.log('Starting weekly helmet data update...');

  // 1. Load existing ASIN mappings
  const asinMap = loadASINMappings();

  // 2. Update product data in batches
  const batches = chunk(Array.from(asinMap.values()), 10);

  for (const batch of batches) {
    try {
      const products = await getProductsByASIN(batch);
      await saveProductData(products);
      console.log(`Updated ${batch.length} products`);
      await sleep(2000); // Rate limit delay
    } catch (error) {
      if (error.message.includes('429')) {
        console.log('Rate limited, waiting 1 hour...');
        await sleep(3600000);
      }
    }
  }

  // 3. Generate static data file
  await generateStaticCache();

  console.log('Weekly update complete!');
}
```

## Success Metrics
- **Coverage**: 90%+ helmets with ASINs (250+ helmets)
- **Data Quality**: Images for 80%+ helmets
- **Freshness**: Prices updated weekly
- **Reliability**: Zero API errors exposed to users
- **Performance**: < 100ms to display product data

## Risk Mitigation
1. **Rate Limiting**: Conservative delays, batch processing
2. **API Changes**: Abstract API calls, version checking
3. **Missing Products**: Graceful fallbacks, search links
4. **Cost Control**: Monitor API usage, set alerts

## Expected Outcomes
- **Rich Product Display**: Professional images and real prices
- **Improved Conversion**: Direct purchase links with current pricing
- **Better UX**: Users see availability without clicking away
- **SEO Boost**: Product schema markup with real data
- **Revenue Growth**: Higher affiliate conversion rates

## Next Steps
1. Start Tier 1 ASIN collection immediately
2. Set up local test environment for API calls
3. Create progress tracking dashboard
4. Implement batch processing scripts
5. Test with small subset before full rollout