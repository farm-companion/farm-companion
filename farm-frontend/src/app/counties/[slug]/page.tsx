import type { FarmShop } from '@/types/farm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'node:fs/promises'
import path from 'node:path'
export const dynamic = 'force-dynamic' // Make this dynamic to avoid build-time data fetching

export default async function CountyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const farms = await readFarms()
  const countyName = unslugify(slug, farms)
  if (!countyName) return notFound()
  const list = farms
    .filter(f => f.location?.county && slugify(f.location.county) === slug)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
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
  const file = path.join(process.cwd(), 'public', 'data', 'farms.uk.json')
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
