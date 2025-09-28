'use client';

import { useState, useEffect } from 'react';
import { Helmet } from '@/types/helmet';
import {
  createPriceAlert,
  analyzeDeal,
  addToWatchlist,
  getPriceTrend,
  getStoredPriceAlerts,
  getStoredWatchlist,
  updatePriceHistory,
  DealAnalysis
} from '@/utils/priceTracking';

interface PriceTrackerProps {
  helmet: Helmet;
}

export default function PriceTracker({ helmet }: PriceTrackerProps) {
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysis | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [hasActiveAlert, setHasActiveAlert] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [targetPrice, setTargetPrice] = useState(helmet.min_price * 0.9); // Default to 10% off
  const [alertType, setAlertType] = useState<'target_price' | 'price_drop' | 'deal_threshold'>('target_price');

  useEffect(() => {
    // Update price history and analyze deal on component mount
    updatePriceHistory(helmet);
    const analysis = analyzeDeal(helmet);
    setDealAnalysis(analysis);

    // Check if helmet is in watchlist
    const watchlist = getStoredWatchlist();
    setIsInWatchlist(watchlist.some(item => item.helmetId === helmet.id));

    // Check if there's an active alert
    const alerts = getStoredPriceAlerts();
    setHasActiveAlert(alerts.some(alert =>
      alert.helmetId === helmet.id && alert.isActive && !alert.triggeredAt
    ));
  }, [helmet]);

  const handleCreateAlert = () => {
    createPriceAlert({
      helmetId: helmet.id,
      helmetName: helmet.name,
      helmetBrand: helmet.brand,
      targetPrice: targetPrice,
      currentPrice: helmet.min_price,
      alertType: alertType,
      notificationMethod: 'browser'
    });

    setHasActiveAlert(true);
    setShowAlertForm(false);

    // Show success message
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleAddToWatchlist = () => {
    addToWatchlist(helmet, 'medium');
    setIsInWatchlist(true);
  };

  const getDealBadge = () => {
    if (!dealAnalysis) return null;

    const { recommendation, dealScore, confidence } = dealAnalysis;

    let badgeColor = 'bg-gray-100 text-gray-800';
    let badgeText = 'Fair Price';
    let emoji = '💰';

    switch (recommendation) {
      case 'excellent_deal':
        badgeColor = 'bg-green-100 text-green-800 border border-green-200';
        badgeText = 'Excellent Deal';
        emoji = '🔥';
        break;
      case 'good_deal':
        badgeColor = 'bg-blue-100 text-blue-800 border border-blue-200';
        badgeText = 'Good Deal';
        emoji = '✨';
        break;
      case 'wait':
        badgeColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        badgeText = 'Consider Waiting';
        emoji = '⏳';
        break;
      case 'overpriced':
        badgeColor = 'bg-red-100 text-red-800 border border-red-200';
        badgeText = 'Overpriced';
        emoji = '🚫';
        break;
    }

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
        <span className="mr-1">{emoji}</span>
        {badgeText}
        <span className="ml-2 text-xs opacity-75">
          {dealScore}/100 ({confidence}% confidence)
        </span>
      </div>
    );
  };

  const getPriceTrendIndicator = () => {
    const trend = getPriceTrend(helmet.id, 30);

    if (trend.dataPoints < 2) {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-1">📊</span>
          Insufficient data
        </div>
      );
    }

    const isSignificant = Math.abs(trend.changePercentage) > 3;
    let color = 'text-gray-500';
    let arrow = '➡️';

    if (isSignificant) {
      if (trend.trend === 'falling') {
        color = 'text-green-600';
        arrow = '📉';
      } else if (trend.trend === 'rising') {
        color = 'text-red-600';
        arrow = '📈';
      }
    }

    return (
      <div className={`flex items-center text-sm ${color}`}>
        <span className="mr-1">{arrow}</span>
        {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}% (30 days)
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Price Tracking</h3>
        {getDealBadge()}
      </div>

      {/* Current Price Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${helmet.min_price}</div>
          <div className="text-sm text-gray-500">Current Best Price</div>
        </div>

        {dealAnalysis && (
          <>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">${dealAnalysis.historicalLow}</div>
              <div className="text-sm text-gray-500">All-time Low</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">${dealAnalysis.averagePrice.toFixed(0)}</div>
              <div className="text-sm text-gray-500">Average Price</div>
            </div>
          </>
        )}
      </div>

      {/* Price Trend */}
      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-700">30-Day Trend:</span>
        {getPriceTrendIndicator()}
      </div>

      {/* Deal Analysis Details */}
      {dealAnalysis && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Deal Analysis</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Deal Score:</span>
              <span className="ml-1 font-medium">{dealAnalysis.dealScore}/100</span>
            </div>
            <div>
              <span className="text-gray-600">vs Historical High:</span>
              <span className="ml-1 font-medium text-green-600">
                -{dealAnalysis.priceDropPercentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">Price Range:</span>
              <span className="ml-1 font-medium">
                ${dealAnalysis.historicalLow} - ${dealAnalysis.historicalHigh}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Confidence:</span>
              <span className="ml-1 font-medium">{dealAnalysis.confidence}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {!isInWatchlist && (
          <button
            onClick={handleAddToWatchlist}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <span className="mr-1">👁️</span>
            Add to Watchlist
          </button>
        )}

        {isInWatchlist && (
          <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            <span className="mr-1">✅</span>
            In Watchlist
          </div>
        )}

        {!hasActiveAlert && (
          <button
            onClick={() => setShowAlertForm(true)}
            className="flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
          >
            <span className="mr-1">🔔</span>
            Set Price Alert
          </button>
        )}

        {hasActiveAlert && (
          <div className="flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
            <span className="mr-1">🔔</span>
            Alert Active
          </div>
        )}
      </div>

      {/* Price Alert Form */}
      {showAlertForm && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Create Price Alert</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as 'target_price' | 'price_drop' | 'deal_threshold')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="target_price">Target Price</option>
                <option value="price_drop">Any Price Drop</option>
                <option value="deal_threshold">Great Deal Alert</option>
              </select>
            </div>

            {alertType === 'target_price' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter target price"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Current price: ${helmet.min_price}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCreateAlert}
                disabled={alertType === 'target_price' && targetPrice >= helmet.min_price}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                Create Alert
              </button>
              <button
                onClick={() => setShowAlertForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
        <div>📊 Based on {helmet.available_count} of {helmet.listing_count} available listings</div>
        <div>🔄 Prices updated regularly from Amazon and other retailers</div>
      </div>
    </div>
  );
}

// Compact version for use in helmet cards
interface CompactPriceTrackerProps {
  helmet: Helmet;
}

export function CompactPriceTracker({ helmet }: CompactPriceTrackerProps) {
  const [dealAnalysis, setDealAnalysis] = useState<DealAnalysis | null>(null);

  useEffect(() => {
    const analysis = analyzeDeal(helmet);
    setDealAnalysis(analysis);
  }, [helmet]);

  if (!dealAnalysis) return null;

  const getDealIndicator = () => {
    const { recommendation } = dealAnalysis;

    if (recommendation === 'excellent_deal') {
      return (
        <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          🔥 Deal
        </div>
      );
    } else if (recommendation === 'good_deal') {
      return (
        <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          ✨ Good
        </div>
      );
    } else if (recommendation === 'overpriced') {
      return (
        <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          🚫 High
        </div>
      );
    }

    return null;
  };

  const trend = getPriceTrend(helmet.id, 7); // 7-day trend for compact view
  const showTrend = trend.dataPoints >= 2 && Math.abs(trend.changePercentage) > 3;

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        {getDealIndicator()}
        {showTrend && (
          <div className={`flex items-center ${
            trend.trend === 'falling' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.trend === 'falling' ? '📉' : '📈'}
            <span className="ml-1">
              {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-gray-500">
        Deal Score: {dealAnalysis.dealScore}/100
      </div>
    </div>
  );
}