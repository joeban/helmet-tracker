/**
 * Google Analytics 4 Event Tracking Utilities
 * Provides comprehensive tracking for user interactions and helmet browsing behavior
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: Array<Record<string, any>>;
  }
}

// GA4 Measurement ID from environment variables
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is enabled and available
export const isGAEnabled = (): boolean => {
  return !!(GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag);
};

// Enhanced page view tracking
export const pageview = (url: string, title?: string, additionalData: Record<string, any> = {}) => {
  if (!isGAEnabled()) return;

  try {
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href,
      ...additionalData
    });
  } catch (error) {
    console.warn('Page view tracking error:', error);
  }
};

// Enhanced event tracking
export const event = ({
  action,
  category,
  label,
  value,
  ...additionalParams
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (!isGAEnabled()) return;

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      timestamp: Date.now(),
      page_title: document.title,
      page_location: window.location.href,
      ...additionalParams
    });
  } catch (error) {
    console.warn('Event tracking error:', error);
  }
};

// Enhanced helmet interaction tracking
export const trackHelmetView = (helmet: {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  safety_score: number;
  star_rating: number;
  min_price: number;
}) => {
  event({
    action: 'view_helmet',
    category: 'helmet_interaction',
    label: `${helmet.brand} - ${helmet.name}`,
    helmet_id: helmet.id.toString(),
    helmet_brand: helmet.brand,
    helmet_category: helmet.category,
    safety_score: helmet.safety_score,
    star_rating: helmet.star_rating,
    price_range: helmet.min_price,
    value: 1
  });
};

export const trackHelmetClick = (helmet: {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  safety_score: number;
  link_type: 'amazon_direct' | 'amazon_search' | 'retailer_link';
}) => {
  event({
    action: 'helmet_click',
    category: 'purchase_intent',
    label: `${helmet.brand} - ${helmet.name}`,
    helmet_id: helmet.id.toString(),
    helmet_brand: helmet.brand,
    helmet_category: helmet.category,
    safety_score: helmet.safety_score,
    link_type: helmet.link_type,
    value: 10 // Higher value for purchase intent
  });
};

export const trackAmazonClick = (helmetName: string, brand: string, linkType: 'direct' | 'search' = 'direct') => {
  event({
    action: 'amazon_click',
    category: 'affiliate_link',
    label: `${brand} - ${helmetName}`,
    link_type: linkType,
    affiliate_network: 'amazon',
    value: 5
  });
};

export const trackSearch = (searchTerm: string, resultCount: number, filters: Record<string, any> = {}) => {
  event({
    action: 'search',
    category: 'search_interaction',
    label: searchTerm,
    search_term: searchTerm,
    result_count: resultCount,
    active_filters: Object.keys(filters).filter(key => filters[key]).join(','),
    value: 1
  });
};

export const trackFilterUsage = (filterType: string, filterValue: string, resultCount: number) => {
  event({
    action: 'filter_used',
    category: 'search_interaction',
    label: `${filterType}: ${filterValue}`,
    filter_type: filterType,
    filter_value: filterValue,
    result_count: resultCount,
    value: 1
  });
};

export const trackSortUsage = (sortType: string, resultCount: number) => {
  event({
    action: 'sort_applied',
    category: 'search_interaction',
    label: sortType,
    sort_type: sortType,
    result_count: resultCount,
    value: 1
  });
};

export const trackUserEngagement = (timeOnPage: number, scrollDepth: number) => {
  event({
    action: 'page_engagement',
    category: 'engagement',
    label: `${Math.round(timeOnPage / 1000)}s_${Math.round(scrollDepth * 100)}%`,
    time_on_page: Math.round(timeOnPage / 1000),
    scroll_depth: Math.round(scrollDepth * 100),
    value: Math.min(timeOnPage / 1000, 300) // Cap at 5 minutes
  });
};

export const trackAffiliateClick = (affiliateNetwork: string, helmetId: string, revenue?: number) => {
  event({
    action: 'affiliate_click',
    category: 'monetization',
    label: `${affiliateNetwork}_${helmetId}`,
    affiliate_network: affiliateNetwork,
    helmet_id: helmetId,
    value: revenue || 1
  });
};

export const trackSafetyEducation = (contentType: string, contentId: string) => {
  event({
    action: 'safety_education_engagement',
    category: 'education',
    label: `${contentType}_${contentId}`,
    content_type: contentType,
    content_id: contentId,
    value: 2
  });
};

export const trackConversion = (conversionType: 'helmet_purchase_intent' | 'safety_awareness' | 'repeat_visitor') => {
  event({
    action: 'conversion',
    category: 'conversion',
    label: conversionType,
    conversion_type: conversionType,
    value: 50
  });
};

export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  event({
    action: 'error_encountered',
    category: 'error',
    label: `${errorType}: ${errorMessage}`,
    error_type: errorType,
    error_message: errorMessage,
    context: context || 'unknown',
    value: 0
  });
};

// Enhanced ecommerce tracking for affiliate purchases
export const trackPurchase = (transactionId: string, helmet: {
  id: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  affiliate_network: string;
}) => {
  if (!isGAEnabled()) return;

  try {
    // GA4 Enhanced Ecommerce
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: helmet.price,
      currency: 'USD',
      items: [{
        item_id: helmet.id,
        item_name: `${helmet.brand} ${helmet.name}`,
        item_category: helmet.category,
        item_brand: helmet.brand,
        price: helmet.price,
        quantity: 1,
        affiliate_network: helmet.affiliate_network
      }],
      event_category: 'ecommerce'
    });
  } catch (error) {
    console.warn('Purchase tracking error:', error);
  }
};