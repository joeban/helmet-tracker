import { MetadataRoute } from 'next'
import { HELMETS } from '@/data/helmets'
import { generateHelmetSlug } from '@/utils/helmet-slug'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://helmetscore.com'
  const currentDate = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Category pages for SEO
  const categories = [...new Set(HELMETS.map(helmet => helmet.category))]
  const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
    url: `${baseUrl}/category/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Brand pages for SEO
  const brands = [...new Set(HELMETS.map(helmet => helmet.brand))]
  const brandPages: MetadataRoute.Sitemap = brands.map(brand => ({
    url: `${baseUrl}/brand/${encodeURIComponent(brand.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Individual helmet pages for maximum SEO coverage
  const helmetPages: MetadataRoute.Sitemap = HELMETS.map(helmet => ({
    url: `${baseUrl}/helmet/${generateHelmetSlug(helmet.brand, helmet.name)}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: helmet.star_rating >= 4 ? 0.8 : 0.6, // Higher priority for VT recommended helmets
  }))

  // Safety score range pages
  const safetyRangePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/safety-score/excellent`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/safety-score/good`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/safety-score/fair`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]

  // Combine all pages
  return [
    ...staticPages,
    ...categoryPages,
    ...brandPages,
    ...safetyRangePages,
    ...helmetPages, // Now including all 281+ helmet detail pages
  ]
}