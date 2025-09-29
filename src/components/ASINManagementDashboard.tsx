'use client';

import { useState, useEffect } from 'react';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import {
  ASINDiscoveryManager,
  ASINCandidate,
  generateSearchQueries,
  isValidASIN,
  extractASINFromURL,
  buildAmazonURL,
  getBestAmazonURL
} from '@/utils/amazonASINDiscovery';

interface ASINManagementDashboardProps {
  className?: string;
}

export default function ASINManagementDashboard({ className = '' }: ASINManagementDashboardProps) {
  const [manager] = useState(() => ASINDiscoveryManager.getInstance());
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'discover' | 'contribute' | 'verify'>('overview');
  const [selectedHelmet, setSelectedHelmet] = useState<Helmet | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [userSubmission, setUserSubmission] = useState({
    helmetId: '',
    amazonUrl: '',
    productTitle: ''
  });

  useEffect(() => {
    // Show in development or with query param
    const shouldShow = process.env.NODE_ENV === 'development' ||
                     window.location.search.includes('asin_dashboard=true');
    setIsVisible(shouldShow);

    if (shouldShow) {
      loadData();
    }
  }, []);

  const loadData = () => {
    manager.loadDatabase();
    const stats = manager.getStatistics();
    setStatistics(stats);
  };

  const handleUserSubmission = () => {
    if (!userSubmission.helmetId || !userSubmission.amazonUrl) {
      alert('Please fill in all required fields');
      return;
    }

    const asin = extractASINFromURL(userSubmission.amazonUrl);
    if (!asin) {
      alert('Could not extract ASIN from Amazon URL. Please check the URL format.');
      return;
    }

    const success = manager.submitUserASIN(
      parseInt(userSubmission.helmetId),
      asin,
      userSubmission.amazonUrl,
      userSubmission.productTitle || 'User submitted'
    );

    if (success) {
      alert('ASIN submitted successfully! Thank you for contributing.');
      setUserSubmission({ helmetId: '', amazonUrl: '', productTitle: '' });
      loadData();
    } else {
      alert('Invalid ASIN format. Please check the Amazon URL.');
    }
  };

  const verifyASIN = (helmetId: number, asin: string, verified: boolean) => {
    manager.verifyASIN(helmetId, asin, verified);
    loadData();
  };

  const exportDatabase = () => {
    const data = manager.exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helmet-asins-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors z-40 text-sm font-medium"
      >
        🔗 ASIN Manager
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl z-50 max-h-96 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">🔗 Amazon ASIN Manager</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportDatabase}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Export
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
          { id: 'discover', label: '🔍 Discover' },
          { id: 'contribute', label: '➕ Contribute' },
          { id: 'verify', label: '✅ Verify' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
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
              <h4 className="font-semibold text-gray-800 mb-2">ASIN Coverage Statistics</h4>
              {statistics && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded p-3">
                    <div className="text-2xl font-bold text-blue-600">{statistics.helmetsWithASINs}</div>
                    <div className="text-gray-600">Helmets with ASINs</div>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{statistics.verifiedASINs}</div>
                    <div className="text-gray-600">Verified ASINs</div>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <div className="text-2xl font-bold text-purple-600">{statistics.coveragePercentage.toFixed(1)}%</div>
                    <div className="text-gray-600">Coverage</div>
                  </div>
                  <div className="bg-orange-50 rounded p-3">
                    <div className="text-2xl font-bold text-orange-600">{statistics.totalHelmets - statistics.helmetsWithASINs}</div>
                    <div className="text-gray-600">Missing ASINs</div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-600">
              <strong>Goal:</strong> Get direct Amazon product links for all 281 helmets to increase conversion rates by 40-60%.
            </div>
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🔍 Helmet ASIN Discovery</h4>
              <select
                value={selectedHelmet?.id || ''}
                onChange={(e) => {
                  const helmet = HELMETS.find(h => h.id === parseInt(e.target.value));
                  setSelectedHelmet(helmet || null);
                }}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Select a helmet to discover ASINs...</option>
                {HELMETS.slice(0, 50).map(helmet => (
                  <option key={helmet.id} value={helmet.id}>
                    {helmet.brand} {helmet.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedHelmet && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded p-3">
                  <div className="font-medium">{selectedHelmet.brand} {selectedHelmet.name}</div>
                  <div className="text-sm text-gray-600">{selectedHelmet.category} • ${selectedHelmet.min_price}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Suggested Search Queries:</div>
                  <div className="space-y-1">
                    {generateSearchQueries(selectedHelmet).slice(0, 3).map((query, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <span className="text-sm text-gray-700">{query}</span>
                        <a
                          href={`https://amazon.com/s?k=${encodeURIComponent(query)}&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'helmetscore-20'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                        >
                          Search Amazon
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Current ASINs:</div>
                  {(() => {
                    const asins = manager.getASINs(selectedHelmet.id);
                    if (asins.length === 0) {
                      return <div className="text-sm text-gray-500">No ASINs found yet</div>;
                    }
                    return (
                      <div className="space-y-1">
                        {asins.map((asin, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                            <div>
                              <span className="text-sm font-mono">{asin.asin}</span>
                              {asin.verified && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Verified</span>}
                            </div>
                            <a
                              href={buildAmazonURL(asin.asin)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contribute' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">➕ Submit Amazon ASIN</h4>
              <p className="text-sm text-gray-600 mb-3">
                Found a helmet on Amazon? Help improve our database by submitting the product link!
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Helmet</label>
                <select
                  value={userSubmission.helmetId}
                  onChange={(e) => setUserSubmission(prev => ({ ...prev, helmetId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Select helmet...</option>
                  {HELMETS.slice(0, 50).map(helmet => (
                    <option key={helmet.id} value={helmet.id}>
                      {helmet.brand} {helmet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Product URL *</label>
                <input
                  type="url"
                  value={userSubmission.amazonUrl}
                  onChange={(e) => setUserSubmission(prev => ({ ...prev, amazonUrl: e.target.value }))}
                  placeholder="https://amazon.com/dp/B08XYZ123..."
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title (optional)</label>
                <input
                  type="text"
                  value={userSubmission.productTitle}
                  onChange={(e) => setUserSubmission(prev => ({ ...prev, productTitle: e.target.value }))}
                  placeholder="Giro Synthe MIPS Helmet..."
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <button
                onClick={handleUserSubmission}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Submit ASIN
              </button>
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">✅ Verify ASINs</h4>
              <p className="text-sm text-gray-600 mb-3">
                Check submitted ASINs and mark them as verified or invalid.
              </p>
            </div>

            <div className="space-y-2">
              {HELMETS.slice(0, 10).map(helmet => {
                const asins = manager.getASINs(helmet.id);
                const unverified = asins.filter(a => !a.verified);

                if (unverified.length === 0) return null;

                return (
                  <div key={helmet.id} className="border rounded p-3">
                    <div className="font-medium text-sm mb-2">{helmet.brand} {helmet.name}</div>
                    {unverified.map((asin, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 mb-1">
                        <div>
                          <span className="text-sm font-mono">{asin.asin}</span>
                          <span className="ml-2 text-xs text-gray-500">({asin.source})</span>
                        </div>
                        <div className="space-x-1">
                          <button
                            onClick={() => verifyASIN(helmet.id, asin.asin, true)}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          >
                            ✓ Verify
                          </button>
                          <button
                            onClick={() => verifyASIN(helmet.id, asin.asin, false)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            ✗ Invalid
                          </button>
                          <a
                            href={buildAmazonURL(asin.asin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Check
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        💡 Add ?asin_dashboard=true to URL to access this panel
      </div>
    </div>
  );
}