'use client';

import { useState, useEffect } from 'react';
import { generateConversionReport } from '@/utils/analytics';

interface AnalyticsData {
  session_summary: {
    session_id?: string;
    start_time?: number;
    total_events: number;
    total_value: number;
  };
  attribution_summary: {
    total_clicks: number;
    networks: Array<{
      network: string;
      clicks: number;
      total_value: number;
      avg_value: number;
    }>;
    top_helmets: Array<{
      helmet_id: string;
      clicks: number;
    }>;
  };
  funnel_analysis: Array<{
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
  }>;
  performance_metrics: {
    conversion_rate: number;
    avg_time_to_click: number;
    most_effective_path: string | null;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateAnalytics = () => {
      const report = generateConversionReport();
      if (report) {
        setAnalytics(report);
      }
    };

    // Update analytics every 5 seconds when visible
    if (isVisible) {
      updateAnalytics();
      const interval = setInterval(updateAnalytics, 5000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // Only show in development or when a special query param is present
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' ||
                     window.location.search.includes('analytics=true');
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible || !analytics) {
    return null;
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">📊 Live Analytics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Session Summary */}
        <div className="bg-blue-50 rounded p-2">
          <div className="font-semibold text-blue-800 mb-1">Current Session</div>
          <div className="text-blue-700">
            <div>Events: {analytics.session_summary.total_events}</div>
            <div>Value: {analytics.session_summary.total_value}</div>
            {analytics.session_summary.start_time && (
              <div>Duration: {formatTime(Date.now() - analytics.session_summary.start_time)}</div>
            )}
          </div>
        </div>

        {/* Affiliate Performance */}
        <div className="bg-green-50 rounded p-2">
          <div className="font-semibold text-green-800 mb-1">Affiliate Clicks</div>
          <div className="text-green-700">
            <div>Total: {analytics.attribution_summary.total_clicks}</div>
            {analytics.attribution_summary.networks.map(network => (
              <div key={network.network} className="flex justify-between">
                <span>{network.network}:</span>
                <span>{network.clicks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="bg-orange-50 rounded p-2">
          <div className="font-semibold text-orange-800 mb-1">Conversion</div>
          <div className="text-orange-700">
            <div>Rate: {(analytics.performance_metrics.conversion_rate * 100).toFixed(1)}%</div>
            {analytics.performance_metrics.avg_time_to_click > 0 && (
              <div>Avg Time: {formatTime(analytics.performance_metrics.avg_time_to_click)}</div>
            )}
            {analytics.performance_metrics.most_effective_path && (
              <div className="text-xs mt-1 opacity-75">
                Path: {analytics.performance_metrics.most_effective_path}
              </div>
            )}
          </div>
        </div>

        {/* Top Helmets */}
        {analytics.attribution_summary.top_helmets.length > 0 && (
          <div className="bg-purple-50 rounded p-2">
            <div className="font-semibold text-purple-800 mb-1">Top Clicked</div>
            <div className="text-purple-700">
              {analytics.attribution_summary.top_helmets.slice(0, 3).map(helmet => (
                <div key={helmet.helmet_id} className="flex justify-between">
                  <span className="truncate">ID {helmet.helmet_id}:</span>
                  <span>{helmet.clicks}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        🔄 Updates every 5s • Dev mode only
      </div>
    </div>
  );
}