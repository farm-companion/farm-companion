// CountyHero — editorial Pitti railway-poster hero for /counties/[slug].
//
// Two variants gated by `imageUrl`:
//   - Pitti: full-bleed background image, gradient overlay, kicker +
//     bold serif-feel title. Description + badges drop to a slim details
//     bar directly under the hero so the hero composition stays clean.
//   - Fallback: the original typography-led hero on a white card,
//     visually identical to pre-Slice-1.1.3d-2 for counties without
//     an illustration in the PITTI_COUNTY_IMAGES manifest.
//
// Server Component (no client state). Sibling pattern: /shop/[slug]'s
// editorial hero from Slice 1.1.3b.
//
// Slice: 1.1.3d-2
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'

interface CountyHeroStats {
  verified: number
  averageRating: number
}

interface CountyHeroProps {
  countyName: string
  total: number
  stats: CountyHeroStats | null
  imageUrl: string | null
}

function CountyDescription({ countyName, total }: { countyName: string; total: number }) {
  return (
    <p className="text-body md:text-heading text-slate-600 dark:text-slate-400 mb-6">
      Discover {total} local farm shops, pick your own farms, organic producers, and
      agricultural businesses in {countyName}. Support local farmers and enjoy fresh,
      locally-sourced produce.
    </p>
  )
}

function CountyBadges({ total, stats }: { total: number; stats: CountyHeroStats | null }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge variant="default" size="lg">
        {total} {total === 1 ? 'Farm' : 'Farms'}
      </Badge>
      {stats && stats.verified > 0 && (
        <Badge variant="success" size="lg">
          ✓ {stats.verified} Verified
        </Badge>
      )}
      {stats && stats.averageRating > 0 && (
        <Badge variant="outline" size="lg">
          ⭐ {stats.averageRating.toFixed(1)} Average Rating
        </Badge>
      )}
    </div>
  )
}

export function CountyHero({ countyName, total, stats, imageUrl }: CountyHeroProps) {
  if (imageUrl) {
    return (
      <>
        {/* Pitti full-bleed editorial hero */}
        <section className="relative h-[60vh] min-h-[400px] max-h-[640px] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={`Farms and local producers in ${countyName}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12 md:pb-16">
            <p className="text-caption uppercase tracking-widest text-white/90 mb-3 drop-shadow-md">
              {total} {total === 1 ? 'Farm' : 'Farms'}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
              {countyName}
            </h1>
          </div>
        </section>
        {/* Details bar: description and badges live here so the hero stays clean. */}
        <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="max-w-3xl">
              <CountyDescription countyName={countyName} total={total} />
              <CountyBadges total={total} stats={stats} />
            </div>
          </div>
        </section>
      </>
    )
  }

  // Fallback: typography-led hero, visually identical to pre-1.1.3d-2.
  return (
    <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
            Farms &amp; Producers in {countyName}
          </h1>
          <CountyDescription countyName={countyName} total={total} />
          <CountyBadges total={total} stats={stats} />
        </div>
      </div>
    </section>
  )
}
