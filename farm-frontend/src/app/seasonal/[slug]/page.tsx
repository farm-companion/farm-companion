import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PRODUCE } from '@/data/produce'
import Link from 'next/link'
import { MapPin, Clock, ExternalLink, Sprout, ArrowRight } from 'lucide-react'
import ClientProduceImages, { ClientProduceImage } from '@/components/ClientProduceImages'
import { SITE_URL } from '@/lib/site'

// Revalidate daily
export const revalidate = 86400

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export async function generateStaticParams() {
  return PRODUCE.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = PRODUCE.find((x) => x.slug === slug)
  if (!p) return {}
  const img = p.images?.[0]?.src
  const title = `${p.name} — Seasonal Guide`
  const desc = `When ${p.name} is in season, how to choose, store, and cook it.`
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: img ? [{ url: img, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: img ? [img] : undefined,
    },
  }
}

export default async function ProducePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = PRODUCE.find((x) => x.slug === slug)
  if (!p) notFound()

  const now = new Date()
  const m = now.getMonth() + 1
  const inSeason = p.monthsInSeason?.includes(m) ?? false
  const isPeak = p.peakMonths?.includes(m) ?? false

  // Safe access to images
  const heroImage = p.images?.[0]
  const galleryImages = p.images?.slice(1) ?? []

  // JSON-LD (Product/Food with nutrition + season + BreadcrumbList)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product', // or "Food"
      name: p.name,
      image: p.images?.map((i) => i.src) ?? [],
      description: `Seasonal guide for ${p.name}.`,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Seasonality',
          value: `In season: ${p.monthsInSeason?.map((n) => monthNames[n - 1]).join(', ') ?? 'Unknown'}`,
        },
      ],
      nutrition: p.nutritionPer100g
        ? {
            '@type': 'NutritionInformation',
            servingSize: '100 g',
            calories: `${p.nutritionPer100g.kcal} kcal`,
            proteinContent: `${p.nutritionPer100g.protein} g`,
            carbohydrateContent: `${p.nutritionPer100g.carbs} g`,
            sugarContent: p.nutritionPer100g.sugars ? `${p.nutritionPer100g.sugars} g` : undefined,
            fiberContent: p.nutritionPer100g.fiber ? `${p.nutritionPer100g.fiber} g` : undefined,
            fatContent: p.nutritionPer100g.fat ? `${p.nutritionPer100g.fat} g` : undefined,
          }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Seasonal Produce',
          item: `${SITE_URL}/seasonal`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.name,
          item: `${SITE_URL}/seasonal/${p.slug}`,
        },
      ],
    },
  ]

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="border-border-default/30 relative overflow-hidden rounded-3xl border shadow-sm">
        <div className="relative aspect-[16/9] min-h-[256px] sm:min-h-[320px]">
          {heroImage ? (
            <ClientProduceImage
              produceSlug={p.slug}
              produceName={p.name}
              staticImage={heroImage}
              month={m}
              showToggle={false}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border border-border-default bg-background-surface">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-default bg-background-canvas">
                  <Sprout className="h-8 w-8 text-success" />
                </div>
                <p className="font-medium text-text-muted">{p.name}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">{p.name}</h1>
            <div className="flex gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${inSeason ? 'bg-success-light text-success-dark' : 'bg-background-surface text-text-muted'}`}
              >
                {inSeason ? 'In Season Now' : 'Out of Season'}
              </span>
              {isPeak && (
                <span className="animate-pulse rounded-full bg-warning-light px-3 py-1 text-sm font-semibold text-warning-dark">
                  Best This Month
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          href={`/map?q=${encodeURIComponent(p.name)}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
        >
          <MapPin className="h-4 w-4" /> Find at farm shops
        </Link>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(p.name + ' recipes')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
        >
          <ExternalLink className="h-4 w-4" /> Recipes
        </a>
        <a
          href={`https://www.google.com/search?q=how+to+store+${encodeURIComponent(p.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
        >
          <Clock className="h-4 w-4" /> Storage & shelf life
        </a>
      </section>

      {/* SEASONALITY BAR */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-text-heading">Seasonality</h2>
        <div className="mt-3 grid grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const active = p.monthsInSeason?.includes(month) ?? false
            const peak = p.peakMonths?.includes(month) ?? false
            const now = month === m
            return (
              <div key={month} className="text-center">
                <div
                  className={[
                    'flex h-8 items-center justify-center rounded-lg border text-xs',
                    active
                      ? 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary'
                      : 'border-border-default bg-background-surface text-text-muted',
                    peak ? 'ring-2 ring-brand-primary/40' : '',
                    now ? 'outline outline-2 outline-offset-2 outline-brand-primary/60' : '',
                  ].join(' ')}
                  aria-label={`${monthNames[i]} ${active ? 'in season' : 'out of season'}${peak ? ', peak' : ''}${now ? ', current month' : ''}`}
                >
                  {monthNames[i]}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* GALLERY */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-text-heading">Gallery</h2>
        <ClientProduceImages
          produceSlug={p.slug}
          produceName={p.name}
          staticImages={galleryImages}
          month={m}
          maxImages={3}
        />
      </section>

      {/* INFO STRIPS */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {p.selectionTips?.length ? (
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">How to Choose</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
              {p.selectionTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {p.storageTips?.length ? (
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">Storage Tips</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
              {p.storageTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {p.prepIdeas?.length ? (
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">Prep & Use</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
              {p.prepIdeas.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* NUTRITION */}
      {p.nutritionPer100g && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-text-heading">Nutrition (per 100g)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] overflow-hidden rounded-xl border border-border-default bg-background-canvas text-sm">
              <tbody>
                {Object.entries(p.nutritionPer100g).map(([k, v]) => (
                  <tr key={k} className="border-b border-border-default last:border-b-0">
                    <td className="bg-background-surface px-3 py-2 font-medium capitalize text-text-heading">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {v}
                      {k === 'kcal'
                        ? ''
                        : k === 'protein' ||
                            k === 'carbs' ||
                            k === 'fiber' ||
                            k === 'fat' ||
                            k === 'sugars'
                          ? ' g'
                          : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* RECIPE CHIPS */}
      {p.recipeChips && p.recipeChips.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-text-heading">Recipe Inspiration</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {p.recipeChips.map((recipe, index) => (
              <a
                key={index}
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
              >
                <h3 className="mb-2 font-semibold text-text-heading transition-colors group-hover:text-brand-primary">
                  {recipe.title}
                </h3>
                <p className="mb-3 text-sm text-text-muted">{recipe.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">External recipe</span>
                  <ExternalLink className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-primary" />
                </div>
              </a>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-brand-primary/20 bg-brand-primary/10 p-3">
            <p className="text-xs text-brand-primary">
              <strong>Content Policy:</strong> All recipe links are family-friendly and
              non-alcoholic. We focus on fresh, healthy, family-appropriate recipes only.
            </p>
          </div>
        </section>
      )}

      {/* Related Produce */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-text-heading">Related Produce</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/seasonal"
            className="group block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
          >
            <h3 className="mb-2 font-semibold text-text-heading transition-colors group-hover:text-brand-primary">
              Seasonal Guide
            </h3>
            <p className="mb-3 text-sm text-text-muted">
              Discover what&apos;s in season now and find the freshest local produce.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">View all produce</span>
              <ArrowRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-primary" />
            </div>
          </Link>

          <Link
            href="/map"
            className="group block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
          >
            <h3 className="mb-2 font-semibold text-text-heading transition-colors group-hover:text-brand-primary">
              Farm Shop Map
            </h3>
            <p className="mb-3 text-sm text-text-muted">
              Find farm shops near you with fresh local produce and seasonal offerings.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Explore map</span>
              <ArrowRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-primary" />
            </div>
          </Link>

          <Link
            href="/shop"
            className="group block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
          >
            <h3 className="mb-2 font-semibold text-text-heading transition-colors group-hover:text-brand-primary">
              Farm Directory
            </h3>
            <p className="mb-3 text-sm text-text-muted">
              Browse our comprehensive directory of UK farm shops and local producers.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">View directory</span>
              <ArrowRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-brand-primary" />
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10">
        <Link
          href={`/map?q=${encodeURIComponent(p.name)}`}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-primary px-5 font-semibold text-white transition-colors duration-150 hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none"
        >
          <MapPin className="h-4 w-4" /> Find {p.name.toLowerCase()} near you
        </Link>
      </section>

      <div className="h-12" />
    </main>
  )
}
