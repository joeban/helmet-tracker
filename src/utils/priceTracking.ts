/**
 * Price Tracking and Deal Alerts System
 * Monitors helmet prices, tracks price history, and provides deal notifications
 */

import { Helmet } from '@/types/helmet';
import { event } from '@/utils/analytics';

// TypeScript interfaces for price tracking
export interface PriceAlert {
  id: string;
  helmetId: number;
  helmetName: string;
  helmetBrand: string;
  userId?: string; // For future user authentication
  targetPrice: number;
  currentPrice: number;
  alertType: 'price_drop' | 'target_price' | 'deal_threshold';
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
  notificationMethod: 'browser' | 'email' | 'both';
  threshold?: number; // Percentage or dollar amount for deal alerts
}

export interface PriceHistory {
  helmetId: number;
  timestamp: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  listingCount: number;
  availableCount: number;
  priceChange?: number;
  changePercentage?: number;
  source: 'manual' | 'api' | 'scrape';
}

export interface DealAnalysis {
  helmetId: number;
  currentPrice: number;
  historicalLow: number;
  historicalHigh: number;
  averagePrice: number;
  dealScore: number; // 0-100, higher is better deal
  priceDropPercentage: number;
  daysAtCurrentPrice: number;
  volatility: number; // Price stability metric
  recommendation: 'excellent_deal' | 'good_deal' | 'fair_price' | 'wait' | 'overpriced';
  confidence: number; // Confidence in recommendation (0-100)
}

export interface WatchlistItem {
  id: string;
  helmetId: number;
  addedAt: number;
  lastChecked: number;
  priceAlert?: PriceAlert;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

// Create price alert
export const createPriceAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive'>): PriceAlert => {
  const priceAlert: PriceAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    isActive: true
  };

  // Store alert
  const alerts = getStoredPriceAlerts();
  alerts.push(priceAlert);
  localStorage.setItem('helmet_price_alerts', JSON.stringify(alerts));

  // Track alert creation
  event({
    action: 'price_alert_created',
    category: 'price_tracking',
    label: `${alert.helmetBrand}_${alert.helmetName}`,
    helmet_id: alert.helmetId.toString(),
    target_price: alert.targetPrice,
    current_price: alert.currentPrice,
    alert_type: alert.alertType,
    value: 1
  });

  return priceAlert;
};

// Update price history
export const updatePriceHistory = (helmet: Helmet, source: 'manual' | 'api' | 'scrape' = 'manual'): PriceHistory => {
  const history = getStoredPriceHistory();
  const existingEntry = history.find(h => h.helmetId === helmet.id);

  let priceChange = 0;
  let changePercentage = 0;

  if (existingEntry) {
    priceChange = helmet.min_price - existingEntry.minPrice;
    changePercentage = existingEntry.minPrice > 0 ? (priceChange / existingEntry.minPrice) * 100 : 0;
  }

  const newEntry: PriceHistory = {
    helmetId: helmet.id,
    timestamp: Date.now(),
    minPrice: helmet.min_price,
    maxPrice: helmet.max_price,
    avgPrice: helmet.avg_price,
    listingCount: helmet.listing_count,
    availableCount: helmet.available_count,
    priceChange,
    changePercentage,
    source
  };

  // Add to history
  history.push(newEntry);

  // Keep only last 100 entries per helmet to manage storage
  const helmetHistory = history
    .filter(h => h.helmetId === helmet.id)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  const otherHistory = history.filter(h => h.helmetId !== helmet.id);
  const updatedHistory = [...otherHistory, ...helmetHistory];

  localStorage.setItem('helmet_price_history', JSON.stringify(updatedHistory));

  // Track price update
  if (Math.abs(changePercentage) > 5) { // Only track significant changes
    event({
      action: 'significant_price_change',
      category: 'price_tracking',
      label: `${helmet.brand}_${helmet.name}`,
      helmet_id: helmet.id.toString(),
      price_change: priceChange,
      change_percentage: changePercentage,
      new_price: helmet.min_price,
      value: Math.abs(changePercentage)
    });
  }

  return newEntry;
};

