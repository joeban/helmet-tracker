/**
 * Google Analytics 4 Event Tracking Utilities
 * Provides comprehensive tracking for user interactions and helmet browsing behavior
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: Array<Record<string, unknown>>;
  }
}

// TypeScript interfaces for conversion tracking
interface ConversionAttribution {
  sessionId: string;
  helmetId: string;
  affiliateNetwork: string;
  clickTimestamp: number;
  conversionValue: number;
}

// GA4 Measurement ID from environment variables
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is enabled and available
export const isGAEnabled = (): boolean => {
  return !!(GA_MEASUREMENT_ID && typeof window !== 'undefined' && window.gtag);
};

// Enhanced page view tracking
export const pageview = (url: string, title?: string, additionalData: Record<string, unknown> = {}) => {
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
  [key: string]: unknown;
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

export const trackSearch = (searchTerm: string, resultCount: number, filters: Record<string, unknown> = {}) => {
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

// Advanced Conversion Tracking System

interface ConversionSession {
  sessionId: string;
  startTime: number;
  events: ConversionEvent[];
  userAgent: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

interface ConversionEvent {
  type: 'page_view' | 'search' | 'filter' | 'helmet_view' | 'affiliate_click' | 'external_visit';
  timestamp: number;
  data: Record<string, unknown>;
  helmetId?: string;
  conversionValue?: number;
}

interface ConversionFunnel {
  sessionId: string;
  stages: {
    homepage_visit?: number;
    helmet_search?: number;
    helmet_view?: number;
    affiliate_click?: number;
    external_visit?: number;
  };
  conversion_path: string[];
  total_value: number;
  time_to_conversion?: number;
}

// Initialize session tracking
export const initializeConversionTracking = (): string => {
  if (typeof window === 'undefined') return '';

  const sessionId = `hs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session: ConversionSession = {
    sessionId,
    startTime: Date.now(),
    events: [],
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    utm: extractUTMParameters()
  };

  // Store session in sessionStorage
  sessionStorage.setItem('helmet_conversion_session', JSON.stringify(session));

  // Track session start
  event({
    action: 'conversion_session_start',
    category: 'conversion_tracking',
    label: sessionId,
    session_id: sessionId,
    referrer: document.referrer,
    utm_source: session.utm?.source,
    utm_medium: session.utm?.medium,
    utm_campaign: session.utm?.campaign,
    value: 1
  });

  return sessionId;
};

// Extract UTM parameters from URL
const extractUTMParameters = () => {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  return {
    source: urlParams.get('utm_source') || undefined,
    medium: urlParams.get('utm_medium') || undefined,
    campaign: urlParams.get('utm_campaign') || undefined,
    term: urlParams.get('utm_term') || undefined,
    content: urlParams.get('utm_content') || undefined
  };
};

// Enhanced affiliate click tracking with conversion attribution
export const trackAdvancedAffiliateClick = (helmetData: {
  id: string;
  name: string;
  brand: string;
  category: string;
  star_rating: number;
  safety_score: number;
  min_price: number;
  amazon_url?: string | null;
}, affiliateNetwork: string, linkType: 'direct' | 'search' = 'direct') => {
  const sessionId = getOrCreateSessionId();
  const conversionValue = calculateConversionValue(helmetData.star_rating, helmetData.min_price);

  // Track the affiliate click event
  event({
    action: 'advanced_affiliate_click',
    category: 'conversion_tracking',
    label: `${affiliateNetwork}_${helmetData.brand}_${helmetData.name}`,
    helmet_id: helmetData.id,
    helmet_name: helmetData.name,
    helmet_brand: helmetData.brand,
    helmet_category: helmetData.category,
    helmet_star_rating: helmetData.star_rating,
    helmet_safety_score: helmetData.safety_score,
    helmet_price: helmetData.min_price,
    affiliate_network: affiliateNetwork,
    link_type: linkType,
    conversion_value: conversionValue,
    session_id: sessionId,
    safety_tier: getSafetyTier(helmetData.star_rating),
    price_tier: getPriceTier(helmetData.min_price),
    value: conversionValue
  });

  // Add to conversion session
  addConversionEvent({
    type: 'affiliate_click',
    timestamp: Date.now(),
    data: {
      helmet: helmetData,
      affiliate_network: affiliateNetwork,
      link_type: linkType
    },
    helmetId: helmetData.id,
    conversionValue
  });

  // Update conversion funnel
  updateConversionFunnel(sessionId, 'affiliate_click', conversionValue);

  // Store attribution data for potential future conversion
  storeAttributionData({
    sessionId,
    helmetId: helmetData.id,
    affiliateNetwork,
    clickTimestamp: Date.now(),
    conversionValue
  });
};

// Enhanced helmet view tracking
export const trackAdvancedHelmetView = (helmet: {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  safety_score: number;
  star_rating: number;
  min_price: number;
}, viewSource: 'search_results' | 'direct_link' | 'category_browse' = 'search_results') => {
  const sessionId = getOrCreateSessionId();
  const helmetId = helmet.id.toString();

  // Enhanced tracking with view source
  event({
    action: 'advanced_helmet_view',
    category: 'conversion_tracking',
    label: `${helmet.brand}_${helmet.name}`,
    helmet_id: helmetId,
    helmet_brand: helmet.brand,
    helmet_category: helmet.category,
    safety_score: helmet.safety_score,
    star_rating: helmet.star_rating,
    price_range: helmet.min_price,
    view_source: viewSource,
    session_id: sessionId,
    safety_tier: getSafetyTier(helmet.star_rating),
    price_tier: getPriceTier(helmet.min_price),
    value: 2
  });

  // Add to conversion session
  addConversionEvent({
    type: 'helmet_view',
    timestamp: Date.now(),
    data: {
      helmet,
      view_source: viewSource
    },
    helmetId,
    conversionValue: 2
  });

  // Update conversion funnel
  updateConversionFunnel(sessionId, 'helmet_view', 2);
};

// Enhanced search tracking with intent analysis
export const trackAdvancedSearch = (searchTerm: string, resultCount: number, filters: Record<string, unknown> = {}) => {
  const sessionId = getOrCreateSessionId();
  const searchIntent = analyzeSearchIntent(searchTerm);

  event({
    action: 'advanced_search',
    category: 'conversion_tracking',
    label: searchTerm,
    search_term: searchTerm,
    result_count: resultCount,
    search_intent: searchIntent.category,
    search_urgency: searchIntent.urgency,
    search_specificity: searchIntent.specificity,
    active_filters: Object.keys(filters).filter(key => filters[key]).join(','),
    session_id: sessionId,
    value: 1
  });

  // Add to conversion session
  addConversionEvent({
    type: 'search',
    timestamp: Date.now(),
    data: {
      search_term: searchTerm,
      result_count: resultCount,
      filters,
      intent: searchIntent
    },
    conversionValue: 1
  });

  // Update conversion funnel
  updateConversionFunnel(sessionId, 'helmet_search', 1);
};

// Analyze search intent for better targeting
const analyzeSearchIntent = (searchTerm: string) => {
  const term = searchTerm.toLowerCase();

  // High-intent buying keywords
  const buyingKeywords = ['buy', 'purchase', 'best', 'review', 'compare', 'price', 'deal', 'sale'];
  const urgencyKeywords = ['urgent', 'need', 'now', 'today', 'asap', 'quick'];
  const safetyKeywords = ['safe', 'safest', 'protection', 'virginia tech', 'star rating', 'crash test'];
  const brandKeywords = ['specialized', 'giro', 'poc', 'bell', 'kask', 'scott'];

  const hasBuyingIntent = buyingKeywords.some(keyword => term.includes(keyword));
  const hasUrgency = urgencyKeywords.some(keyword => term.includes(keyword));
  const hasSafetyFocus = safetyKeywords.some(keyword => term.includes(keyword));
  const hasBrandFocus = brandKeywords.some(keyword => term.includes(keyword));

  let category = 'browsing';
  if (hasBuyingIntent) category = 'buying';
  if (hasSafetyFocus) category = 'safety_research';
  if (hasBrandFocus) category = 'brand_specific';

  return {
    category,
    urgency: hasUrgency ? 'high' : 'low',
    specificity: term.split(' ').length > 2 ? 'specific' : 'general',
    safety_focused: hasSafetyFocus,
    brand_focused: hasBrandFocus
  };
};

// Conversion value calculation based on helmet characteristics
const calculateConversionValue = (starRating: number, price: number): number => {
  // Base value for any conversion
  let value = 10;

  // Safety rating multiplier (5-star helmets are more valuable conversions)
  if (starRating >= 5) value *= 2.0;
  else if (starRating >= 4) value *= 1.5;
  else if (starRating >= 3) value *= 1.2;

  // Price tier bonus (higher value purchases are more valuable)
  if (price >= 200) value += 15;
  else if (price >= 150) value += 10;
  else if (price >= 100) value += 5;

  return Math.round(value);
};

// Get or create session ID
const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  const session = getStoredSession();
  if (!session) {
    return initializeConversionTracking();
  }
  return session.sessionId;
};

// Get stored session from sessionStorage
const getStoredSession = (): ConversionSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('helmet_conversion_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Add event to conversion session
const addConversionEvent = (conversionEvent: ConversionEvent) => {
  const session = getStoredSession();
  if (!session) return;

  session.events.push(conversionEvent);
  sessionStorage.setItem('helmet_conversion_session', JSON.stringify(session));
};

// Update conversion funnel tracking
const updateConversionFunnel = (sessionId: string, stage: string, value: number) => {
  const funnelKey = `conversion_funnel_${sessionId}`;
  let funnel: ConversionFunnel;

  try {
    const stored = localStorage.getItem(funnelKey);
    funnel = stored ? JSON.parse(stored) : {
      sessionId,
      stages: {},
      conversion_path: [],
      total_value: 0
    };
  } catch {
    funnel = {
      sessionId,
      stages: {},
      conversion_path: [],
      total_value: 0
    };
  }

  // Update stage
  funnel.stages[stage as keyof typeof funnel.stages] = Date.now();
  funnel.conversion_path.push(stage);
  funnel.total_value += value;

  // Calculate time to conversion if we have affiliate click
  if (stage === 'affiliate_click' && funnel.stages.homepage_visit) {
    funnel.time_to_conversion = Date.now() - funnel.stages.homepage_visit;
  }

  localStorage.setItem(funnelKey, JSON.stringify(funnel));
};

// Store attribution data for conversion tracking
const storeAttributionData = (attribution: {
  sessionId: string;
  helmetId: string;
  affiliateNetwork: string;
  clickTimestamp: number;
  conversionValue: number;
}) => {
  const attributions = getStoredAttributions();
  attributions.push(attribution);

  // Keep only recent attributions (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentAttributions = attributions.filter(attr => attr.clickTimestamp > thirtyDaysAgo);

  localStorage.setItem('helmet_attributions', JSON.stringify(recentAttributions));
};

// Get stored attribution data
const getStoredAttributions = (): ConversionAttribution[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('helmet_attributions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Utility functions
const getSafetyTier = (starRating: number): string => {
  if (starRating >= 5) return 'excellent';
  if (starRating >= 4) return 'very_good';
  if (starRating >= 3) return 'good';
  return 'fair';
};

const getPriceTier = (price: number): string => {
  if (price < 75) return 'budget';
  if (price < 125) return 'entry';
  if (price < 175) return 'mid_range';
  if (price < 250) return 'performance';
  return 'premium';
};

// Generate conversion analytics report
export const generateConversionReport = () => {
  if (typeof window === 'undefined') return null;

  const session = getStoredSession();
  const attributions = getStoredAttributions();
  const funnelData = getConversionFunnelData();

  return {
    session_summary: {
      session_id: session?.sessionId,
      start_time: session?.startTime,
      total_events: session?.events.length || 0,
      total_value: session?.events.reduce((sum, event) => sum + (event.conversionValue || 0), 0) || 0
    },
    attribution_summary: {
      total_clicks: attributions.length,
      networks: getNetworkPerformance(attributions),
      top_helmets: getTopHelmetClicks(attributions)
    },
    funnel_analysis: funnelData,
    performance_metrics: {
      conversion_rate: calculateConversionRate(funnelData),
      avg_time_to_click: calculateAvgTimeToClick(funnelData),
      most_effective_path: getMostEffectivePath(funnelData)
    }
  };
};

// Helper functions for conversion report
const getConversionFunnelData = () => {
  const funnels: ConversionFunnel[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('conversion_funnel_')) {
      try {
        const funnel = JSON.parse(localStorage.getItem(key)!);
        funnels.push(funnel);
      } catch {
        // Skip invalid funnel data
      }
    }
  }

  return funnels;
};

const getNetworkPerformance = (attributions: ConversionAttribution[]) => {
  const performance = attributions.reduce((acc, attr) => {
    if (!acc[attr.affiliateNetwork]) {
      acc[attr.affiliateNetwork] = { clicks: 0, total_value: 0 };
    }
    acc[attr.affiliateNetwork].clicks += 1;
    acc[attr.affiliateNetwork].total_value += attr.conversionValue;
    return acc;
  }, {} as Record<string, { clicks: number; total_value: number }>);

  return Object.entries(performance).map(([network, data]) => ({
    network,
    clicks: data.clicks,
    total_value: data.total_value,
    avg_value: data.clicks > 0 ? data.total_value / data.clicks : 0
  }));
};

const getTopHelmetClicks = (attributions: ConversionAttribution[]) => {
  const helmetCounts = attributions.reduce((acc, attr) => {
    acc[attr.helmetId] = (acc[attr.helmetId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(helmetCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([helmetId, clicks]) => ({ helmet_id: helmetId, clicks: clicks as number }));
};

const calculateConversionRate = (funnels: ConversionFunnel[]) => {
  if (funnels.length === 0) return 0;

  const totalSessions = funnels.length;
  const conversions = funnels.filter(f => f.stages.affiliate_click).length;

  return conversions / totalSessions;
};

const calculateAvgTimeToClick = (funnels: ConversionFunnel[]) => {
  const conversions = funnels.filter(f => f.time_to_conversion);
  if (conversions.length === 0) return 0;

  const totalTime = conversions.reduce((sum, f) => sum + (f.time_to_conversion || 0), 0);
  return totalTime / conversions.length;
};

const getMostEffectivePath = (funnels: ConversionFunnel[]) => {
  const pathCounts = funnels.reduce((acc, f) => {
    const path = f.conversion_path.join(' -> ');
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPaths = Object.entries(pathCounts).sort(([, a], [, b]) => b - a);
  return sortedPaths.length > 0 ? sortedPaths[0][0] : null;
};