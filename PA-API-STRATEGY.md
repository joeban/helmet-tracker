# Amazon PA-API Integration Strategy

## Current Situation
- **Account Status**: New PA-API account with base limits
- **Rate Limits**: 1 TPS (Transaction Per Second), 8,640 TPD (Transactions Per Day)
- **Growth Formula**: $1 in affiliate sales = 100 additional requests/day
- **Total Helmets**: 281 helmets needing ASIN discovery and data enrichment

## Rate Limit Management

### Understanding the Limits
- **1 TPS**: Must wait at least 1 second between API calls
- **8,640 TPD**: Maximum 360 requests per hour to stay safe
- **Safe Approach**: 10-second delays (ultra-conservative)
- **Processing Time**: ~47 minutes for 281 helmets at 10 seconds each

### Growth Strategy
To increase our API limits:
1. **Generate Initial Sales**: Focus on high-converting helmets
2. **$1 = 100 TPD**: Each dollar in sales adds 100 daily requests
3. **Target**: $10 in sales would double our daily limit to 17,640 TPD

## Data Collection Phases

### Phase 1: ASIN Discovery (Current Priority)
```bash
npm run pa-api:discover
```
- Search for each helmet's ASIN
- 10-second delays between searches
- Save progress incrementally
- Resume from failures

### Phase 2: Product Enrichment
```bash
npm run pa-api:enrich
```
- Fetch detailed data for discovered ASINs
- Get prices, images, availability
- Update local data files

### Phase 3: Periodic Updates
- Daily price/availability checks for top helmets
- Weekly updates for all helmets
- Automated overnight runs

## Implementation Timeline

### Day 1 (After Midnight PST Reset)
1. Test API with single request: `npm run pa-api:test`
2. Start ASIN discovery for top 50 helmets (5-star rated)
3. Monitor for rate limiting

### Days 2-7
- Continue ASIN discovery in batches of 360/day
- Complete all 281 helmets
- Begin enrichment for discovered ASINs

### Week 2+
- Set up automated daily updates
- Focus on generating affiliate sales
- Scale up as limits increase

## Priority Order

### High Priority Helmets
1. **5-Star Safety** (Best converters)
   - Higher price = better commissions
   - Safety-conscious buyers

2. **Popular Brands**
   - Specialized, Trek, Giro, Bell
   - Higher search volume

3. **Best Value Under $150**
   - High volume potential
   - Good conversion rates

## Automation Setup

### Cron Schedule (After Testing)
```bash
# Run at 2 AM PST daily (low traffic time)
0 2 * * * cd /path/to/project && npm run pa-api:enrich

# Weekly full update (Sunday 3 AM)
0 3 * * 0 cd /path/to/project && npm run pa-api:full
```

### Error Handling
- Automatic retry with exponential backoff
- Save progress after each successful request
- Email alerts for failures (future)

## Success Metrics

### Week 1 Goals
- [ ] Discover ASINs for all 281 helmets
- [ ] Enrich data for top 100 helmets
- [ ] Generate first affiliate sale

### Month 1 Goals
- [ ] Complete enrichment for all helmets
- [ ] $10+ in affiliate sales
- [ ] 17,640+ TPD limit achieved
- [ ] Automated daily updates running

## Quick Commands

### Test API Status
```bash
npm run pa-api:test
```

### Start ASIN Discovery
```bash
npm run pa-api:discover
```

### Enrich Product Data
```bash
npm run pa-api:enrich
```

### Full Pipeline
```bash
npm run pa-api:full
```

### Check Progress
```bash
cat data/asin-discovery-progress.json | jq '.stats'
```

## Troubleshooting

### Rate Limited (429 Error)
- Wait until midnight PST
- Check daily quota: 8,640 - requests_made
- Reduce request frequency

### Missing ASINs
- Some helmets may not be on Amazon
- Try alternate search terms
- Mark as "not_found" and skip

### Price Discrepancies
- PA-API shows real-time prices
- Our data shows last update time
- Update frequency based on popularity

## Next Immediate Steps

1. **Tonight at Midnight PST**: Run `npm run pa-api:test`
2. **If Successful**: Start `npm run pa-api:discover`
3. **Monitor Progress**: Check logs every hour
4. **Generate Sales**: Focus marketing on discovered products