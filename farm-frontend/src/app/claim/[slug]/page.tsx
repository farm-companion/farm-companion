import type { FarmShop } from '@/types/farm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'node:fs/promises'
import path from 'node:path'
import ClaimForm from '@/components/ClaimForm'

export const dynamic = 'force-dynamic'

// Add noindex,follow meta tag to prevent indexing while allowing crawling
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const farms = await readFarms()
  const shop = farms.find((f) => f.slug === slug)
  
  if (!shop) return notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href={`/shop/${slug}`} className="text-sm underline hover:no-underline">
        ← Back to {shop.name}
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Claim {shop.name}</h1>
        <p className="mt-2 text-gray-700 dark:text-[#E4E2DD]/80">
          {shop.location.address}, {shop.location.county} {shop.location.postcode}
        </p>
      </header>

      <div className="mt-8">
        <ClaimForm shop={shop} />
      </div>
    </main>
  )
}

async function readFarms(): Promise<FarmShop[]> {
  const file = path.join(process.cwd(), 'data', 'farms.json')
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw) as FarmShop[]
}
