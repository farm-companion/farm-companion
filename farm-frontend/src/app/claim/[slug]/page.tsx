import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClaimForm from '@/components/ClaimForm'
import { getFarmBySlug } from '@/lib/farm-data'

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
  const shop = await getFarmBySlug(slug)

  if (!shop) return notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href={`/shop/${slug}`} className="text-caption underline hover:no-underline">
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
