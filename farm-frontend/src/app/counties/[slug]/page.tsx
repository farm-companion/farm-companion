import type { FarmShop } from '@/types/farm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'node:fs/promises'
import path from 'node:path'
import { SITE_URL } from '@/lib/site'

// Revalidate every 6 hours for fresh farm data
export const revalidate = 21600

export default async function CountyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const farms = await readFarms()
  const countyName = unslugify(slug, farms)
  if (!countyName) return notFound()
  const list = farms
    .filter(f => f.location?.county && slugify(f.location.county) === slug)
    .sort((a, b) => a.name.localeCompare(b.name))

  // CollectionPage + ItemList + BreadcrumbList JSON-LD
  const countyJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/counties/${slug}#collection`,
      url: `${SITE_URL}/counties/${slug}`,
      name: `Farm Shops in ${countyName}`,
      description: `Directory of farm shops in ${countyName}, UK. Find local produce and fresh food.`,
      isPartOf: { '@id': `${SITE_URL}#website` },
      mainEntity: {
        '@type': 'ItemList',
        name: `Farm Shops in ${countyName}`,
        numberOfItems: list.length,
        itemListOrder: 'http://schema.org/ItemListOrderAscending',
        itemListElement: list.map((farm, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'LocalBusiness',
            name: farm.name,
            url: `${SITE_URL}/shop/${farm.slug}`,
            address: {
              '@type': 'PostalAddress',
              streetAddress: farm.location.address,
              addressLocality: farm.location.county,
              postalCode: farm.location.postcode,
              addressCountry: 'GB'
            }
          }
        }))
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Counties',
          item: `${SITE_URL}/counties`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: countyName,
          item: `${SITE_URL}/counties/${slug}`
        }
      ]
    }
  ]

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* SEO: CollectionPage + Breadcrumbs JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(countyJsonLd) }}
      />
      <Link href="/counties" className="text-sm underline hover:no-underline">← All counties</Link>
      <h1 className="mt-2 text-3xl font-semibold">{countyName}</h1>
      <p className="mt-2 text-gray-700 dark:text-[#E4E2DD]/80">
        {list.length} farm shop{list.length === 1 ? '' : 's'} listed.
      </p>

      <ul className="mt-6 divide-y rounded border dark:divide-gray-700 dark:border-gray-700">
        {list.map(f => (
          <li key={f.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <Link className="font-medium hover:underline" href={`/shop/${f.slug}`}>{f.name}</Link>
              <span className="text-xs text-gray-600 dark:text-[#E4E2DD]/70">{f.location.postcode}</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-[#E4E2DD]/80">{f.location.address}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}

// Remove generateStaticParams to make this dynamic
// export async function generateStaticParams() {
//   const farms = await readFarms()
//   const slugs = Array.from(new Set(
//     farms
//       .filter(f => f.location?.county)
//       .map(f => slugify(f.location.county))
//   ))
//   return slugs.map(slug => ({ slug }))
// }

async function readFarms(): Promise<FarmShop[]> {
  const file = path.join(process.cwd(), 'data', 'farms.json')
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw) as FarmShop[]
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function unslugify(slug: string, farms: FarmShop[]) {
  const match = farms.find(f => f.location?.county && slugify(f.location.county) === slug)
  return match?.location?.county ?? null
}
