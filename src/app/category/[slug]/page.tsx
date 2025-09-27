import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HELMETS } from '@/data/helmets'
import HelmetGrid from '@/components/HelmetGrid'

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = [...new Set(HELMETS.map(helmet => helmet.category))]

  return categories.map(category => ({
    slug: category.toLowerCase().replace(/\s+/g, '-')
  }))
}

// Get category from slug
function getCategoryFromSlug(slug: string): string | null {
  const categories = [...new Set(HELMETS.map(helmet => helmet.category))]
  return categories.find(cat =>
    cat.toLowerCase().replace(/\s+/g, '-') === slug
  ) || null
}

// Generate metadata for each category page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = getCategoryFromSlug(params.slug)

  if (!category) {
    return {
      title: 'Category Not Found - HelmetScore',
      description: 'The requested helmet category was not found.'
    }
  }

  const categoryHelmets = HELMETS.filter(helmet => helmet.category === category)
  const avgSafetyScore = categoryHelmets.reduce((sum, h) => sum + h.safety_score, 0) / categoryHelmets.length
  const priceRange = {
    min: Math.min(...categoryHelmets.map(h => h.min_price)),
    max: Math.max(...categoryHelmets.map(h => h.max_price))
  }

  return {
    title: `${category} Bike Helmets - Safety Ratings & Reviews | HelmetScore`,
    description: `Compare ${categoryHelmets.length} ${category.toLowerCase()} bike helmets with Virginia Tech STAR safety ratings. Average safety score: ${avgSafetyScore.toFixed(1)}. Prices from $${priceRange.min} to $${priceRange.max}.`,
    keywords: [
      `${category.toLowerCase()} bike helmet`,
      `${category.toLowerCase()} cycling helmet`,
      `${category.toLowerCase()} helmet safety`,
      `${category.toLowerCase()} helmet ratings`,
      'Virginia Tech STAR',
      'bicycle helmet safety',
      'cycling safety',
      'helmet comparison'
    ].join(', '),
    openGraph: {
      title: `${category} Bike Helmets - Safety Ratings & Reviews`,
      description: `Compare ${categoryHelmets.length} ${category.toLowerCase()} bike helmets with Virginia Tech STAR safety ratings. Find the safest ${category.toLowerCase()} helmet for your rides.`,
      url: `https://helmetscore.com/category/${params.slug}`,
      type: 'website',
    },
    twitter: {
      title: `${category} Bike Helmets - HelmetScore`,
      description: `${categoryHelmets.length} ${category.toLowerCase()} helmets with Virginia Tech safety ratings`,
    },
    alternates: {
      canonical: `https://helmetscore.com/category/${params.slug}`,
    },
  }
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryFromSlug(params.slug)

  if (!category) {
    notFound()
  }

  const categoryHelmets = HELMETS.filter(helmet => helmet.category === category)
  const avgSafetyScore = categoryHelmets.reduce((sum, h) => sum + h.safety_score, 0) / categoryHelmets.length
  const topRatedHelmets = categoryHelmets
    .sort((a, b) => a.safety_score - b.safety_score)
    .slice(0, 3)

  const priceRange = {
    min: Math.min(...categoryHelmets.map(h => h.min_price)),
    max: Math.max(...categoryHelmets.map(h => h.max_price))
  }

  // Structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category} Bike Helmets`,
    "description": `Comprehensive collection of ${category.toLowerCase()} bicycle helmets with Virginia Tech STAR safety ratings`,
    "url": `https://helmetscore.com/category/${params.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": categoryHelmets.length,
      "itemListElement": topRatedHelmets.map((helmet, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": `${helmet.brand} ${helmet.name}`,
          "category": helmet.category,
          "brand": {
            "@type": "Brand",
            "name": helmet.brand
          },
          "offers": {
            "@type": "Offer",
            "price": helmet.min_price,
            "priceCurrency": "USD",
            "availability": helmet.available_count > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": helmet.star_rating,
            "bestRating": 5,
            "worstRating": 1
          }
        }
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://helmetscore.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Categories",
          "item": "https://helmetscore.com/categories"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": category,
          "item": `https://helmetscore.com/category/${params.slug}`
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/" className="hover:text-blue-600">Home</a>
              <span>/</span>
              <a href="/categories" className="hover:text-blue-600">Categories</a>
              <span>/</span>
              <span className="text-gray-900">{category}</span>
            </div>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
              {category} Bike Helmets
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-6">
              Compare {categoryHelmets.length} {category.toLowerCase()} bicycle helmets with Virginia Tech STAR safety ratings
            </p>

            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-blue-600">{categoryHelmets.length}</div>
                <div className="text-sm text-gray-600">Helmets Tested</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-green-600">{avgSafetyScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Safety Score</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-purple-600">${priceRange.min}</div>
                <div className="text-sm text-gray-600">Starting Price</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-orange-600">{topRatedHelmets[0]?.safety_score}</div>
                <div className="text-sm text-gray-600">Best Safety Score</div>
              </div>
            </div>

            {/* Category Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-left">
              <h2 className="text-xl font-semibold text-slate-800 mb-3">About {category} Helmets</h2>
              <p className="text-gray-600 leading-relaxed">
                {getCategoryDescription(category)} All helmets in this category have been independently tested
                using Virginia Tech's STAR methodology, providing you with objective safety comparisons to help
                you choose the best protection for your {category.toLowerCase()} cycling activities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Helmet Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HelmetGrid helmets={categoryHelmets} />
      </main>
    </div>
  )
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'Road': 'Road cycling helmets are designed for speed and aerodynamics while maintaining excellent ventilation. They feature lightweight construction and streamlined profiles perfect for road racing, training rides, and long-distance cycling.',
    'All Mountain': 'All Mountain helmets provide enhanced protection for trail riding and more aggressive terrain. They typically offer extended coverage around the back of the head and temples while maintaining good ventilation for climbs.',
    'Urban': 'Urban cycling helmets are designed for city commuting and casual riding. They often feature enhanced visibility elements, integrated lights, and styling that transitions well from bike to office.',
    'Multi-sport': 'Multi-sport helmets are versatile options suitable for various cycling disciplines. They balance protection, ventilation, and comfort for riders who participate in different types of cycling activities.',
    'Full-Face': 'Full-face helmets provide maximum protection for downhill mountain biking and BMX. They feature complete face protection with integrated chin bars while maintaining visibility and breathability.',
  }

  return descriptions[category] || `${category} helmets are specialized for specific cycling activities and offer targeted protection and features for those use cases.`
}