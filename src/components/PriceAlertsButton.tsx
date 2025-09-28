'use client';

import { useState, useEffect } from 'react';
import PriceAlertsDashboard from './PriceAlertsDashboard';
import { getStoredPriceAlerts, getStoredWatchlist } from '@/utils/priceTracking';

export default function PriceAlertsButton() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      const alerts = getStoredPriceAlerts();
      const watchlist = getStoredWatchlist();

      setAlertCount(alerts.filter(a => a.isActive && !a.triggeredAt).length);
      setWatchlistCount(watchlist.length);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const totalCount = alertCount + watchlistCount;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowDashboard(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 group"
        aria-label="Open Price Tracking Dashboard"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 8v8M8 12h8" />
          </svg>

          {/* Notification badge */}
          {totalCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {totalCount > 99 ? '99+' : totalCount}
            </div>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-3 bottom-1/2 transform translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Price Alerts & Watchlist
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </button>

      {/* Dashboard Modal */}
      <PriceAlertsDashboard
        isVisible={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
}