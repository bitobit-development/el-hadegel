/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml with all pages for search engines
 */

import { MetadataRoute } from 'next'
import { getMKs } from '@/app/actions/mk-actions'
import { getLatestNewsPosts } from '@/app/actions/news-actions'
import { slugify } from '@/lib/seo-utils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/coalition`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/opposition`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Position filter pages
  const positionRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/position/support`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/position/against`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/position/neutral`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Dynamic MK pages
  try {
    const mks = await getMKs()
    const mkRoutes: MetadataRoute.Sitemap = mks.map((mk) => ({
      url: `${SITE_URL}/mk/${mk.id}/${slugify(mk.nameHe)}`,
      lastModified: mk.updatedAt ? new Date(mk.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Faction pages
    const factions = Array.from(new Set(mks.map((mk) => mk.faction)))
    const factionRoutes: MetadataRoute.Sitemap = factions.map((faction) => ({
      url: `${SITE_URL}/faction/${slugify(faction)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // News posts
    const newsPosts = await getLatestNewsPosts(100)
    const newsRoutes: MetadataRoute.Sitemap = newsPosts.map((post) => ({
      url: `${SITE_URL}/news/${post.id}`,
      lastModified: new Date(post.postedAt),
      changeFrequency: 'never' as const,
      priority: 0.6,
    }))

    return [
      ...staticRoutes,
      ...positionRoutes,
      ...mkRoutes,
      ...factionRoutes,
      ...newsRoutes,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static routes if dynamic content fails
    return [...staticRoutes, ...positionRoutes]
  }
}
