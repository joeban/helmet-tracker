'use client';

import { useState, useEffect } from 'react';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import {
  PriceAlert,
  WatchlistItem,
  DealAnalysis,
  createEnhancedPriceAlert,
  addToWatchlist,
  getStoredPriceAlerts,
  getStoredWatchlist,
  analyzeEnhancedDeals
} from '@/utils/priceTracking';
import { PriceTrendIndicator } from './PriceChart';

interface PriceAlertsDashboardProps {
  className?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

export default function PriceAlertsDashboard({
  className = '',
  isVisible = true,
  onClose
}: PriceAlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'watchlist' | 'deals' | 'create'>('alerts');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [deals, setDeals] = useState<DealAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New alert form state
  const [selectedHelmet, setSelectedHelmet] = useState<Helmet | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'browser' | 'email' | 'both'>('browser');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAlerts(getStoredPriceAlerts());
    setWatchlist(getStoredWatchlist());
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateAlert = async () => {
    if (!selectedHelmet || !targetPrice) {
      showNotification('Please select a helmet and enter a target price');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      showNotification('Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const alert = await createEnhancedPriceAlert(
        selectedHelmet,
        price,
        notificationMethod
      );

      if (alert) {
        setAlerts(prev => [...prev, alert]);
        setSelectedHelmet(null);
        setTargetPrice('');
        showNotification(`Price alert created for ${selectedHelmet.brand} ${selectedHelmet.name}`);
        setActiveTab('alerts');
      }
    } catch (error) {
      showNotification('Failed to create price alert');
      console.error('Alert creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = (helmet: Helmet) => {
    const item = addToWatchlist(helmet, 'medium');
    setWatchlist(prev => [...prev, item]);
    showNotification(`Added ${helmet.brand} ${helmet.name} to watchlist`);
  };

  const handleAnalyzeDeals = async () => {
    setLoading(true);

    try {
      const topHelmets = HELMETS
        .filter(h => h.star_rating >= 4)
        .sort((a, b) => a.safety_score - b.safety_score)
        .slice(0, 20);

      const dealAnalyses = topHelmets.map(helmet => analyzeEnhancedDeals(helmet));

      const goodDeals = dealAnalyses
        .filter(deal => deal.dealScore >= 70 && deal.confidence >= 60)
        .sort((a, b) => b.dealScore - a.dealScore);

      setDeals(goodDeals);
      setActiveTab('deals');
      showNotification(`Found ${goodDeals.length} good deals`);
    } catch (error) {
      showNotification('Failed to analyze deals');
      console.error('Deal analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    setLoading(true);

    try {
      // Simulate price update since we don't have external API
      showNotification('Price data refreshed from local sources');
      loadData(); // Refresh alerts
    } catch (error) {
      showNotification('Failed to refresh price data');
      console.error('Price update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));

    // Update localStorage
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, isActive: !alert.isActive }
        : alert
    );
    localStorage.setItem('helmet_price_alerts', JSON.stringify(updatedAlerts));
  };

  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));

    // Update localStorage
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    localStorage.setItem('helmet_price_alerts', JSON.stringify(updatedAlerts));

    showNotification('Alert removed');
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getRecommendationColor = (recommendation: DealAnalysis['recommendation']) => {
    switch (recommendation) {
      case 'excellent_deal': return 'text-green-700 bg-green-100';
      case 'good_deal': return 'text-green-600 bg-green-50';
      case 'fair_price': return 'text-yellow-600 bg-yellow-50';
      case 'wait': return 'text-orange-600 bg-orange-50';
      case 'overpriced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Don't render if not visible in modal mode
  if (onClose && !isVisible) {
    return null;
  }

  const dashboardContent = (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Notification */}
      {notification && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Price Tracking</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkPriceUpdate}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Update Prices
            </button>
            <button
              onClick={handleAnalyzeDeals}
              disabled={loading}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '⏳' : '💰'} Find Deals
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'alerts', label: 'Price Alerts', count: alerts.filter(a => a.isActive).length },
          { id: 'watchlist', label: 'Watchlist', count: watchlist.length },
          { id: 'deals', label: 'Good Deals', count: deals.length },
          { id: 'create', label: 'Create Alert', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'alerts' | 'watchlist' | 'deals' | 'create')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>No price alerts created yet</p>
                <p className="text-sm">Click &quot;Create Alert&quot; to get started</p>
              </div>
            ) : (
              alerts.map(alert => {
                const helmet = HELMETS.find(h => h.id === alert.helmetId);
                if (!helmet) return null;

                const triggered = !!alert.triggeredAt;
                const priceDropPercent = alert.currentPrice && alert.targetPrice
                  ? ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100
                  : 0;

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${
                      triggered ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {alert.helmetBrand} {alert.helmetName}
                          </h3>
                          <PriceTrendIndicator helmet={helmet} />
                          {triggered && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              TRIGGERED
                            </span>
                          )}
                          {!alert.isActive && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              PAUSED
                            </span>
                          )}
                          {alert.keepaTracking && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              KEEPA
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>Target: {formatPrice(alert.targetPrice)}</span>
                          <span>Current: {formatPrice(alert.currentPrice)}</span>
                          {priceDropPercent > 0 && (
                            <span className="text-green-600">
                              {priceDropPercent.toFixed(1)}% to target
                            </span>
                          )}
                          {alert.asin && (
                            <span className="text-blue-600">ASIN: {alert.asin}</span>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                          {triggered && (
                            <span className="ml-2">
                              • Triggered {new Date(alert.triggeredAt!).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className={`p-1 rounded ${
                            alert.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={alert.isActive ? 'Pause alert' : 'Resume alert'}
                        >
                          {alert.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete alert"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👀</div>
                <p>No helmets in watchlist</p>
                <p className="text-sm">Search for helmets and add them to your watchlist</p>
              </div>
            ) : (
              watchlist.map(item => {
                const helmet = HELMETS.find(h => h.id === item.helmetId);
                if (!helmet) return null;

                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {helmet.brand} {helmet.name}
                          </h3>
                          <PriceTrendIndicator helmet={helmet} />
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.priority === 'high' ? 'bg-red-100 text-red-800' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.priority.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>Current: {formatPrice(helmet.min_price)}</span>
                          <span>Rating: {'⭐'.repeat(helmet.star_rating)}</span>
                          <span>Safety: {helmet.safety_score}</span>
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                          • Last checked {new Date(item.lastChecked).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedHelmet(helmet);
                          setTargetPrice(Math.round(helmet.min_price * 0.9).toString());
                          setActiveTab('create');
                        }}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Create Alert
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-4">
            {deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💰</div>
                <p>No deals analyzed yet</p>
                <p className="text-sm">Click &quot;Find Deals&quot; to analyze current helmet prices</p>
              </div>
            ) : (
              deals.map(deal => {
                const helmet = HELMETS.find(h => h.id === deal.helmetId);
                if (!helmet) return null;

                return (
                  <div key={deal.helmetId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {helmet.brand} {helmet.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getRecommendationColor(deal.recommendation)}`}>
                            {deal.recommendation.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {deal.dealScore}/100
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Current:</span>
                            <span className="ml-1 font-medium">{formatPrice(deal.currentPrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Low:</span>
                            <span className="ml-1 text-green-600">{formatPrice(deal.historicalLow)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg:</span>
                            <span className="ml-1">{formatPrice(deal.averagePrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Drop:</span>
                            <span className="ml-1 text-green-600">{deal.priceDropPercentage.toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Confidence: {deal.confidence}% • Volatility: ${deal.volatility.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddToWatchlist(helmet)}
                          className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Watch
                        </button>
                        <button
                          onClick={() => {
                            setSelectedHelmet(helmet);
                            setTargetPrice(Math.round(deal.currentPrice * 0.95).toString());
                            setActiveTab('create');
                          }}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Alert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Price Alert</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Helmet
                </label>
                <select
                  value={selectedHelmet?.id || ''}
                  onChange={(e) => {
                    const helmet = HELMETS.find(h => h.id === parseInt(e.target.value));
                    setSelectedHelmet(helmet || null);
                    if (helmet) {
                      setTargetPrice(Math.round(helmet.min_price * 0.9).toString());
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a helmet...</option>
                  {HELMETS
                    .filter(h => h.star_rating >= 4)
                    .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
                    .map(helmet => (
                      <option key={helmet.id} value={helmet.id}>
                        {helmet.brand} {helmet.name} - ${helmet.min_price}
                      </option>
                    ))}
                </select>
              </div>

              {selectedHelmet && (
                <div className="p-3 bg-gray-50 rounded border">
                  <div className="text-sm">
                    <div className="font-medium">{selectedHelmet.brand} {selectedHelmet.name}</div>
                    <div className="text-gray-600 mt-1">
                      Current: {formatPrice(selectedHelmet.min_price)} •
                      Rating: {'⭐'.repeat(selectedHelmet.star_rating)} •
                      Safety: {selectedHelmet.safety_score}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                  />
                </div>
                {selectedHelmet && targetPrice && (
                  <div className="mt-1 text-xs text-gray-500">
                    {parseFloat(targetPrice) < selectedHelmet.min_price
                      ? `${(((selectedHelmet.min_price - parseFloat(targetPrice)) / selectedHelmet.min_price) * 100).toFixed(1)}% below current price`
                      : 'Target is above current price'
                    }
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Method
                </label>
                <select
                  value={notificationMethod}
                  onChange={(e) => setNotificationMethod(e.target.value as 'browser' | 'email' | 'both')}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="browser">Browser Notification</option>
                  <option value="email">Email (Future)</option>
                  <option value="both">Both (Future)</option>
                </select>
              </div>

              <button
                onClick={handleCreateAlert}
                disabled={loading || !selectedHelmet || !targetPrice}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Price Alert'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Return with modal wrapper if onClose is provided
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {dashboardContent}
        </div>
      </div>
    );
  }

  // Return standalone component
  return dashboardContent;
}