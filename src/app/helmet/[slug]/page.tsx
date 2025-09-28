import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HELMETS } from '@/data/helmets';
import { Helmet } from '@/types/helmet';
import {
  findHelmetBySlug,
  getAllHelmetSlugs,
  getHelmetDisplayTitle,
  getHelmetSEODescription,
  generateHelmetSlug
} from '@/utils/helmet-slug';
import { getHelmetAmazonInfo, getHelmetFallbackImage } from '@/utils/amazonImages';
import HelmetDetailTracker, { TrackedAmazonButton } from '@/components/HelmetDetailTracker';
import PriceTracker from '@/components/PriceTracker';
import { AddToComparisonButton } from '@/components/ComparisonWidget';
import AmazonButton from '@/components/AmazonButton';

interface HelmetPageProps {
  params: { slug: string };
}

// Generate static params for all helmets
export async function generateStaticParams() {
  const slugs = getAllHelmetSlugs(HELMETS);
  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for each helmet page
export async function generateMetadata({ params }: HelmetPageProps): Promise<Metadata> {
  const helmet = findHelmetBySlug(HELMETS, params.slug);

  if (!helmet) {
    return {
      title: 'Helmet Not Found',
      description: 'The requested helmet could not be found.',
    };
  }

  const title = getHelmetDisplayTitle(helmet);
  const description = getHelmetSEODescription(helmet);
  const canonicalUrl = `https://helmetscore.com/helmet/${params.slug}`;

  return {
    title: `${title} - Safety Rating & Review | HelmetScore`,
    description,
    keywords: [
      helmet.brand.toLowerCase(),
      helmet.name.toLowerCase(),
      'helmet review',
      'safety rating',
      'Virginia Tech STAR',
      helmet.category.toLowerCase(),
      'bike helmet',
      'cycling safety'
    ].join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} - Virginia Tech Safety Rating`,
      description,
      url: canonicalUrl,
      siteName: 'HelmetScore',
      type: 'article',
      images: [
        {
          url: helmet.image_url || getHelmetFallbackImage(helmet.brand, helmet.category),
          width: 1200,
          height: 630,
          alt: `${title} helmet safety review`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Safety Rating`,
      description,
      images: [helmet.image_url || getHelmetFallbackImage(helmet.brand, helmet.category)],
    },
  };
}

// Helper function to get safety score color and description
function getSafetyScoreInfo(score: number, stars: number) {
  if (stars === 5) {
    return {
      color: 'text-green-700 bg-green-50 border-green-500',
      badge: 'bg-green-100 text-green-800',
      description: 'Excellent Safety - Virginia Tech Recommended'
    };
  } else if (stars === 4) {
    return {
      color: 'text-blue-700 bg-blue-50 border-blue-500',
      badge: 'bg-blue-100 text-blue-800',
      description: 'Very Good Safety - Virginia Tech Recommended'
    };
  } else if (stars === 3) {
    return {
      color: 'text-yellow-700 bg-yellow-50 border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      description: 'Good Safety'
    };
  } else {
    return {
      color: 'text-orange-700 bg-orange-50 border-orange-500',
      badge: 'bg-orange-100 text-orange-800',
      description: 'Fair Safety'
    };
  }
}

// Helper function to get similar helmets
function getSimilarHelmets(currentHelmet: Helmet): Helmet[] {
  return HELMETS
    .filter(h =>
      h.id !== currentHelmet.id &&
      (h.category === currentHelmet.category || h.brand === currentHelmet.brand)
    )
    .sort((a, b) => {
      // Prioritize same category, then by star rating
      if (a.category === currentHelmet.category && b.category !== currentHelmet.category) return -1;
      if (b.category === currentHelmet.category && a.category !== currentHelmet.category) return 1;
      return b.star_rating - a.star_rating;
    })
    .slice(0, 4);
}

