'use client';

import { useState } from 'react';
import {
  searchProducts,
  getProductByASIN,
  getAPIStatus,
  AmazonProduct
} from '@/utils/amazonProductAPI';

export default function APITestPage() {
  const [searchQuery, setSearchQuery] = useState('Bell Z20 MIPS helmet');
  const [asin, setAsin] = useState('B07ZZLCBS5');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AmazonProduct[]>([]);
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState(getAPIStatus());

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const searchResults = await searchProducts(searchQuery, { maxResults: 5 });
      setResults(searchResults.products);
      if (!searchResults.products.length) {
        setError('No products found');
      }
    } catch (err) {
      setError(`Search error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleASINLookup = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const product = await getProductByASIN(asin);
      if (product) {
        setResults([product]);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError(`ASIN lookup error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Refresh API status
  const refreshStatus = () => {
    setApiStatus(getAPIStatus());
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Amazon PA-API Test Page</h1>

      {/* API Status */}
      <div className="bg-gray-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">API Configuration Status</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Overall Status: </span>
            <span className={`px-2 py-1 rounded ${apiStatus.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {apiStatus.configured ? '✅ Configured' : '❌ Not Configured'}
            </span>
          </div>
          <div>
            <span className="font-medium">Access Key: </span>
            <span className={apiStatus.hasAccessKey ? 'text-green-600' : 'text-red-600'}>
              {apiStatus.hasAccessKey ? '✅ Set' : '❌ Missing (Check .env.local)'}
            </span>
          </div>
          <div>
            <span className="font-medium">Secret Key: </span>
            <span className={apiStatus.hasSecretKey ? 'text-green-600' : 'text-red-600'}>
              {apiStatus.hasSecretKey ? '✅ Set' : '❌ Missing (Check .env.local)'}
            </span>
          </div>
          <div>
            <span className="font-medium">Affiliate Tag: </span>
            <span className="text-gray-700">{apiStatus.partnerTag}</span>
          </div>
        </div>
        <button
          onClick={refreshStatus}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Status
        </button>
      </div>

      {/* Search Test */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Products</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* ASIN Lookup Test */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Get Product by ASIN</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            placeholder="Enter ASIN"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleASINLookup}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Get Product'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Results:</h2>
          {results.map((product) => (
            <div key={product.asin} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-2">{product.title}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ASIN: </span>
                  <span className="font-mono">{product.asin}</span>
                </div>
                <div>
                  <span className="font-medium">Price: </span>
                  <span className="text-green-600 font-bold">
                    {product.price?.displayAmount || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Availability: </span>
                  <span>{product.availability || 'Unknown'}</span>
                </div>
                <div>
                  <span className="font-medium">Prime: </span>
                  <span>{product.isPrime ? '✅ Yes' : '❌ No'}</span>
                </div>
                {product.rating && (
                  <div>
                    <span className="font-medium">Rating: </span>
                    <span>{product.rating} / 5</span>
                  </div>
                )}
                {product.imageUrl && (
                  <div className="col-span-2">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="max-h-48 object-contain"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <a
                    href={product.detailPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    View on Amazon
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!apiStatus.configured && (
        <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <h3 className="font-bold mb-2">⚠️ API Not Configured</h3>
          <p>To use the Amazon Product Advertising API:</p>
          <ol className="list-decimal list-inside mt-2">
            <li>Edit <code className="font-mono bg-gray-200 px-1">.env.local</code></li>
            <li>Replace <code className="font-mono bg-gray-200 px-1">YOUR_ACCESS_KEY_HERE</code> with your actual Access Key</li>
            <li>Replace <code className="font-mono bg-gray-200 px-1">YOUR_SECRET_KEY_HERE</code> with your actual Secret Key</li>
            <li>Restart the development server</li>
          </ol>
          <p className="mt-2 text-sm">Currently using mock data for testing.</p>
        </div>
      )}
    </div>
  );
}