'use client';

import { useState, useEffect } from 'react';
import {
  getStoredPriceAlerts,
  getStoredWatchlist,
  getStoredPriceHistory,
  generatePriceReport,
  PriceAlert,
  WatchlistItem,
  PriceHistory
} from '@/utils/priceTracking';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';

interface PriceAlertsDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export default function PriceAlertsDashboard({ isVisible = false, onClose }: PriceAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'watchlist' | 'history' | 'analytics'>('alerts');
  const [priceReport, setPriceReport] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      loadData();
      const interval = setInterval(loadData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const loadData = () => {
    setAlerts(getStoredPriceAlerts());
    setWatchlist(getStoredWatchlist());
    setPriceHistory(getStoredPriceHistory());
    setPriceReport(generatePriceReport());
  };

  const deleteAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem('helmet_price_alerts', JSON.stringify(updatedAlerts));
  };

  const deleteWatchlistItem = (itemId: string) => {
    const updatedWatchlist = watchlist.filter(item => item.id !== itemId);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('helmet_watchlist', JSON.stringify(updatedWatchlist));
  };

  const getHelmetById = (id: number): Helmet | undefined => {
    return HELMETS.find((helmet: Helmet) => helmet.id === id);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getAlertStatusBadge = (alert: PriceAlert) => {
    if (alert.triggeredAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Triggered
        </span>
      );
    } else if (alert.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🔔 Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ⏸️ Inactive
        </span>
      );
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Price Tracking Dashboard</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'alerts', label: 'Price Alerts', count: alerts.filter(a => a.isActive).length },
              { key: 'watchlist', label: 'Watchlist', count: watchlist.length },
              { key: 'history', label: 'Price History', count: priceHistory.length },
              { key: 'analytics', label: 'Analytics', count: null }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2 py-1 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Price Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Active Price Alerts ({alerts.filter(a => a.isActive).length})
                </h3>
              </div>

              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔔</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No price alerts yet</h3>
                  <p className="text-gray-500">Create price alerts on helmet pages to track deals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => {
                    const helmet = getHelmetById(alert.helmetId);
                    return (
                      <div key={alert.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {helmet?.brand} {helmet?.name || alert.helmetName}
                            </h4>
                            {getAlertStatusBadge(alert)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Type: {alert.alertType.replace('_', ' ')}</div>
                            <div>Target: ${alert.targetPrice} | Current: ${alert.currentPrice}</div>
                            <div>Created: {formatTime(alert.createdAt)}</div>
                            {alert.triggeredAt && (
                              <div>Triggered: {formatTime(alert.triggeredAt)}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Watchlist ({watchlist.length})
                </h3>
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👁️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your watchlist is empty</h3>
                  <p className="text-gray-500">Add helmets to your watchlist to track their prices</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.map(item => {
                    const helmet = getHelmetById(item.helmetId);
                    if (!helmet) return null;

                    return (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {helmet.brand} {helmet.name}
                            </h4>
                            <div className="text-xs text-gray-500 mt-1">
                              Added {formatTime(item.addedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteWatchlistItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Price:</span>
                            <span className="font-medium">${helmet.min_price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Safety Rating:</span>
                            <span className="font-medium">{helmet.star_rating}★</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Priority:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.priority === 'high' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Price History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Price Changes ({priceHistory.slice(0, 50).length})
              </h3>

              {priceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No price history yet</h3>
                  <p className="text-gray-500">Price changes will appear here as they're tracked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priceHistory
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50)
                    .map((entry, index) => {
                      const helmet = getHelmetById(entry.helmetId);
                      const hasSignificantChange = Math.abs(entry.changePercentage || 0) > 3;

                      return (
                        <div key={index} className="bg-gray-50 rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {helmet?.brand} {helmet?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(entry.timestamp)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-medium">${entry.minPrice}</div>
                            {hasSignificantChange && (
                              <div className={`text-xs ${
                                (entry.changePercentage || 0) > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {(entry.changePercentage || 0) > 0 ? '+' : ''}
                                {entry.changePercentage?.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && priceReport && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Price Tracking Analytics</h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {priceReport.summary.active_alerts}
                  </div>
                  <div className="text-sm text-blue-700">Active Alerts</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {priceReport.summary.triggered_alerts}
                  </div>
                  <div className="text-sm text-green-700">Triggered Alerts</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {priceReport.summary.watchlist_items}
                  </div>
                  <div className="text-sm text-purple-700">Watchlist Items</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-900">
                    {priceReport.summary.recent_price_changes}
                  </div>
                  <div className="text-sm text-orange-700">Recent Changes</div>
                </div>
              </div>

              {/* Alert Types Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Alert Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-semibold">
                      {priceReport.alerts.by_type.target_price}
                    </div>
                    <div className="text-sm text-gray-600">Target Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">
                      {priceReport.alerts.by_type.price_drop}
                    </div>
                    <div className="text-sm text-gray-600">Price Drop</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">
                      {priceReport.alerts.by_type.deal_threshold}
                    </div>
                    <div className="text-sm text-gray-600">Deal Threshold</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {priceReport.recent_activity.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recent Significant Price Changes</h4>
                  <div className="space-y-2">
                    {priceReport.recent_activity.map((entry: PriceHistory, index: number) => {
                      const helmet = getHelmetById(entry.helmetId);
                      return (
                        <div key={index} className="bg-gray-50 rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {helmet?.brand} {helmet?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(entry.timestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${entry.minPrice}</div>
                            <div className={`text-xs ${
                              (entry.changePercentage || 0) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {(entry.changePercentage || 0) > 0 ? '+' : ''}
                              {entry.changePercentage?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}