'use client';

import { useState, useEffect } from 'react';
import { ABTestManager, AMAZON_BUTTON_TESTS } from '@/utils/abTesting';
import type { ABTest, ABTestResult } from '@/utils/abTesting';

interface ABTestDashboardProps {
  className?: string;
}

export default function ABTestDashboard({ className = '' }: ABTestDashboardProps) {
  const [manager] = useState(() => ABTestManager.getInstance());
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [testResults, setTestResults] = useState<Map<string, Map<string, ABTestResult>>>(new Map());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');

  useEffect(() => {
    // Show in development or with query param
    const shouldShow = process.env.NODE_ENV === 'development' ||
                     window.location.search.includes('ab_dashboard=true');
    setIsVisible(shouldShow);

    if (shouldShow) {
      loadTestData();
      const interval = setInterval(loadTestData, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, []);

  const loadTestData = () => {
    manager.loadResultsFromStorage();
    const tests = manager.getActiveTests();
    setActiveTests(tests);

    const allResults = new Map();
    tests.forEach(test => {
      const results = manager.getTestResults(test.id);
      if (results) {
        allResults.set(test.id, results);
      }
    });
    setTestResults(allResults);

    if (!selectedTest && tests.length > 0) {
      setSelectedTest(tests[0].id);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-32 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors z-40 text-sm font-medium"
      >
        🧪 A/B Tests
      </button>
    );
  }

  const selectedTestData = AMAZON_BUTTON_TESTS.find(t => t.id === selectedTest);
  const selectedResults = testResults.get(selectedTest);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getWinnerVariant = (results: Map<string, ABTestResult>) => {
    if (!results || results.size === 0) return null;

    const resultsArray = Array.from(results.values());
    return resultsArray.reduce((winner, current) => {
      return current.clickRate > winner.clickRate ? current : winner;
    });
  };

  const getStatisticalSignificance = (testId: string) => {
    return manager.calculateStatisticalSignificance(testId);
  };

  return (
    <div className={`fixed bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-lg z-50 max-h-96 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800">🧪 A/B Test Dashboard</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {activeTests.map(test => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-80">
        {activeTests.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No active A/B tests running
          </div>
        ) : selectedTestData ? (
          <div className="p-4 space-y-4 text-xs">
            {/* Test Overview */}
            <div className="bg-gray-50 rounded p-3">
              <div className="font-semibold text-gray-800 mb-1">{selectedTestData.name}</div>
              <div className="text-gray-600 text-xs mb-2">{selectedTestData.description}</div>
              <div className="flex justify-between text-xs">
                <span>Status: <span className="font-medium text-green-600">{selectedTestData.status}</span></span>
                <span>Traffic: <span className="font-medium">{selectedTestData.trafficSplit}%</span></span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Goal: {selectedTestData.goals.primary}
              </div>
            </div>

            {/* Test Results */}
            {selectedResults && selectedResults.size > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="bg-blue-50 rounded p-3">
                  <div className="font-semibold text-blue-800 mb-2">Performance Summary</div>
                  {(() => {
                    const totalImpressions = Array.from(selectedResults.values()).reduce((sum, r) => sum + r.impressions, 0);
                    const totalClicks = Array.from(selectedResults.values()).reduce((sum, r) => sum + r.clicks, 0);
                    const overallClickRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                    const winner = getWinnerVariant(selectedResults);

                    return (
                      <div className="text-blue-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Impressions:</span>
                          <span className="font-medium">{formatNumber(totalImpressions)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Clicks:</span>
                          <span className="font-medium">{formatNumber(totalClicks)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overall CTR:</span>
                          <span className="font-medium">{formatPercentage(overallClickRate)}</span>
                        </div>
                        {winner && (
                          <div className="flex justify-between">
                            <span>Leading Variant:</span>
                            <span className="font-medium text-green-600">{winner.variantId}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Variant Performance */}
                <div className="space-y-3">
                  <div className="font-semibold text-gray-800">Variant Performance</div>
                  {Array.from(selectedResults.entries()).map(([variantId, result]) => {
                    const variant = selectedTestData.variants.find(v => v.id === variantId);
                    const significance = getStatisticalSignificance(selectedTest);
                    const isSignificant = significance.get(variantId);
                    const isWinner = getWinnerVariant(selectedResults)?.variantId === variantId;

                    return (
                      <div key={variantId} className={`border rounded p-3 ${isWinner ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-gray-800">
                            {variant?.name || variantId}
                            {isWinner && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">👑 Leader</span>}
                          </div>
                          {isSignificant && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              📊 Significant
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Impressions:</span>
                            <div className="text-gray-800">{formatNumber(result.impressions)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Clicks:</span>
                            <div className="text-gray-800">{formatNumber(result.clicks)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Click Rate:</span>
                            <div className={`font-medium ${isWinner ? 'text-green-600' : 'text-gray-800'}`}>
                              {formatPercentage(result.clickRate)}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Conversions:</span>
                            <div className="text-gray-800">{formatNumber(result.conversions)}</div>
                          </div>
                        </div>

                        {/* Button Preview */}
                        {variant && (
                          <div className="mt-2 p-2 bg-gray-100 rounded">
                            <div className="text-xs text-gray-600 mb-1">Button Preview:</div>
                            <div className="text-xs">
                              <span className="font-medium">Text:</span> {variant.config.buttonText} |{' '}
                              <span className="font-medium">Color:</span> {variant.config.buttonColor} |{' '}
                              <span className="font-medium">Style:</span> {variant.config.buttonStyle}
                            </div>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Traffic Share</span>
                            <span>{variant?.weight}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${isWinner ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${variant?.weight || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                {(() => {
                  const winner = getWinnerVariant(selectedResults);
                  const significance = getStatisticalSignificance(selectedTest);
                  const hasSignificantResults = Array.from(significance.values()).some(Boolean);

                  if (winner && hasSignificantResults) {
                    const improvement = Array.from(selectedResults.values())
                      .filter(r => r.variantId !== winner.variantId)
                      .reduce((max, r) => Math.max(max, winner.clickRate - r.clickRate), 0);

                    return (
                      <div className="bg-green-50 rounded p-3">
                        <div className="font-semibold text-green-800 mb-1">📈 Recommendation</div>
                        <div className="text-green-700 text-xs">
                          <strong>{winner.variantId}</strong> shows a statistically significant improvement
                          of <strong>{formatPercentage(improvement)}</strong> in click-through rate.
                          Consider implementing this variant site-wide.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-yellow-50 rounded p-3">
                      <div className="font-semibold text-yellow-800 mb-1">⏳ Status</div>
                      <div className="text-yellow-700 text-xs">
                        Test is still collecting data. Wait for statistical significance before making decisions.
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm">No test data yet</div>
                <div className="text-xs">Start browsing to generate data</div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            Select a test to view results
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        🔄 Updates every 5s • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

// Test configuration component for admins
export function ABTestConfigPanel() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development with special query param
    const shouldShow = process.env.NODE_ENV === 'development' &&
                     window.location.search.includes('ab_config=true');
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible) return null;

  const activateTest = (testId: string) => {
    const testIndex = AMAZON_BUTTON_TESTS.findIndex(t => t.id === testId);
    if (testIndex !== -1) {
      AMAZON_BUTTON_TESTS[testIndex].status = 'active';
      console.log(`✅ Activated test: ${testId}`);
    }
  };

  const pauseTest = (testId: string) => {
    const testIndex = AMAZON_BUTTON_TESTS.findIndex(t => t.id === testId);
    if (testIndex !== -1) {
      AMAZON_BUTTON_TESTS[testIndex].status = 'paused';
      console.log(`⏸️ Paused test: ${testId}`);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md z-50">
      <h3 className="text-sm font-bold text-gray-800 mb-3">🔧 A/B Test Configuration</h3>

      <div className="space-y-3">
        {AMAZON_BUTTON_TESTS.map(test => (
          <div key={test.id} className="border rounded p-3">
            <div className="font-medium text-sm text-gray-800">{test.name}</div>
            <div className="text-xs text-gray-600 mb-2">{test.description}</div>
            <div className="flex justify-between items-center">
              <span className={`text-xs px-2 py-1 rounded ${
                test.status === 'active' ? 'bg-green-100 text-green-800' :
                test.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {test.status}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => activateTest(test.id)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  disabled={test.status === 'active'}
                >
                  Activate
                </button>
                <button
                  onClick={() => pauseTest(test.id)}
                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                  disabled={test.status === 'paused'}
                >
                  Pause
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        💡 Add ?ab_config=true to URL to access this panel
      </div>
    </div>
  );
}