// Check for triggered price alerts
export const checkPriceAlerts = (helmet: Helmet): PriceAlert[] => {
  const alerts = getStoredPriceAlerts();
  const triggeredAlerts: PriceAlert[] = [];

  const helmetAlerts = alerts.filter(alert =>
    alert.helmetId === helmet.id && alert.isActive
  );

  for (const alert of helmetAlerts) {
    let shouldTrigger = false;

    switch (alert.alertType) {
      case 'target_price':
        shouldTrigger = helmet.min_price <= alert.targetPrice;
        break;
      case 'price_drop':
        shouldTrigger = helmet.min_price < alert.currentPrice;
        break;
      case 'deal_threshold':
        const dealAnalysis = analyzeDeal(helmet);
        shouldTrigger = dealAnalysis.dealScore >= (alert.threshold || 80);
        break;
    }

    if (shouldTrigger && !alert.triggeredAt) {
      alert.triggeredAt = Date.now();
      triggeredAlerts.push(alert);

      // Send notification
      sendPriceNotification(alert, helmet);

      // Track alert trigger
      event({
        action: 'price_alert_triggered',
        category: 'price_tracking',
        label: `${helmet.brand}_${helmet.name}`,
        helmet_id: helmet.id.toString(),
        alert_type: alert.alertType,
        target_price: alert.targetPrice,
        triggered_price: helmet.min_price,
        value: 10
      });
    }
  }

  // Update stored alerts
  localStorage.setItem('helmet_price_alerts', JSON.stringify(alerts));

  return triggeredAlerts;
};

// Analyze if current price is a good deal
export const analyzeDeal = (helmet: Helmet): DealAnalysis => {
  const history = getStoredPriceHistory().filter(h => h.helmetId === helmet.id);

  if (history.length === 0) {
    // No history available, use basic heuristics
    return {
      helmetId: helmet.id,
      currentPrice: helmet.min_price,
      historicalLow: helmet.min_price,
      historicalHigh: helmet.max_price,
      averagePrice: helmet.avg_price,
      dealScore: 50, // Neutral score
      priceDropPercentage: 0,
      daysAtCurrentPrice: 0,
      volatility: 0,
      recommendation: 'fair_price',
      confidence: 30
    };
  }

  const prices = history.map(h => h.minPrice);
  const historicalLow = Math.min(...prices);
  const historicalHigh = Math.max(...prices);
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  // Calculate price volatility (standard deviation)
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);

  // Calculate deal score (0-100)
  const priceRange = historicalHigh - historicalLow;
  const positionInRange = priceRange > 0 ? (historicalHigh - helmet.min_price) / priceRange : 0.5;
  const dealScore = Math.round(positionInRange * 100);

  // Calculate price drop percentage from recent high
  const recentHigh = Math.max(...history.slice(-10).map(h => h.minPrice));
  const priceDropPercentage = recentHigh > 0 ? ((recentHigh - helmet.min_price) / recentHigh) * 100 : 0;

  // Days at current price
  const currentPriceEntries = history.filter(h => Math.abs(h.minPrice - helmet.min_price) < 1);
  const daysAtCurrentPrice = currentPriceEntries.length;

  // Determine recommendation
  let recommendation: DealAnalysis['recommendation'] = 'fair_price';
  let confidence = 50;

  if (dealScore >= 90) {
    recommendation = 'excellent_deal';
    confidence = 90;
  } else if (dealScore >= 75) {
    recommendation = 'good_deal';
    confidence = 80;
  } else if (dealScore >= 50) {
    recommendation = 'fair_price';
    confidence = 70;
  } else if (dealScore >= 25) {
    recommendation = 'wait';
    confidence = 75;
  } else {
    recommendation = 'overpriced';
    confidence = 85;
  }

  // Adjust confidence based on data quality
  const dataPoints = history.length;
  const dataQualityFactor = Math.min(dataPoints / 30, 1); // More data = higher confidence
  confidence = Math.round(confidence * dataQualityFactor);

  return {
    helmetId: helmet.id,
    currentPrice: helmet.min_price,
    historicalLow,
    historicalHigh,
    averagePrice,
    dealScore,
    priceDropPercentage,
    daysAtCurrentPrice,
    volatility,
    recommendation,
    confidence
  };
};

