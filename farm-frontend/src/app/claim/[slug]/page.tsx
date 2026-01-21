import type { FarmShop } from '@/types/farm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClaimForm from '@/components/ClaimForm'
import { prisma } from '@/lib/prisma'

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
  const farms = await prisma.farm.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      city: true,
      county: true,
      postcode: true,
      latitude: true,
      longitude: true,
      phone: true,
      email: true,
      website: true,
      verified: true,
      categories: {
        include: {
          category: true,
        },
      },
      images: {
        where: {
          status: 'approved',
          isHero: true,
        },
        take: 1,
        select: {
          url: true,
        },
      },
    },
  })

  // Transform to FarmShop type
  return farms.map((farm) => ({
    id: farm.id,
    name: farm.name,
    slug: farm.slug,
    description: farm.description || undefined,
    location: {
      lat: Number(farm.latitude),
      lng: Number(farm.longitude),
      address: farm.address,
      city: farm.city || undefined,
      county: farm.county,
      postcode: farm.postcode,
    },
    contact: {
      phone: farm.phone || undefined,
      email: farm.email || undefined,
      website: farm.website || undefined,
    },
    offerings: farm.categories.map((fc) => fc.category.name),
    images: farm.images.length > 0 ? [farm.images[0].url] : undefined,
    verified: farm.verified,
  }))
}
