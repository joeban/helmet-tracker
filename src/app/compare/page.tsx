import { Suspense } from 'react';
import Link from 'next/link';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import ComparisonPageClient from './ComparisonPageClient';

export const metadata = {
  title: 'Helmet Comparison Tool - Compare Safety Ratings & Prices | HelmetScore',
  description: 'Compare bicycle helmets side by side with Virginia Tech safety ratings, pricing, and features. Make informed decisions with our comprehensive comparison tool.',
  keywords: 'helmet comparison, bicycle helmet compare, safety rating comparison, Virginia Tech STAR, helmet features comparison',
  openGraph: {
    title: 'Compare Bicycle Helmets - Safety Ratings & Prices',
    description: 'Side-by-side comparison of bicycle helmets with Virginia Tech safety ratings and real-time pricing data.',
    type: 'website',
  },
};

interface ComparePageProps {
  searchParams: { helmets?: string };
}

function ComparisonPageContent({ searchParams }: ComparePageProps) {
  const helmetsParam = searchParams.helmets;
  let preselectedHelmets: Helmet[] = [];

  if (helmetsParam) {
    const helmetIds = helmetsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    preselectedHelmets = HELMETS.filter(helmet => helmetIds.includes(helmet.id));
  }

  return <ComparisonPageClient preselectedHelmets={preselectedHelmets} allHelmets={HELMETS} />;
}

export default function ComparePage({ searchParams }: ComparePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-gray-500">
                    Home
                  </Link>
                </li>
                <li>
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <span className="text-gray-500">Compare Helmets</span>
                </li>
              </ol>
            </nav>

            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">Helmet Comparison Tool</h1>
              <p className="mt-2 text-lg text-gray-600">
                Compare bicycle helmets side by side with Virginia Tech safety ratings, pricing, and features
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ComparisonPageContent searchParams={searchParams} />
        </Suspense>
      </div>

      {/* SEO Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-white">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use the Helmet Comparison Tool</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Safety Ratings</h3>
              <p className="text-gray-600 mb-4">
                Our comparison tool uses Virginia Tech&apos;s STAR safety rating system to help you identify the safest helmets.
                Lower safety scores indicate better protection in real-world crash scenarios.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Price Comparison</h3>
              <p className="text-gray-600 mb-4">
                Compare real-time pricing from multiple retailers to find the best deals. Our system tracks price
                history and identifies when helmets are on sale.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Analysis</h3>
              <p className="text-gray-600 mb-4">
                Side-by-side comparison of helmet features including MIPS technology, ventilation, weight,
                and category specifications to help you make informed decisions.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share & Export</h3>
              <p className="text-gray-600">
                Generate shareable comparison links or export detailed comparison data for further analysis.
                Perfect for sharing with friends or keeping records of your research.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}