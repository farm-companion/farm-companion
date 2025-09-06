// SEO Middleware for Enhanced Search Engine Optimization
// PuredgeOS 3.0 Compliant SEO Middleware

import { NextRequest, NextResponse } from 'next/server'
import { generateMetadata, generateFarmMetadata, generateProduceMetadata } from './seo-optimizer'

// SEO middleware for automatic meta tag injection
export function withSEOMiddleware<T extends any[]>(
  seoConfig: {
    title: string
    description: string
    keywords?: string[]
    canonical?: string
    ogImage?: string
    ogType?: 'website' | 'article' | 'product' | 'place'
    noindex?: boolean
    structuredData?: any
  }
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      // Add SEO headers
      const seoHeaders = generateSEOHeaders(seoConfig)
      
      // Add headers to response
      Object.entries(seoHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
  }
}

// Generate SEO headers
function generateSEOHeaders(config: {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product' | 'place'
  noindex?: boolean
}): Record<string, string> {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = '/og.jpg',
    ogType = 'website',
    noindex = false
  } = config

  const fullTitle = title.includes('Farm Companion') ? title : `${title} | Farm Companion`
  const canonicalUrl = canonical ? `https://www.farmcompanion.co.uk${canonical}` : 'https://www.farmcompanion.co.uk'
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `https://www.farmcompanion.co.uk${ogImage}`

  return {
    'X-SEO-Title': fullTitle,
    'X-SEO-Description': description,
    'X-SEO-Keywords': keywords.join(', '),
    'X-SEO-Canonical': canonicalUrl,
    'X-SEO-OG-Title': fullTitle,
    'X-SEO-OG-Description': description,
    'X-SEO-OG-Image': ogImageUrl,
    'X-SEO-OG-Type': ogType,
    'X-SEO-Twitter-Title': fullTitle,
    'X-SEO-Twitter-Description': description,
    'X-SEO-Twitter-Image': ogImageUrl,
    'X-SEO-Robots': noindex ? 'noindex,nofollow' : 'index,follow',
    'X-SEO-Theme-Color': '#00C2B2',
    'X-SEO-Color-Scheme': 'light dark'
  }
}

// Generate structured data middleware
export function withStructuredData<T extends any[]>(
  structuredDataGenerator: (request: NextRequest, ...args: T) => any
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      try {
        const structuredData = structuredDataGenerator(request, ...(args as unknown as T))
        
        if (structuredData) {
          response.headers.set('X-Structured-Data', JSON.stringify(structuredData))
        }
      } catch (error) {
        console.error('Error generating structured data:', error)
      }
      
      return response
    }
  }
}

// Generate breadcrumb middleware
export function withBreadcrumbs<T extends any[]>(
  breadcrumbGenerator: (request: NextRequest, ...args: T) => Array<{ name: string; url: string }>
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      try {
        const breadcrumbs = breadcrumbGenerator(request, ...(args as unknown as T))
        
        if (breadcrumbs && breadcrumbs.length > 0) {
          response.headers.set('X-Breadcrumbs', JSON.stringify(breadcrumbs))
        }
      } catch (error) {
        console.error('Error generating breadcrumbs:', error)
      }
      
      return response
    }
  }
}

// Generate FAQ middleware
export function withFAQ<T extends any[]>(
  faqGenerator: (request: NextRequest, ...args: T) => Array<{ question: string; answer: string }>
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      try {
        const faqs = faqGenerator(request, ...(args as unknown as T))
        
        if (faqs && faqs.length > 0) {
          response.headers.set('X-FAQ-Data', JSON.stringify(faqs))
        }
      } catch (error) {
        console.error('Error generating FAQ data:', error)
      }
      
      return response
    }
  }
}

// Generate local business middleware
export function withLocalBusiness<T extends any[]>(
  businessDataGenerator: (request: NextRequest, ...args: T) => {
    name: string
    description: string
    address: string
    phone?: string
    website?: string
    coordinates: { lat: number; lng: number }
    hours?: Array<{ day: string; open: string; close: string }>
    images?: Array<{ url: string; alt: string }>
  }
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      try {
        const businessData = businessDataGenerator(request, ...(args as unknown as T))
        
        if (businessData) {
          response.headers.set('X-Local-Business-Data', JSON.stringify(businessData))
        }
      } catch (error) {
        console.error('Error generating local business data:', error)
      }
      
      return response
    }
  }
}

// Generate organization middleware
export function withOrganization<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://www.farmcompanion.co.uk/#organization',
      name: 'Farm Companion',
      url: 'https://www.farmcompanion.co.uk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.farmcompanion.co.uk/og.jpg',
        width: 1200,
        height: 630
      },
      description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
      foundingDate: '2024',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'hello@farmcompanion.co.uk'
      },
      sameAs: [
        'https://twitter.com/farmcompanion',
        'https://facebook.com/farmcompanion'
      ]
    }
    
    response.headers.set('X-Organization-Data', JSON.stringify(organizationData))
    
    return response
  }
}

// Generate website middleware
export function withWebsite<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(request, ...args)
    
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://www.farmcompanion.co.uk/#website',
      url: 'https://www.farmcompanion.co.uk',
      name: 'Farm Companion',
      description: 'Discover authentic UK farm shops with fresh local produce, seasonal guides, and verified farm information.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.farmcompanion.co.uk/map?query={search_term_string}',
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@id': 'https://www.farmcompanion.co.uk/#organization'
      }
    }
    
    response.headers.set('X-Website-Data', JSON.stringify(websiteData))
    
    return response
  }
}

