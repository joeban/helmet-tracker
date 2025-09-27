# Amazon Affiliate Compliance Guide

This document outlines the legal requirements and best practices for using Amazon product images and affiliate links in this helmet tracker application.

## Legal Requirements

### 1. Amazon Associates Program Membership
- ✅ Must be enrolled in Amazon Associates program
- ✅ Must comply with Amazon Operating Agreement
- ✅ Must display proper affiliate disclosures

### 2. Image Usage Compliance
- ✅ **ONLY use images obtained through approved methods:**
  - Amazon Product Advertising API (PA-API)
  - SiteStripe tool
  - Direct download from Amazon Associates dashboard
- ❌ **NEVER directly save/rehost Amazon images**
- ❌ **NEVER modify Amazon product images**
- ❌ **NEVER use images without proper attribution**

### 3. Mandatory Linking Requirements
- ✅ **ALL product images MUST link to Amazon product pages**
- ✅ **Use proper affiliate tags in all links**
- ✅ **Links must go directly to the relevant product**

### 4. Content Restrictions
- ✅ Use images solely for promoting Amazon products
- ❌ No implied endorsement by Amazon
- ❌ No "Amazon's Choice" or similar claims without basis
- ❌ No misleading product representations

## Implementation in This App

### Safe Image Handling
```typescript
// ✅ COMPLIANT: Validate Amazon CDN URLs
function isValidAmazonImageUrl(url: string): boolean {
  const validDomains = [
    'images-na.ssl-images-amazon.com',
    'm.media-amazon.com',
    'images.amazon.com'
  ];
  return validDomains.some(domain => url.includes(domain));
}

// ✅ COMPLIANT: Images automatically link to Amazon
<HelmetImage
  imageUrl={helmet.image_url}
  amazonUrl={helmet.amazon_url} // Required for compliance
/>
```

### Affiliate Link Generation
```typescript
// ✅ COMPLIANT: Proper affiliate tag usage
const amazonUrl = `https://www.amazon.com/dp/${asin}?tag=${affiliateTag}`;

// ✅ COMPLIANT: Search links when direct ASIN unavailable
const searchUrl = generateAmazonSearchUrl(brand, name, affiliateTag);
```

### Fallback Handling
```typescript
// ✅ COMPLIANT: Custom fallback when Amazon images unavailable
const fallbackImage = getHelmetFallbackImage(brand, category);
```

## Required Disclosures

### Website Footer/About Page Must Include:
> "As an Amazon Associate, we earn from qualifying purchases. Some links on this site are affiliate links, which means we may receive a commission if you click on the link and purchase an item."

### Per Amazon Requirements:
- Must be clearly visible to users
- Should be placed before affiliate links when practical
- Must be honest and not misleading

## Monitoring & Compliance

### Regular Checks Required:
- [ ] Verify all images use Amazon CDN URLs only
- [ ] Ensure all product images link to Amazon
- [ ] Confirm affiliate tags are working correctly
- [ ] Review for any unauthorized image modifications
- [ ] Validate search functionality creates proper affiliate links

### API Usage Guidelines:
- Respect rate limits (max 1 request per second for PA-API)
- Cache responses appropriately (24-hour minimum)
- Handle errors gracefully with fallbacks
- Monitor for policy changes

## Legal Disclaimer

This application follows Amazon Associates Program Operating Agreement as of 2025.
Users are responsible for:
- Maintaining current Amazon Associates membership
- Following all program terms and conditions
- Updating implementation for any policy changes
- Proper disclosure of affiliate relationships

**Note:** Amazon policies can change. Always verify current requirements at:
https://affiliate-program.amazon.com/help/operating/policies