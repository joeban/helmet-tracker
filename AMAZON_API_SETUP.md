# Amazon Product Advertising API Integration Guide

## Current Status

✅ **Working**: 11 direct Amazon affiliate product links
✅ **Working**: Amazon Associates compliance framework
✅ **Working**: Enhanced fallback image design
⚠️ **Pending**: Amazon Product Advertising API for images

## Why We Need Amazon PA-API

To display actual Amazon product images, we need official API access because:

1. **Amazon Image URLs Change**: CDN URLs expire/change frequently
2. **Compliance Requirements**: Must use approved methods per Associates Operating Agreement
3. **Scalability**: Manual image collection isn't feasible for 281+ helmets

## Amazon PA-API Setup Process

### 1. Prerequisites
- Active Amazon Associates account ✅ (we have affiliate tag: `test-affiliate-20`)
- Approved Associates application
- AWS account (required for PA-API)

### 2. Application Steps

1. **Apply for PA-API Access**
   - Visit: https://webservices.amazon.com/paapi5/documentation/
   - Complete application form
   - Explain use case: "Helmet safety comparison site with affiliate links"
   - Wait for approval (can take days to weeks)

2. **Get API Credentials**
   - Access Key ID
   - Secret Access Key
   - Associate Tag (we already have: `test-affiliate-20`)

3. **Environment Setup**
   ```bash
   # Add to .env.local
   AMAZON_ACCESS_KEY_ID=your_access_key
   AMAZON_SECRET_ACCESS_KEY=your_secret_key
   AMAZON_ASSOCIATE_TAG=test-affiliate-20  # Already configured
   AMAZON_REGION=us-east-1
   ```

### 3. Implementation Plan

#### Phase 1: API Integration
```typescript
// utils/amazonAPI.ts
import { AdvertisingApi } from 'amazon-pa-api';

export async function getProductImages(asin: string): Promise<string[]> {
  const api = new AdvertisingApi({
    accessKey: process.env.AMAZON_ACCESS_KEY_ID,
    secretKey: process.env.AMAZON_SECRET_ACCESS_KEY,
    region: 'us-east-1',
    partnerTag: process.env.AMAZON_ASSOCIATE_TAG
  });

  const response = await api.getItems({
    ItemIds: [asin],
    Resources: ['Images.Primary.Large', 'Images.Primary.Medium']
  });

  return response.items[0]?.images?.primary?.large?.url || null;
}
```

#### Phase 2: Batch Image Update
```typescript
// scripts/updateHelmetImages.ts
export async function updateHelmetImages() {
  const helmetsWithASINs = helmets.filter(h => h.amazon_url);

  for (const helmet of helmetsWithASINs) {
    const asin = extractASINFromUrl(helmet.amazon_url);
    if (asin) {
      const imageUrl = await getProductImages(asin);
      // Update helmet.image_url in database
    }
  }
}
```

#### Phase 3: Automated Updates
- Daily/weekly cron job to refresh image URLs
- Cache images for 24+ hours (per Amazon terms)
- Fallback to current design if API fails

## Current Workaround

Until API access is approved, we're using:

1. **Enhanced Fallback Design**
   - Professional card layout with gradient background
   - Shield emoji icon in circular badge
   - Clear brand/model/category information
   - Orange "Amazon" badge for helmets with direct links
   - Hover effects and proper accessibility

2. **Functional Amazon Links**
   - 11 direct product links working
   - Search fallbacks for remaining helmets
   - Full affiliate compliance maintained

## Testing Current Implementation

Test these helmets with direct Amazon links:
- Giro Syntax MIPS → https://amazon.com/dp/B0CKRYSQ88
- Smith Signal MIPS → https://amazon.com/dp/B08WBMM4MG
- Bell Z20 MIPS → https://amazon.com/dp/B07JC3Q6PG
- And 8 others...

## Benefits of API Integration

1. **Real Product Images**: Show actual helmet photos
2. **Always Current**: URLs never expire
3. **Full Compliance**: Official Amazon-approved method
4. **Better UX**: Visual product recognition
5. **Higher Conversion**: Images increase affiliate click-through rates

## Timeline

- **Immediate**: Enhanced fallback design (✅ Complete)
- **Week 1-2**: Apply for Amazon PA-API access
- **Week 3-4**: Implement API integration (upon approval)
- **Week 5**: Deploy with real Amazon product images

## Fallback Strategy

If PA-API application is denied:
1. Manual SiteStripe collection for top 25 helmets
2. Keep enhanced fallback design for remaining helmets
3. Consider alternative product image sources
4. Focus on safety data and affiliate functionality

---

**Next Steps**: Apply for Amazon Product Advertising API access to unlock real product images while maintaining current affiliate functionality.