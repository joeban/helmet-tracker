'use client';

import { useState, useEffect } from 'react';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import { ScraperIntegration } from '@/utils/scraperIntegration';

interface ScraperDashboardProps {
  className?: string;
}

export default function ScraperDashboard({ className = '' }: ScraperDashboardProps) {
  const [integration] = useState(() => new ScraperIntegration());
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'import' | 'export'>('overview');
  const [stats, setStats] = useState<{
    totalHelmets: number;
    helmetsWithASINs: number;
    coveragePercentage: number;
    scraperASINs: number;
    needingScraping: number;
  } | null>(null);
  const [scrapingPlan, setScrapingPlan] = useState<{helmet: any; priority: number; reason: string}[]>([]);
  const [importData, setImportData] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    // Show in development or with query param
    const shouldShow = process.env.NODE_ENV === 'development' ||
                     window.location.search.includes('scraper_dashboard=true');
    setIsVisible(shouldShow);

    if (shouldShow) {
      loadData();
    }
  }, []);

  const loadData = () => {
    const scrapingStats = integration.getScrapingStats(HELMETS);
    setStats(scrapingStats);

    const plan = integration.generateScrapingPlan(HELMETS, 25);
    setScrapingPlan(plan);
  };

  const handleImportResults = () => {
    try {
      const results = JSON.parse(importData);

      if (!Array.isArray(results)) {
        throw new Error('Import data must be an array of ScrapedASINResult objects');
      }

      const importStats = integration.importScrapedResults(results, {
        minConfidence: 30,
        autoVerifyHighConfidence: true,
        highConfidenceThreshold: 80
      });

      setImportStatus(`✅ Import successful! Added ${importStats.newASINsAdded} new ASINs from ${importStats.helmetsWithASINs} helmets. Average confidence: ${importStats.averageConfidence.toFixed(1)}%`);
      setImportData('');
      loadData(); // Refresh stats
    } catch (error) {
      setImportStatus(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exportDatabase = () => {
    const data = integration.exportEnhancedDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helmet-asins-enhanced-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-32 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors z-40 text-sm font-medium"
      >
        🕷️ Scraper
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-3xl z-50 max-h-96 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">🕷️ Amazon ASIN Scraper</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportDatabase}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Export DB
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'plan', label: '🎯 Scraping Plan' },
          { id: 'import', label: '📥 Import Results' },
          { id: 'export', label: '📤 Export' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'plan' | 'import' | 'export')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto max-h-80 p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-2">Scraping Coverage Statistics</h4>
              {stats && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded p-3">
                    <div className="text-2xl font-bold text-blue-600">{stats.helmetsWithASINs}</div>
                    <div className="text-gray-600">Helmets with ASINs</div>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{stats.scraperASINs}</div>
                    <div className="text-gray-600">Scraper Generated</div>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <div className="text-2xl font-bold text-purple-600">{stats.coveragePercentage.toFixed(1)}%</div>
                    <div className="text-gray-600">Coverage</div>
                  </div>
                  <div className="bg-orange-50 rounded p-3">
                    <div className="text-2xl font-bold text-orange-600">{stats.needingScraping}</div>
                    <div className="text-gray-600">Need Scraping</div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-600">
              <strong>Scraper Status:</strong> Ready to discover ASINs for {stats?.needingScraping || 0} helmets.
              Use the scraping plan to prioritize which helmets to process first.
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 Priority Scraping Plan</h4>
              <p className="text-sm text-gray-600 mb-3">
                Top {scrapingPlan.length} helmets prioritized by missing ASINs, brand popularity, and price.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scrapingPlan.slice(0, 15).map((item, index) => (
                <div key={item.helmet.id} className="bg-gray-50 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        #{index + 1}: {item.helmet.brand} {item.helmet.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ${item.helmet.min_price} • Priority: {item.priority} • {item.reason}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <a
                        href={`https://amazon.com/s?k=${encodeURIComponent(`${item.helmet.brand} ${item.helmet.name} helmet`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                      >
                        Search
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-blue-800 text-sm">
                <strong>Scraping Command:</strong>
                <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
{`# Scrape top 10 priority helmets
node scripts/scrape-asins.js --limit 10

# Scrape with visible browser for debugging
node scripts/scrape-asins.js --limit 5 --headless false`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📥 Import Scraping Results</h4>
              <p className="text-sm text-gray-600 mb-3">
                Paste the JSON output from the scraper script to import ASINs into your database.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scraping Results JSON
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste JSON array of ScrapedASINResult objects here..."
                  className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono"
                />
              </div>

              <button
                onClick={handleImportResults}
                disabled={!importData.trim()}
                className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                  importData.trim()
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Import ASIN Results
              </button>

              {importStatus && (
                <div className={`p-3 rounded text-sm ${
                  importStatus.startsWith('✅')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="text-yellow-800 text-sm">
                <strong>Import Settings:</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li>Minimum confidence: 30%</li>
                  <li>Auto-verify high confidence (&gt;80%): Yes</li>
                  <li>Skip duplicates: Yes</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">📤 Export Options</h4>
              <p className="text-sm text-gray-600 mb-3">
                Export your ASIN database with scraping metadata for backup or analysis.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={exportDatabase}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📁 Export Enhanced Database (JSON)
              </button>

              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm text-gray-700">
                  <strong>Export includes:</strong>
                  <ul className="mt-1 list-disc list-inside text-xs">
                    <li>All ASIN data with confidence scores</li>
                    <li>Source tracking (manual, scraper, user)</li>
                    <li>Verification status and timestamps</li>
                    <li>Coverage and quality metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        💡 Add ?scraper_dashboard=true to URL to access this panel
      </div>
    </div>
  );
}