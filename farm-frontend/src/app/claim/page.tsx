import Link from 'next/link'
import { MapPin, Shield, Search, Plus, ArrowRight, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ClaimSearch } from '@/components/ClaimSearch'

export const metadata = {
  title: 'Claim Your Farm Shop Listing | Farm Companion',
  description: 'Find and claim your farm shop listing on Farm Companion. Update your information, add photos, and connect with local customers across the UK.',
  robots: { index: true, follow: true },
}

// Lightweight shape for the claim listing - only what we display
interface ClaimFarm {
  id: string
  name: string
  slug: string
  county: string
  postcode: string
  address: string
  phone: string | null
  verified: boolean
}

async function getClaimFarms(): Promise<{ farms: ClaimFarm[]; total: number; countyCount: number }> {
  const farms = await prisma.farm.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      slug: true,
      county: true,
      postcode: true,
      address: true,
      phone: true,
      verified: true,
    },
    orderBy: [{ county: 'asc' }, { name: 'asc' }],
  })

  const counties = new Set(farms.map(f => f.county))

  return {
    farms: farms.map(f => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      county: f.county,
      postcode: f.postcode,
      address: f.address,
      phone: f.phone,
      verified: f.verified,
    })),
    total: farms.length,
    countyCount: counties.size,
  }
}

export default async function ClaimPage() {
  const { farms, total, countyCount } = await getClaimFarms()

  // Group by county for the listing
  const farmsByCounty: Record<string, ClaimFarm[]> = {}
  for (const farm of farms) {
    const county = farm.county || 'Other'
    if (!farmsByCounty[county]) farmsByCounty[county] = []
    farmsByCounty[county].push(farm)
  }
  const sortedCounties = Object.keys(farmsByCounty).sort()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,194,178,0.06),transparent_60%)]" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[13px] font-semibold border border-primary-200 dark:border-primary-700 mb-8">
              <Shield className="h-4 w-4" />
              Free to claim
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Claim your farm shop listing
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4 max-w-2xl mx-auto">
              Take control of your listing on Farm Companion. Update your details,
              add photos, and connect with customers across the UK.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 mt-10 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{total.toLocaleString()}</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Active Listings</div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">{countyCount}</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">UK Counties</div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">Free</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Always</div>
              </div>
            </div>

            {/* Search */}
            <ClaimSearch farms={farms} />
          </div>
        </div>
      </section>

      {/* How it works - compact */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Search', desc: 'Find your farm shop below' },
              { step: '2', title: 'Claim', desc: 'Click the claim button' },
              { step: '3', title: 'Verify', desc: 'Confirm your identity' },
              { step: '4', title: 'Manage', desc: 'Update your listing' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-[13px] font-bold flex-shrink-0">
                  {item.step}
                </span>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farm listings by county */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* County jump nav */}
          <div className="mb-8 flex flex-wrap gap-2">
            {sortedCounties.map((county) => (
              <a
                key={county}
                href={`#county-${county.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-[12px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {county} ({farmsByCounty[county].length})
              </a>
            ))}
          </div>

          {/* County sections */}
          <div className="space-y-10">
            {sortedCounties.map((county) => (
              <section key={county} id={`county-${county.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{county}</h2>
                  <span className="text-[13px] font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                    {farmsByCounty[county].length} farm{farmsByCounty[county].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {farmsByCounty[county].map((farm) => (
                    <div
                      key={farm.id}
                      className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">
                            {farm.name}
                          </h3>
                          {farm.verified && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">{farm.address}</span>
                          {farm.postcode && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span className="flex-shrink-0">{farm.postcode}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/shop/${farm.slug}`}
                          className="hidden sm:inline-flex items-center h-9 px-4 text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/claim/${farm.slug}`}
                          className="inline-flex items-center h-9 px-4 text-[13px] font-semibold text-white bg-slate-900 dark:bg-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                        >
                          Claim
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Can't find your farm */}
          <div className="mt-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary-50 dark:bg-primary-900/30 mb-6">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Can't find your farm shop?
            </h2>
            <p className="text-body text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              If your farm shop is not listed, you can add it to our directory
              and start managing it straight away.
            </p>
            <Link
              href="/add"
              className="inline-flex items-center gap-2 h-12 px-8 text-[14px] font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 rounded-xl transition-colors"
            >
              Add Your Farm Shop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
