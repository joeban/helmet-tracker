'use client';

import { useState, useEffect } from 'react';
import { Helmet } from '@/types/helmet';
import { getStoredPriceHistory, PriceHistory } from '@/utils/priceTracking';

interface PriceChartProps {
  helmet: Helmet;
  className?: string;
  height?: number;
  showControls?: boolean;
}

interface ChartData {
  date: string;
  price: number;
  amazon: boolean;
  timestamp: number;
}

export default function PriceChart({
  helmet,
  className = '',
  height = 300,
  showControls = true
}: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<30 | 90 | 180>(90);
  const [showAmazonOnly, setShowAmazonOnly] = useState(false);

  useEffect(() => {
    loadPriceData();
  }, [helmet.id, timeRange]);

  const loadPriceData = () => {
    setLoading(true);
    setError(null);

    try {
      const history = getStoredPriceHistory()
        .filter(h => h.helmetId === helmet.id)
        .filter(h => h.timestamp > Date.now() - (timeRange * 24 * 60 * 60 * 1000));

      if (history.length === 0) {
        setError('No price history available. Price data will appear as it\'s tracked.');
        setChartData([]);
        setLoading(false);
        return;
      }

      // Convert local price history to chart data
      const data: ChartData[] = history
        .map(h => ({
          date: new Date(h.timestamp).toLocaleDateString(),
          price: h.minPrice,
          amazon: h.source === 'api', // Assume API source is Amazon
          timestamp: h.timestamp
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price data');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = showAmazonOnly
    ? chartData.filter(d => d.amazon)
    : chartData;

  const minPrice = Math.min(...filteredData.map(d => d.price));
  const maxPrice = Math.max(...filteredData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const currentPrice = filteredData[filteredData.length - 1]?.price || helmet.min_price;

  // Calculate price statistics
  const avgPrice = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.price, 0) / filteredData.length
    : 0;

  const priceChangeFromStart = filteredData.length > 1
    ? filteredData[filteredData.length - 1].price - filteredData[0].price
    : 0;

  const priceChangePercent = filteredData.length > 1 && filteredData[0].price > 0
    ? (priceChangeFromStart / filteredData[0].price) * 100
    : 0;

  // Generate SVG path for price line
  const generatePath = () => {
    if (filteredData.length < 2) return '';

    const width = 100; // Percentage-based coordinates
    const chartHeight = 100;

    const points = filteredData.map((d, i) => {
      const x = (i / (filteredData.length - 1)) * width;
      const y = chartHeight - ((d.price - minPrice) / (priceRange || 1)) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Price Data Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPriceData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
          <p className="text-sm text-gray-600">{helmet.brand} {helmet.name}</p>
        </div>

        {/* Current Price Badge */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{formatPrice(currentPrice)}</div>
          {priceChangePercent !== 0 && (
            <div className={`text-sm ${priceChangePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%
              <span className="text-gray-500 ml-1">({timeRange}d)</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            {[30, 90, 180].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 30 | 90 | 180)}
                className={`px-3 py-1 text-sm rounded ${
                  timeRange === days
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAmazonOnly}
              onChange={(e) => setShowAmazonOnly(e.target.checked)}
              className="mr-2"
            />
            Amazon only
          </label>
        </div>
      )}

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {filteredData.length >= 2 ? (
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Price area fill */}
            <path
              d={`${generatePath()} L 100,100 L 0,100 Z`}
              fill="url(#priceGradient)"
              opacity="0.1"
            />

            {/* Price line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Data points */}
            {filteredData.map((d, i) => {
              const x = (i / (filteredData.length - 1)) * 100;
              const y = 100 - ((d.price - minPrice) / (priceRange || 1)) * 100;

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={d.amazon ? "#3b82f6" : "#10b981"}
                  vectorEffect="non-scaling-stroke"
                  className="hover:r-3 transition-all cursor-pointer"
                >
                  <title>{`${d.date}: ${formatPrice(d.price)} ${d.amazon ? '(Amazon)' : '(3rd Party)'}`}</title>
                </circle>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>Not enough data points to display chart</p>
              <p className="text-sm">Need at least 2 price entries</p>
            </div>
          </div>
        )}

        {/* Y-axis labels */}
        {filteredData.length >= 2 && (
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
            <span>{formatPrice(maxPrice)}</span>
            <span>{formatPrice(avgPrice)}</span>
            <span>{formatPrice(minPrice)}</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-sm text-gray-500">Lowest</div>
          <div className="font-semibold text-green-600">{formatPrice(minPrice)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Average</div>
          <div className="font-semibold">{formatPrice(avgPrice)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Highest</div>
          <div className="font-semibold text-red-600">{formatPrice(maxPrice)}</div>
        </div>
      </div>

      {/* Data source indicator */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Data from Keepa API • {filteredData.length} price points over {timeRange} days
      </div>
    </div>
  );
}

// Compact version for dashboard/cards
export function CompactPriceChart({ helmet, className = '' }: { helmet: Helmet; className?: string }) {
  return (
    <PriceChart
      helmet={helmet}
      className={className}
      height={150}
      showControls={false}
    />
  );
}

// Price trend indicator component
export function PriceTrendIndicator({ helmet }: { helmet: Helmet }) {
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrend = () => {
      try {
        const history = getStoredPriceHistory()
          .filter(h => h.helmetId === helmet.id)
          .filter(h => h.timestamp > Date.now() - (30 * 24 * 60 * 60 * 1000))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (history.length >= 2) {
          const recent = history.slice(-7);
          const older = history.slice(-14, -7);

          if (older.length > 0) {
            const recentAvg = recent.reduce((sum, h) => sum + h.minPrice, 0) / recent.length;
            const olderAvg = older.reduce((sum, h) => sum + h.minPrice, 0) / older.length;

            const change = ((recentAvg - olderAvg) / olderAvg) * 100;

            setPercentage(Math.abs(change));

            if (Math.abs(change) < 2) {
              setTrend('stable');
            } else {
              setTrend(change > 0 ? 'up' : 'down');
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load price trend:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrend();
  }, [helmet.id]);

  if (loading) {
    return <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>;
  }

  const iconColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400';
  const icon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div className={`flex items-center space-x-1 text-sm ${iconColor}`} title={`Price trend: ${trend} ${percentage.toFixed(1)}%`}>
      <span>{icon}</span>
      {percentage > 2 && <span>{percentage.toFixed(1)}%</span>}
    </div>
  );
}