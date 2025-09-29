# Claude Code Assistant Instructions

## Project Overview
Helmet Tracker - A Next.js application that tracks bicycle helmet safety ratings and Amazon prices/availability using the Amazon Product Advertising API.

## Current Status (Sept 29, 2025)

### ✅ Completed Today
1. **Removed 60KB+ of over-engineered scraping code**
   - Eliminated complex scraping systems that weren't being used
   - Simplified architecture significantly

2. **Integrated Amazon Product Advertising API (PA-API 5.0)**
   - Implemented AWS Signature Version 4 authentication
   - Created utilities for searching products and fetching details
   - Built rate-limit aware scripts for systematic data collection

3. **Refined UX with Quick Picks**
   - Reduced from 6 sections to 2 focused options
   - "Top Safety Picks" - 5-star helmets with lowest injury scores
   - "Best Value Under $150" - 4+ star helmets under $150
   - Expandable cards showing top 5 by default, expandable to 10

4. **Created Comprehensive PA-API Strategy**
   - Discovery script to find ASINs for all 281 helmets
   - Enrichment script to fetch prices/images/availability
   - Monitor script to track API usage and provide recommendations
   - Ultra-conservative approach: 10-second delays between requests
   - Created PA-API-STRATEGY.md with complete roadmap

5. **Fixed Runtime Errors**
   - Resolved "h is not defined" error in QuickPicks component
   - Fixed Turbopack issues by removing from build configuration
   - Site now running successfully on localhost:3000

### 🚧 Current Status
- **API Status**: Still rate limited, waiting for midnight PST reset (18 hours from 9:24 AM)
- **Monitor Shows**: 8,640 requests available but API still returns 429 errors
- **Theory**: Account may need 24-hour cooldown period after initial setup
- **Next Test**: Run `npm run pa-api:slow-test` after midnight PST

## Technical Architecture

### Frontend (Public)
- Next.js 15.5.4 with TypeScript
- Static helmet data served from `/src/data/helmets.ts`
- No direct API calls from public site (avoids rate limiting)
- Vercel deployment with analytics

### Backend (Local Only)
- PA-API integration runs locally via npm scripts
- Saves data to JSON files that get committed
- Progressive enhancement as data is collected

### Data Flow
1. Local scripts fetch data from Amazon PA-API
2. Data saved to JSON files in `/data/` directory
3. Build process incorporates latest data
4. Site serves static data (no runtime API calls)

## Amazon PA-API Details

### Rate Limits (Corrected Understanding)
- **New Account**: 1 TPS (Transaction Per Second), 8,640 TPD (Transactions Per Day)
- **Growth Formula**: $1 in affiliate sales = 100 extra requests/day (not $0.01 = 1 TPD)
- **Example**: $10 in sales = 1,000 extra requests = 9,640 TPD total
- **Target**: Generate initial sales to increase capacity

### API Commands
```bash
# Check current status and recommendations
npm run pa-api:monitor

# Ultra-conservative test (single request)
npm run pa-api:slow-test

# Test API with single request
npm run pa-api:test

# Discover ASINs for all helmets (runs in batches)
npm run pa-api:discover

# Enrich discovered ASINs with price/image data
npm run pa-api:enrich

# Full pipeline (discovery + enrichment)
npm run pa-api:full
```

### Environment Variables (in .env.local and Vercel)
```
AMAZON_ACCESS_KEY=AKPADT19SB1759118322
AMAZON_SECRET_KEY=[redacted]
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=helmetscore-20
```

## Key Files

### Core Components
- `/src/components/QuickPicks.tsx` - Homepage quick picks (2 sections)
- `/src/components/AmazonButton.tsx` - Affiliate link button
- `/src/components/HelmetImage.tsx` - Image display with fallbacks

