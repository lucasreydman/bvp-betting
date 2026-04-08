import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/scoring-logic`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}