export default function HelmetPage({ params }: HelmetPageProps) {
  const helmet = findHelmetBySlug(HELMETS, params.slug);

  if (!helmet) {
    notFound();
  }

  const safetyInfo = getSafetyScoreInfo(helmet.safety_score, helmet.star_rating);
  const amazonInfo = getHelmetAmazonInfo(helmet.brand, helmet.name);
  const similarHelmets = getSimilarHelmets(helmet);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Advanced conversion tracking */}
      <HelmetDetailTracker helmet={helmet} />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/category/${helmet.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600">
              {helmet.category}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{getHelmetDisplayTitle(helmet)}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="aspect-square bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                {helmet.image_url ? (
                  <Image
                    src={helmet.image_url}
                    alt={`${getHelmetDisplayTitle(helmet)} helmet`}
                    width={400}
                    height={400}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {helmet.brand} {helmet.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{helmet.category} Helmet</p>
                  </div>
                )}
              </div>

              {/* Amazon Purchase CTA with A/B Testing */}
              <div className="mb-4">
                <AmazonButton
                  helmet={helmet}
                  testId="amazon_button_color_test_1"
                  size="lg"
                  className="w-full"
                />
              </div>

              {/* Comparison Button */}
              <div className="mt-4">
                <AddToComparisonButton
                  helmet={helmet}
                  source="detail_page"
                  className="w-full"
                />
              </div>

              {/* Price Tracking Component */}
              <div className="mt-6">
                <PriceTracker helmet={helmet} />
              </div>
            </div>
          </div>

          {/* Right Column - Details and Specs */}
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getHelmetDisplayTitle(helmet)}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-slate-800 px-3 py-1 rounded-full text-sm font-medium">
                  {helmet.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${safetyInfo.badge}`}>
                  {helmet.star_rating} Stars
                </span>
              </div>
              <p className="text-gray-600 text-lg">{safetyInfo.description}</p>
            </div>

            {/* Safety Score */}
            <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${safetyInfo.color}`}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Virginia Tech Safety Rating</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{helmet.safety_score}</div>
                  <div className="text-sm text-gray-600">STAR Safety Score</div>
                  <div className="text-xs text-gray-500 mt-1">(Lower is safer)</div>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-6 h-6 ${i < helmet.star_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">{helmet.star_rating} out of 5 stars</div>
                </div>
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">${helmet.min_price}</div>
                  <div className="text-sm text-gray-600">Starting price</div>
                </div>
                <div>
                  <div className="text-lg text-gray-900">${helmet.vt_test_price}</div>
                  <div className="text-sm text-gray-600">VT test price</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <strong>{helmet.available_count}</strong> of <strong>{helmet.listing_count}</strong> retailers have this helmet in stock
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Brand</dt>
                  <dd className="text-sm text-gray-900">{helmet.brand}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Model</dt>
                  <dd className="text-sm text-gray-900">{helmet.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Category</dt>
                  <dd className="text-sm text-gray-900">{helmet.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Safety Technology</dt>
                  <dd className="text-sm text-gray-900">
                    {helmet.name.toUpperCase().includes('MIPS') ? 'MIPS' : 'Standard'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600">Price Range</dt>
                  <dd className="text-sm text-gray-900">
                    ${helmet.min_price} - ${helmet.max_price}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Similar Helmets Section */}
        {similarHelmets.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Helmets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarHelmets.map((similarHelmet) => {
                const similarSlug = generateHelmetSlug(similarHelmet.brand, similarHelmet.name);
                const similarSafetyInfo = getSafetyScoreInfo(similarHelmet.safety_score, similarHelmet.star_rating);

                return (
                  <Link
                    key={similarHelmet.id}
                    href={`/helmet/${similarSlug}`}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      {similarHelmet.image_url ? (
                        <Image
                          src={similarHelmet.image_url}
                          alt={`${similarHelmet.brand} ${similarHelmet.name}`}
                          width={120}
                          height={120}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          sizes="120px"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                      {similarHelmet.brand} {similarHelmet.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${similarSafetyInfo.badge}`}>
                        {similarHelmet.star_rating}★
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ${similarHelmet.min_price}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}