### PA-API Scripts
- `/scripts/discover-asins.js` - Find ASINs for all helmets (with resume capability)
- `/scripts/enrich-helmet-data.js` - Fetch detailed product data
- `/scripts/monitor-api-limits.js` - Track usage and provide guidance
- `/scripts/pa-api-slow-test.js` - Ultra-conservative API test (1 request)
- `/scripts/test-single-helmet.js` - Basic API test

### Data Files
- `/src/data/helmets.ts` - Main helmet database (281 helmets)
- `/data/helmet-asin-map.json` - ASIN mapping (to be populated)
- `/data/asin-discovery-progress.json` - Track discovery progress
- `/data/api-usage-log.json` - API call history
- `/data/enrichment-progress.json` - Track enrichment progress

### Strategy Documentation
- `/PA-API-STRATEGY.md` - Complete PA-API usage strategy and roadmap

## Development Workflow

1. **Check API Status**
   ```bash
   npm run pa-api:monitor
   ```
   Shows current quota, progress, and recommendations.

2. **After Midnight PST (When Rate Limit Resets)**
   ```bash
   npm run pa-api:slow-test  # Ultra-safe single request test
   npm run pa-api:discover   # Start ASIN discovery if test passes
   ```

3. **Monitor Progress**
   ```bash
   # Check discovery progress
   cat data/asin-discovery-progress.json | jq '.stats'

   # View discovered ASINs
   cat data/helmet-asin-map.json | jq 'keys | length'

   # Check API usage
   npm run pa-api:monitor
   ```

4. **Deploy Updates**
   - Commit updated data files
   - Push to main branch
   - Vercel auto-deploys

## Important Notes

1. **NEVER run API calls from the public site** - Rate limits are too strict (1 TPS)
2. **Always use 10-second delays** between API calls for ultra-safety
3. **Process helmets in priority order**:
   - 5-star safety helmets first (best converters)
   - Popular brands (Specialized, Trek, Giro, Bell)
   - Best value helmets (high volume potential)
4. **Save progress frequently** - Scripts are resumable from failures
5. **Monitor shows available quota but API may still be limited** - Wait for full reset

## Discovery Script Priority Order

The `discover-asins.js` script processes helmets in this priority:
1. **5-star safety rating** helmets (highest priority)
2. **Premium brands** (SPECIALIZED, TREK, BONTRAGER, GIRO, BELL, POC, SMITH)
3. **Higher price** helmets (better commission potential)

This ensures we collect ASINs for the most valuable helmets first.

## Next Immediate Actions

1. **Tonight at Midnight PST** (~18 hours):
   - Run `npm run pa-api:slow-test` to verify API is working
   - If successful, start `npm run pa-api:discover`
   - Monitor progress every hour

2. **If Still Rate Limited**:
   - Wait another 24 hours (accounts may need cooldown)
   - Consider generating initial affiliate sale to prove account activity

3. **Once API Works**:
   - Process helmets in batches of 360/hour (safe rate)
   - Expect ~1-2 days to discover all ASINs
   - Then begin enrichment phase

## Success Metrics

### Week 1 Goals
- [ ] API starts working after midnight PST
- [ ] Discover ASINs for all 281 helmets
- [ ] Enrich data for top 100 helmets
- [ ] Generate first affiliate sale

### Month 1 Goals
- [ ] Complete enrichment for all helmets
- [ ] $10+ in affiliate sales (1000+ extra API requests)
- [ ] 17,640+ TPD limit achieved
- [ ] Automated daily updates running

### Long-term Vision
- Real-time price tracking for all helmets
- Deal alerts for price drops
- Multiple retailer price comparison
- Expanded to other safety equipment

## Current Work Summary

The site has been successfully transformed from an over-engineered system to a clean, efficient Next.js application with:
- Professional UX with Quick Picks feature
- Amazon PA-API integration ready to go
- Rate limiting strategy in place
- Monitoring and automation tools built

We're currently waiting for the API rate limit to reset at midnight PST to begin systematic ASIN discovery for all 281 helmets.