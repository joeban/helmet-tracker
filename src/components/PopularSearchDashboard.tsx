'use client';

import { useState, useEffect } from 'react';
import { generateConversionReport } from '@/utils/analytics';
import { generateTestSearchData, clearTestSearchData } from '@/utils/searchAnalyticsTestData';

interface SearchAnalytics {
  popular_searches: Array<{
    term: string;
    count: number;
    intent: string;
    last_searched: number;
  }>;
  search_trends: Array<{
    date: string;
    total_searches: number;
    unique_terms: number;
  }>;
  filter_usage: Array<{
    filter_type: string;
    filter_value: string;
    usage_count: number;
  }>;
  conversion_by_search: Array<{
    search_term: string;
    searches: number;
    conversions: number;
    conversion_rate: number;
  }>;
  top_converting_terms: Array<{
    term: string;
    conversion_rate: number;
    total_value: number;
  }>;
}

export default function PopularSearchDashboard() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    const updateAnalytics = () => {
      const searchData = generateSearchAnalytics(timeRange);
      if (searchData) {
        setAnalytics(searchData);
      }
    };

    if (isVisible) {
      updateAnalytics();
      const interval = setInterval(updateAnalytics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible, timeRange]);

  // Show in development or with query param
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' ||
                     window.location.search.includes('search_analytics=true');
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-40 text-sm font-medium"
      >
        📊 Search Analytics
      </button>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
          <span className="text-sm text-gray-600">Loading search analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-80 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md z-50 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800">🔍 Popular Searches</h3>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                generateTestSearchData();
                window.location.reload();
              }}
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
              title="Generate test data"
            >
              🧪
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-80">
        <div className="p-4 space-y-4 text-xs">
          {/* Popular Search Terms */}
          <div className="bg-blue-50 rounded p-3">
            <div className="font-semibold text-blue-800 mb-2">Top Search Terms</div>
            <div className="space-y-1">
              {analytics.popular_searches.slice(0, 5).map((search, index) => (
                <div key={search.term} className="flex items-center justify-between text-blue-700">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 text-center font-medium">{index + 1}.</span>
                    <span className="truncate max-w-32" title={search.term}>
                      {search.term}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      search.intent === 'buying' ? 'bg-green-100 text-green-700' :
                      search.intent === 'safety_research' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {search.intent}
                    </span>
                  </div>
                  <span className="font-medium">{search.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search Trends */}
          <div className="bg-green-50 rounded p-3">
            <div className="font-semibold text-green-800 mb-2">Search Activity</div>
            <div className="text-green-700">
              <div className="flex justify-between">
                <span>Total Searches:</span>
                <span className="font-medium">
                  {analytics.search_trends.reduce((sum, trend) => sum + trend.total_searches, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unique Terms:</span>
                <span className="font-medium">
                  {analytics.search_trends.reduce((sum, trend) => sum + trend.unique_terms, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg/Search:</span>
                <span className="font-medium">
                  {analytics.popular_searches.length > 0 ?
                    (analytics.popular_searches.reduce((sum, s) => sum + s.count, 0) / analytics.popular_searches.length).toFixed(1) :
                    '0'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Top Converting Search Terms */}
          {analytics.top_converting_terms.length > 0 && (
            <div className="bg-purple-50 rounded p-3">
              <div className="font-semibold text-purple-800 mb-2">High-Converting Terms</div>
              <div className="space-y-1">
                {analytics.top_converting_terms.slice(0, 3).map((term) => (
                  <div key={term.term} className="flex items-center justify-between text-purple-700">
                    <span className="truncate max-w-24" title={term.term}>
                      {term.term}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-purple-100 px-1 rounded">
                        {(term.conversion_rate * 100).toFixed(0)}%
                      </span>
                      <span className="font-medium">${term.total_value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Filters */}
          <div className="bg-orange-50 rounded p-3">
            <div className="font-semibold text-orange-800 mb-2">Popular Filters</div>
            <div className="space-y-1 text-orange-700">
              {analytics.filter_usage.slice(0, 5).map((filter) => (
                <div key={`${filter.filter_type}-${filter.filter_value}`} className="flex justify-between">
                  <span className="truncate max-w-32">
                    {filter.filter_type}: {filter.filter_value}
                  </span>
                  <span className="font-medium">{filter.usage_count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search-to-Conversion Analysis */}
          {analytics.conversion_by_search.length > 0 && (
            <div className="bg-red-50 rounded p-3">
              <div className="font-semibold text-red-800 mb-2">Conversion Analysis</div>
              <div className="space-y-1">
                {analytics.conversion_by_search.slice(0, 3).map((conv) => (
                  <div key={conv.search_term} className="text-red-700">
                    <div className="flex justify-between items-center">
                      <span className="truncate max-w-24 text-xs" title={conv.search_term}>
                        {conv.search_term}
                      </span>
                      <span className="text-xs font-medium">
                        {conv.conversions}/{conv.searches}
                      </span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-red-600 h-1 rounded-full"
                        style={{ width: `${Math.min(conv.conversion_rate * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        🔄 Updates every 30s • Last: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

// Generate search analytics from localStorage data
function generateSearchAnalytics(timeRange: '1h' | '24h' | '7d' | '30d'): SearchAnalytics | null {
  if (typeof window === 'undefined') return null;

  const timeRangeMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };

  const cutoffTime = Date.now() - timeRangeMs[timeRange];

  // Get search data from localStorage
  const searchData = getStoredSearchData(cutoffTime);
  const conversionData = getConversionData(cutoffTime);

  return {
    popular_searches: getPopularSearches(searchData),
    search_trends: getSearchTrends(searchData, timeRange),
    filter_usage: getFilterUsage(searchData),
    conversion_by_search: getConversionBySearch(searchData, conversionData),
    top_converting_terms: getTopConvertingTerms(searchData, conversionData)
  };
}

function getStoredSearchData(cutoffTime: number) {
  const searches: Array<{
    term: string;
    timestamp: number;
    intent: string;
    filters: Record<string, any>;
    result_count: number;
  }> = [];

  // Check for search events in analytics data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('helmet_conversion_session') || key?.startsWith('search_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key)!);

        // Extract search events from session data
        if (data.events) {
          data.events
            .filter((event: any) => event.type === 'search' && event.timestamp > cutoffTime)
            .forEach((event: any) => {
              searches.push({
                term: event.data.search_term || '',
                timestamp: event.timestamp,
                intent: event.data.intent?.category || 'browsing',
                filters: event.data.filters || {},
                result_count: event.data.result_count || 0
              });
            });
        }
      } catch {
        // Skip invalid data
      }
    }
  }

  return searches;
}

function getConversionData(cutoffTime: number) {
  const conversions: Array<{
    sessionId: string;
    helmetId: string;
    timestamp: number;
    value: number;
  }> = [];

  // Get attribution data
  try {
    const attributions = localStorage.getItem('helmet_attributions');
    if (attributions) {
      const data = JSON.parse(attributions);
      data
        .filter((attr: any) => attr.clickTimestamp > cutoffTime)
        .forEach((attr: any) => {
          conversions.push({
            sessionId: attr.sessionId,
            helmetId: attr.helmetId,
            timestamp: attr.clickTimestamp,
            value: attr.conversionValue || 0
          });
        });
    }
  } catch {
    // Skip if no data
  }

  return conversions;
}

function getPopularSearches(searchData: Array<any>) {
  const termCounts = searchData.reduce((acc, search) => {
    const term = search.term.toLowerCase();
    if (!acc[term]) {
      acc[term] = {
        count: 0,
        intent: search.intent,
        last_searched: search.timestamp
      };
    }
    acc[term].count += 1;
    acc[term].last_searched = Math.max(acc[term].last_searched, search.timestamp);
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(termCounts)
    .map(([term, data]: [string, any]) => ({
      term,
      count: data.count,
      intent: data.intent,
      last_searched: data.last_searched
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function getSearchTrends(searchData: Array<any>, timeRange: string) {
  const groupBy = timeRange === '1h' ? 'hour' : timeRange === '24h' ? 'hour' : 'day';
  const trends: Record<string, { total_searches: number; unique_terms: Set<string> }> = {};

  searchData.forEach(search => {
    const date = new Date(search.timestamp);
    const key = groupBy === 'hour'
      ? `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`
      : `${date.getMonth()+1}/${date.getDate()}`;

    if (!trends[key]) {
      trends[key] = { total_searches: 0, unique_terms: new Set() };
    }
    trends[key].total_searches += 1;
    trends[key].unique_terms.add(search.term.toLowerCase());
  });

  return Object.entries(trends)
    .map(([date, data]) => ({
      date,
      total_searches: data.total_searches,
      unique_terms: data.unique_terms.size
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function getFilterUsage(searchData: Array<any>) {
  const filterCounts: Record<string, number> = {};

  searchData.forEach(search => {
    Object.entries(search.filters || {}).forEach(([filterType, filterValue]) => {
      if (filterValue && filterValue !== '') {
        const key = `${filterType}-${filterValue}`;
        filterCounts[key] = (filterCounts[key] || 0) + 1;
      }
    });
  });

  return Object.entries(filterCounts)
    .map(([key, count]) => {
      const [filter_type, filter_value] = key.split('-', 2);
      return { filter_type, filter_value, usage_count: count };
    })
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);
}

function getConversionBySearch(searchData: Array<any>, conversionData: Array<any>) {
  const searchSessions = new Set(searchData.map(s => s.sessionId).filter(Boolean));
  const conversionSessions = new Set(conversionData.map(c => c.sessionId));

  const termConversions: Record<string, { searches: number; conversions: number }> = {};

  searchData.forEach(search => {
    const term = search.term.toLowerCase();
    if (!termConversions[term]) {
      termConversions[term] = { searches: 0, conversions: 0 };
    }
    termConversions[term].searches += 1;

    // Check if this search led to a conversion
    if (search.sessionId && conversionSessions.has(search.sessionId)) {
      termConversions[term].conversions += 1;
    }
  });

  return Object.entries(termConversions)
    .map(([search_term, data]) => ({
      search_term,
      searches: data.searches,
      conversions: data.conversions,
      conversion_rate: data.searches > 0 ? data.conversions / data.searches : 0
    }))
    .filter(item => item.searches >= 2) // Only show terms with meaningful data
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .slice(0, 10);
}

function getTopConvertingTerms(searchData: Array<any>, conversionData: Array<any>) {
  const termValues: Record<string, { conversions: number; total_value: number; searches: number }> = {};

  searchData.forEach(search => {
    const term = search.term.toLowerCase();
    if (!termValues[term]) {
      termValues[term] = { conversions: 0, total_value: 0, searches: 0 };
    }
    termValues[term].searches += 1;

    // Find matching conversions
    const matchingConversions = conversionData.filter(c => c.sessionId === search.sessionId);
    matchingConversions.forEach(conversion => {
      termValues[term].conversions += 1;
      termValues[term].total_value += conversion.value;
    });
  });

  return Object.entries(termValues)
    .map(([term, data]) => ({
      term,
      conversion_rate: data.searches > 0 ? data.conversions / data.searches : 0,
      total_value: data.total_value
    }))
    .filter(item => item.total_value > 0)
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10);
}