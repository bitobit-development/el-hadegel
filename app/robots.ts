/**
 * Robots.txt Configuration
 * Controls search engine crawler access to the site
 */

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin/', '/api/'],
        crawlDelay: 2,
      },
      // Block AI scrapers from using content for training
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