// Add helmet to watchlist
export const addToWatchlist = (helmet: Helmet, priority: 'low' | 'medium' | 'high' = 'medium'): WatchlistItem => {
  const watchlist = getStoredWatchlist();

  // Check if already in watchlist
  const existing = watchlist.find(item => item.helmetId === helmet.id);
  if (existing) {
    return existing;
  }

  const watchlistItem: WatchlistItem = {
    id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    helmetId: helmet.id,
    addedAt: Date.now(),
    lastChecked: Date.now(),
    priority
  };

  watchlist.push(watchlistItem);
  localStorage.setItem('helmet_watchlist', JSON.stringify(watchlist));

  // Track watchlist addition
  event({
    action: 'helmet_added_to_watchlist',
    category: 'price_tracking',
    label: `${helmet.brand}_${helmet.name}`,
    helmet_id: helmet.id.toString(),
    priority,
    value: 2
  });

  return watchlistItem;
};

// Get price trend analysis
export const getPriceTrend = (helmetId: number, days: number = 30): {
  trend: 'rising' | 'falling' | 'stable';
  change: number;
  changePercentage: number;
  dataPoints: number;
} => {
  const history = getStoredPriceHistory()
    .filter(h => h.helmetId === helmetId)
    .filter(h => h.timestamp > Date.now() - (days * 24 * 60 * 60 * 1000))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (history.length < 2) {
    return { trend: 'stable', change: 0, changePercentage: 0, dataPoints: history.length };
  }

  const firstPrice = history[0].minPrice;
  const lastPrice = history[history.length - 1].minPrice;
  const change = lastPrice - firstPrice;
  const changePercentage = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (Math.abs(changePercentage) > 5) {
    trend = changePercentage > 0 ? 'rising' : 'falling';
  }

  return {
    trend,
    change,
    changePercentage,
    dataPoints: history.length
  };
};

// Send price notification
const sendPriceNotification = (alert: PriceAlert, helmet: Helmet) => {
  if (alert.notificationMethod === 'browser' || alert.notificationMethod === 'both') {
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Price Alert: ${helmet.name}`, {
        body: `${helmet.brand} ${helmet.name} is now $${helmet.min_price} (target: $${alert.targetPrice})`,
        icon: helmet.image_url || '/helmet-icon.png',
        tag: `price-alert-${alert.id}`,
        data: { helmetId: helmet.id, alertId: alert.id }
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendPriceNotification(alert, helmet);
        }
      });
    }
  }

  // Future: Email notifications would be implemented here
  if (alert.notificationMethod === 'email' || alert.notificationMethod === 'both') {
    // TODO: Implement email notifications via API
    console.log('Email notification would be sent here');
  }
};

// Utility functions for data persistence
const getStoredPriceAlerts = (): PriceAlert[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('helmet_price_alerts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getStoredPriceHistory = (): PriceHistory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('helmet_price_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getStoredWatchlist = (): WatchlistItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('helmet_watchlist');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Export utility functions
export {
  getStoredPriceAlerts,
  getStoredPriceHistory,
  getStoredWatchlist
};

// Batch price checking for efficiency
export const batchCheckPriceAlerts = (helmets: Helmet[]): PriceAlert[] => {
  const allTriggeredAlerts: PriceAlert[] = [];

  for (const helmet of helmets) {
    updatePriceHistory(helmet);
    const triggeredAlerts = checkPriceAlerts(helmet);
    allTriggeredAlerts.push(...triggeredAlerts);
  }

  return allTriggeredAlerts;
};

// Generate price report for analytics
export const generatePriceReport = () => {
  const alerts = getStoredPriceAlerts();
  const history = getStoredPriceHistory();
  const watchlist = getStoredWatchlist();

  const activeAlerts = alerts.filter(a => a.isActive);
  const triggeredAlerts = alerts.filter(a => a.triggeredAt);
  const recentPriceChanges = history.filter(h =>
    h.timestamp > Date.now() - (24 * 60 * 60 * 1000) &&
    Math.abs(h.changePercentage || 0) > 5
  );

  return {
    summary: {
      total_alerts: alerts.length,
      active_alerts: activeAlerts.length,
      triggered_alerts: triggeredAlerts.length,
      watchlist_items: watchlist.length,
      recent_price_changes: recentPriceChanges.length
    },
    alerts: {
      by_type: {
        target_price: activeAlerts.filter(a => a.alertType === 'target_price').length,
        price_drop: activeAlerts.filter(a => a.alertType === 'price_drop').length,
        deal_threshold: activeAlerts.filter(a => a.alertType === 'deal_threshold').length
      }
    },
    recent_activity: recentPriceChanges.slice(0, 10),
    top_watched_helmets: watchlist
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, 10)
      .map(w => w.helmetId)
  };
};