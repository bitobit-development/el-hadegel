/**
 * JSON-LD Structured Data Component
 * Injects structured data (Schema.org) into pages for SEO
 */

import Script from 'next/script'

interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[]
}

/**
 * Renders JSON-LD structured data in a script tag
 * Supports single schema or array of schemas
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id={`jsonld-${JSON.stringify(data).substring(0, 20)}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
      strategy="beforeInteractive"
    />
  )
}

/**
 * Organization Schema for homepage
 */
export function OrganizationSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'אל הדגל',
    alternateName: 'EL HADEGEL',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'פלטפורמה למעקב אחר עמדות חברי כנסת בחוק גיוס חרדים',
    foundingDate: '2025',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IL',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'Hebrew',
    },
  }

  return <JsonLd data={schema} />
}

/**
 * WebSite Schema for homepage
 */
export function WebSiteSchema() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'אל הדגל',
    url: siteUrl,
    inLanguage: 'he-IL',
    description: 'מעקב אחר עמדות חברי כנסת בחוק גיוס חרדים',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <JsonLd data={schema} />
}

/**
 * Person Schema for MK pages
 */
export function PersonSchema({
  name,
  jobTitle = 'חבר כנסת',
  worksFor,
  image,
  description,
  url,
  sameAs,
}: {
  name: string
  jobTitle?: string
  worksFor: string
  image?: string
  description?: string
  url?: string
  sameAs?: string[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle,
    worksFor: {
      '@type': 'Organization',
      name: worksFor,
    },
    memberOf: {
      '@type': 'Organization',
      name: 'הכנסת ה-25',
      url: 'https://knesset.gov.il',
    },
    ...(image && { image }),
    ...(description && { description }),
    ...(url && { url }),
    ...(sameAs && { sameAs }),
  }

  return <JsonLd data={schema} />
}

/**
 * BreadcrumbList Schema
 */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={schema} />
}

/**
 * ItemList Schema for MK listings
 */
export function ItemListSchema({
  name,
  description,
  items,
}: {
  name: string
  description: string
  items: { name: string; url: string }[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: item.name,
        url: item.url,
      },
    })),
  }

  return <JsonLd data={schema} />
}

/**
 * NewsArticle Schema for news posts
 */
export function NewsArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  url,
}: {
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  url: string
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://el-hadegel.vercel.app'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    ...(image && { image }),
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: 'אל הדגל',
    },
    publisher: {
      '@type': 'Organization',
      name: 'אל הדגל',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: 'חוק הגיוס',
    keywords: 'חוק הגיוס, כנסת, גיוס חרדים',
  }

  return <JsonLd data={schema} />
}

/**
 * FAQ Schema
 */
export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[]
}) {
  const schema = {
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

  return <JsonLd data={schema} />
}