// Generate search action middleware
export function withSearchAction<T extends any[]>(
  searchUrl: string = '/map?query={search_term_string}'
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      const searchActionData = {
        '@context': 'https://schema.org',
        '@type': 'SearchAction',
        target: `https://www.farmcompanion.co.uk${searchUrl}`,
        'query-input': 'required name=search_term_string'
      }
      
      response.headers.set('X-Search-Action-Data', JSON.stringify(searchActionData))
      
      return response
    }
  }
}

// Generate collection page middleware
export function withCollectionPage<T extends any[]>(
  collectionData: {
    name: string
    description: string
    url: string
    numberOfItems: number
    items?: Array<{
      name: string
      url: string
      description?: string
    }>
  }
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      const collectionPageData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `https://www.farmcompanion.co.uk${collectionData.url}#collection`,
        url: `https://www.farmcompanion.co.uk${collectionData.url}`,
        name: collectionData.name,
        description: collectionData.description,
        isPartOf: { '@id': 'https://www.farmcompanion.co.uk/#website' },
        mainEntity: {
          '@type': 'ItemList',
          name: collectionData.name,
          numberOfItems: collectionData.numberOfItems,
          itemListOrder: 'http://schema.org/ItemListOrderAscending',
          itemListElement: collectionData.items?.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Thing',
              name: item.name,
              description: item.description,
              url: `https://www.farmcompanion.co.uk${item.url}`
            }
          })) || []
        }
      }
      
      response.headers.set('X-Collection-Page-Data', JSON.stringify(collectionPageData))
      
      return response
    }
  }
}

// Generate article middleware
export function withArticle<T extends any[]>(
  articleData: {
    headline: string
    description: string
    url: string
    author?: string
    publishedTime?: string
    modifiedTime?: string
    section?: string
    tags?: string[]
    images?: Array<{ url: string; alt: string }>
  }
) {
  return function<U extends any[]>(
    handler: (request: NextRequest, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const response = await handler(request, ...args)
      
      const articleStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `https://www.farmcompanion.co.uk${articleData.url}`,
        headline: articleData.headline,
        description: articleData.description,
        url: `https://www.farmcompanion.co.uk${articleData.url}`,
        author: {
          '@type': 'Organization',
          name: articleData.author || 'Farm Companion',
          url: 'https://www.farmcompanion.co.uk'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Farm Companion',
          url: 'https://www.farmcompanion.co.uk',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.farmcompanion.co.uk/og.jpg'
          }
        },
        datePublished: articleData.publishedTime || new Date().toISOString(),
        dateModified: articleData.modifiedTime || new Date().toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://www.farmcompanion.co.uk${articleData.url}`
        },
        ...(articleData.images && articleData.images.length > 0 && {
          image: articleData.images.map(img => ({
            '@type': 'ImageObject',
            url: img.url,
            caption: img.alt
          }))
        }),
        ...(articleData.section && { articleSection: articleData.section }),
        ...(articleData.tags && articleData.tags.length > 0 && { keywords: articleData.tags.join(', ') })
      }
      
      response.headers.set('X-Article-Data', JSON.stringify(articleStructuredData))
      
      return response
    }
  }
}

// Combine multiple SEO middleware
export function composeSEOMiddleware<T extends any[]>(
  ...middlewares: Array<(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => (request: NextRequest, ...args: T) => Promise<NextResponse>>
) {
  return function(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Pre-configured SEO middleware combinations
export const seoMiddleware = {
  // Basic SEO middleware
  basic: (config: { title: string; description: string; keywords?: string[] }) =>
    composeSEOMiddleware(
      withSEOMiddleware(config),
      withOrganization,
      withWebsite
    ),
  
  // Farm shop SEO middleware
  farmShop: (farmData: any) =>
    composeSEOMiddleware(
      withSEOMiddleware({
        title: `${farmData.name} - Farm Shop in ${farmData.county}`,
        description: farmData.description || `Visit ${farmData.name} in ${farmData.county} for fresh local produce.`,
        keywords: ['farm shop', farmData.name.toLowerCase(), farmData.county.toLowerCase(), 'local produce'],
        canonical: `/shop/${farmData.slug}`,
        ogType: 'place'
      }),
      withLocalBusiness(() => farmData),
      withBreadcrumbs(() => [
        { name: 'Home', url: '/' },
        { name: 'Farm Shops', url: '/shop' },
        { name: farmData.county, url: `/shop?county=${encodeURIComponent(farmData.county)}` },
        { name: farmData.name, url: `/shop/${farmData.slug}` }
      ]),
      withOrganization,
      withWebsite
    ),
  
  // Produce SEO middleware
  produce: (produceData: any) =>
    composeSEOMiddleware(
      withSEOMiddleware({
        title: `${produceData.name} - ${produceData.season} Guide`,
        description: produceData.description || `Learn about ${produceData.name} season, when to buy, and where to find fresh ${produceData.name} in the UK.`,
        keywords: [produceData.name.toLowerCase(), 'seasonal produce', 'when in season', 'UK produce'],
        canonical: `/seasonal/${produceData.slug}`,
        ogType: 'article'
      }),
      withArticle(produceData),
      withBreadcrumbs(() => [
        { name: 'Home', url: '/' },
        { name: 'Seasonal Guide', url: '/seasonal' },
        { name: produceData.name, url: `/seasonal/${produceData.slug}` }
      ]),
      withOrganization,
      withWebsite
    ),
  
  // Collection page SEO middleware
  collection: (collectionData: any) =>
    composeSEOMiddleware(
      withSEOMiddleware({
        title: collectionData.name,
        description: collectionData.description,
        keywords: collectionData.keywords || [],
        canonical: collectionData.url
      }),
      withCollectionPage(collectionData),
      withSearchAction(),
      withOrganization,
      withWebsite
    )
}
