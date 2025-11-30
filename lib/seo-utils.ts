/**
 * SEO Utility Functions
 * Helper functions for generating meta tags, structured data, and SEO optimization
 */

import type { Metadata } from 'next'
import type { MKData } from '@/types/mk'

// Base URL for the site
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'
export const SITE_NAME = 'אל הדגל'
export const SITE_NAME_EN = 'EL HADEGEL'

// Primary SEO Keywords
export const PRIMARY_KEYWORDS = [
  'חוק הגיוס',
  'עמדות חברי כנסת',
  'גיוס חרדים',
  'קואליציה',
  'אופוזיציה',
  'מעקב הצבעות כנסת',
]

// Site Description
export const SITE_DESCRIPTION =
  'מעקב בזמן אמת אחר עמדות 120 חברי הכנסת בחוק גיוס חרדים. סינון לפי מפלגה, קואליציה ועמדה. עדכונים שוטפים והיסטוריית תצהירים.'

/**
 * Generate homepage metadata
 */
export function generateHomeMetadata(): Metadata {
  const title = 'אל הדגל - מעקב אחר עמדות חברי כנסת בחוק הגיוס'
  const description = SITE_DESCRIPTION

  return {
    title,
    description,
    keywords: PRIMARY_KEYWORDS,
    openGraph: {
      title: 'אל הדגל - מעקב עמדות חברי כנסת בחוק הגיוס',
      description: '120 חברי כנסת, 3 עמדות, מעקב בזמן אמת. גלה איפה חבר הכנסת שלך עומד בחוק גיוס חרדים',
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: 'he_IL',
      images: [
        {
          url: `${SITE_URL}/og-image-homepage.jpg`,
          width: 1200,
          height: 630,
          alt: 'אל הדגל - מעקב חוק הגיוס',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'אל הדגל - מעקב חוק הגיוס',
      description: 'מעקב בזמן אמת אחר עמדות חברי כנסת בחוק גיוס חרדים',
      images: [`${SITE_URL}/twitter-card-homepage.jpg`],
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        'he-IL': SITE_URL,
      },
    },
  }
}

/**
 * Generate MK page metadata
 */
export function generateMKMetadata(mk: MKData): Metadata {
  const positionText = getPositionText(mk.position)
  const title = `${mk.name} - עמדה בחוק הגיוס | ${SITE_NAME}`
  const description = `עמדת ${mk.name} (${mk.faction}) בחוק גיוס חרדים: ${positionText}. היסטוריית תצהירים, הצבעות ופעילות ברשתות חברתיות.`

  return {
    title,
    description,
    keywords: [
      mk.name,
      mk.faction,
      'חוק הגיוס',
      'עמדה',
      positionText,
      'חבר כנסת',
    ],
    openGraph: {
      title: `${mk.name} - עמדה בחוק הגיוס`,
      description,
      type: 'profile',
      url: `${SITE_URL}/mk/${mk.id}`,
      siteName: SITE_NAME,
      locale: 'he_IL',
      images: [
        {
          url: mk.imageUrl || `${SITE_URL}/images/mk/${mk.id}.jpg`,
          width: 400,
          height: 400,
          alt: `${mk.name}, חבר כנסת מטעם ${mk.faction}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${mk.name} - עמדה בחוק הגיוס`,
      description,
      images: [mk.imageUrl || `${SITE_URL}/images/mk/${mk.id}.jpg`],
    },
    alternates: {
      canonical: `${SITE_URL}/mk/${mk.id}`,
    },
  }
}

/**
 * Generate faction page metadata
 */
export function generateFactionMetadata(
  factionName: string,
  supportCount: number,
  againstCount: number,
  neutralCount: number
): Metadata {
  const title = `${factionName} - עמדות חברי הכנסת בחוק הגיוס | ${SITE_NAME}`
  const description = `כל חברי כנסת ${factionName} ועמדותיהם בחוק גיוס חרדים. ${supportCount} תומכים, ${againstCount} מתנגדים, ${neutralCount} מתנדנדים. מעקב עדכני.`

  return {
    title,
    description,
    keywords: [factionName, 'חוק הגיוס', 'עמדות', 'חברי כנסת'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/faction/${slugify(factionName)}`,
      siteName: SITE_NAME,
      locale: 'he_IL',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/faction/${slugify(factionName)}`,
    },
  }
}

/**
 * Generate position filter page metadata
 */
export function generatePositionMetadata(
  position: 'SUPPORT' | 'AGAINST' | 'NEUTRAL'
): Metadata {
  const positionTexts = {
    SUPPORT: { title: 'תומכים', description: 'תומכים בחוק הגיוס' },
    AGAINST: { title: 'מתנגדים', description: 'מתנגדים לחוק הגיוס' },
    NEUTRAL: { title: 'מתנדנדים', description: 'מתנדנדים בחוק הגיוס' },
  }

  const { title: posTitle, description: posDesc } = positionTexts[position]
  const title = `חברי כנסת ${posTitle} - ${SITE_NAME}`
  const description = `רשימת כל חברי הכנסת ה${posDesc}. מעקב עדכני ושוטף אחר עמדות וההצבעות.`

  return {
    title,
    description,
    keywords: ['חוק הגיוס', posTitle, 'חברי כנסת', 'עמדות'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/position/${position.toLowerCase()}`,
      siteName: SITE_NAME,
      locale: 'he_IL',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/position/${position.toLowerCase()}`,
    },
  }
}

/**
 * Get position text in Hebrew
 */
export function getPositionText(
  position: 'SUPPORT' | 'AGAINST' | 'NEUTRAL'
): string {
  const positions = {
    SUPPORT: 'תומך',
    AGAINST: 'מתנגד',
    NEUTRAL: 'מתנדנד',
  }
  return positions[position]
}

/**
 * Slugify Hebrew text (convert to URL-friendly format)
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0590-\u05FF\w-]/g, '') // Keep Hebrew, alphanumeric, and hyphens
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Generate image alt text for MK
 */
export function generateMKImageAlt(mk: MKData): string {
  const position = getPositionText(mk.position)
  return `${mk.name}, חבר כנסת מטעם ${mk.faction}, עמדה בחוק הגיוס: ${position}`
}

/**
 * Generate breadcrumb JSON-LD for MK page
 */
export function generateMKBreadcrumb(mk: MKData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'דף הבית',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: mk.faction,
        item: `${SITE_URL}/faction/${slugify(mk.faction)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: mk.name,
        item: `${SITE_URL}/mk/${mk.id}`,
      },
    ],
  }
}

/**
 * Generate FAQ schema for common questions
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
