import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PRODUCE } from '@/data/produce'
import Link from 'next/link'
import { MapPin, Clock, ExternalLink, Sprout, ArrowRight } from 'lucide-react'
import ClientProduceImages, { ClientProduceImage } from '@/components/ClientProduceImages'
import { SITE_URL } from '@/lib/site'

// Revalidate daily
export const revalidate = 86400

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export async function generateStaticParams() {
  return PRODUCE.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = PRODUCE.find(x => x.slug === slug)
  if (!p) return {}
  const img = p.images?.[0]?.src
  const title = `${p.name} — Seasonal Guide`
  const desc = `When ${p.name} is in season, how to choose, store, and cook it.`
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: img ? [{ url: img, width: 1200, height: 630 }] : undefined },
    twitter: { card: 'summary_large_image', title, description: desc, images: img ? [img] : undefined },
  }
}

export default async function ProducePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = PRODUCE.find(x => x.slug === slug)
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
      '@type': 'Product',              // or "Food"
      name: p.name,
      image: p.images?.map(i => i.src) ?? [],
      description: `Seasonal guide for ${p.name}.`,
      additionalProperty: [{
        '@type': 'PropertyValue',
        name: 'Seasonality',
        value: `In season: ${p.monthsInSeason?.map(n => monthNames[n-1]).join(', ') ?? 'Unknown'}`
      }],
      nutrition: p.nutritionPer100g ? {
        '@type': 'NutritionInformation',
        servingSize: '100 g',
        calories: `${p.nutritionPer100g.kcal} kcal`,
        proteinContent: `${p.nutritionPer100g.protein} g`,
        carbohydrateContent: `${p.nutritionPer100g.carbs} g`,
        sugarContent: p.nutritionPer100g.sugars ? `${p.nutritionPer100g.sugars} g` : undefined,
        fiberContent: p.nutritionPer100g.fiber ? `${p.nutritionPer100g.fiber} g` : undefined,
        fatContent: p.nutritionPer100g.fat ? `${p.nutritionPer100g.fat} g` : undefined,
      } : undefined
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
          name: 'Seasonal Produce',
          item: `${SITE_URL}/seasonal`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.name,
          item: `${SITE_URL}/seasonal/${p.slug}`
        }
      ]
    }
  ]

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="rounded-3xl overflow-hidden relative border border-border-default/30 shadow-sm">
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
            <div className="w-full h-full bg-background-surface border border-border-default flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-background-canvas rounded-full mx-auto mb-4 flex items-center justify-center border border-border-default">
                  <Sprout className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-text-muted font-medium">{p.name}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-4">
            <h1 className="text-white text-3xl font-semibold">{p.name}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-caption font-semibold ${inSeason ? 'bg-emerald-200/90 text-emerald-900' : 'bg-gray-200/90 text-gray-800'}`}>
                {inSeason ? 'In Season Now' : 'Out of Season'}
              </span>
              {isPeak && (
                <span className="px-3 py-1 rounded-full text-caption font-semibold bg-amber-200/90 text-amber-900 animate-pulse">
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
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm hover:shadow-md transition motion-reduce:transition-none"
        >
          <MapPin className="w-4 h-4" /> Find at farm shops
        </Link>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(p.name + ' recipes')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm hover:shadow-md transition motion-reduce:transition-none"
        >
          <ExternalLink className="w-4 h-4" /> Recipes
        </a>
        <a
          href={`https://www.google.com/search?q=how+to+store+${encodeURIComponent(p.name)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-background-canvas py-3 shadow-sm hover:shadow-md transition motion-reduce:transition-none"
        >
          <Clock className="w-4 h-4" /> Storage & shelf life
        </a>
      </section>

      {/* SEASONALITY BAR */}
      <section className="mt-8">
        <h2 className="text-heading font-semibold text-text-heading">Seasonality</h2>
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
                    'h-8 rounded-lg border text-small flex items-center justify-center',
                    active ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-background-surface border-border-default text-text-muted',
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
        <h2 className="text-xl font-semibold mb-4 text-text-heading">Gallery</h2>
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
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">How to Choose</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-caption text-text-muted">
              {p.selectionTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ) : null}

        {p.storageTips?.length ? (
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">Storage Tips</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-caption text-text-muted">
              {p.storageTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ) : null}

        {p.prepIdeas?.length ? (
          <div className="rounded-2xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none">
            <h3 className="font-semibold text-text-heading">Prep & Use</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-caption text-text-muted">
              {p.prepIdeas.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        ) : null}
      </section>

      {/* NUTRITION */}
      {p.nutritionPer100g && (
        <section className="mt-8">
          <h2 className="text-heading font-semibold text-text-heading">Nutrition (per 100g)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[420px] w-full text-caption border border-border-default rounded-xl overflow-hidden bg-background-canvas">
              <tbody>
                {Object.entries(p.nutritionPer100g).map(([k,v]) => (
                  <tr key={k} className="border-b border-border-default last:border-b-0">
                    <td className="px-3 py-2 font-medium capitalize bg-background-surface text-text-heading">{k.replace(/([A-Z])/g,' $1')}</td>
                    <td className="px-3 py-2 text-text-muted">{v}{k==='kcal' ? '' : k==='protein'||k==='carbs'||k==='fiber'||k==='fat'||k==='sugars' ? ' g' : ''}</td>
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
          <h2 className="text-xl font-semibold mb-4 text-text-heading">Recipe Inspiration</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {p.recipeChips.map((recipe, index) => (
              <a
                key={index}
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none group"
              >
                <h3 className="font-semibold text-text-heading group-hover:text-brand-primary transition-colors mb-2">
                  {recipe.title}
                </h3>
                <p className="text-caption text-text-muted mb-3">
                  {recipe.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-small text-text-muted">External recipe</span>
                  <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
                </div>
              </a>
            ))}
          </div>
          <div className="mt-4 p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
            <p className="text-small text-brand-primary">
              <strong>Content Policy:</strong> All recipe links are family-friendly and non-alcoholic. 
              We focus on fresh, healthy, family-appropriate recipes only.
            </p>
          </div>
        </section>
      )}

      {/* Related Produce */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-text-heading">Related Produce</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/seasonal"
            className="block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none group"
          >
                          <h3 className="font-semibold text-text-heading group-hover:text-brand-primary transition-colors mb-2">
                Seasonal Guide
              </h3>
              <p className="text-caption text-text-muted mb-3">
                Discover what&apos;s in season now and find the freshest local produce.
              </p>
            <div className="flex items-center justify-between">
              <span className="text-small text-text-muted">View all produce</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
            </div>
          </Link>
          
          <Link
            href="/map"
            className="block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none group"
          >
            <h3 className="font-semibold text-text-heading group-hover:text-brand-primary transition-colors mb-2">
              Farm Shop Map
            </h3>
            <p className="text-caption text-text-muted mb-3">
              Find farm shops near you with fresh local produce and seasonal offerings.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-small text-text-muted">Explore map</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
            </div>
          </Link>
          
          <Link
            href="/shop"
            className="block rounded-xl border border-border-default bg-background-canvas p-4 shadow-sm hover:shadow-md transition motion-reduce:transition-none group"
          >
            <h3 className="font-semibold text-text-heading group-hover:text-brand-primary transition-colors mb-2">
              Farm Directory
            </h3>
            <p className="text-caption text-text-muted mb-3">
              Browse our comprehensive directory of UK farm shops and local producers.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-small text-text-muted">View directory</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-brand-primary transition-colors" />
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10">
        <Link
          href={`/map?q=${encodeURIComponent(p.name)}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 font-semibold hover:bg-brand-primary/90 transition motion-reduce:transition-none"
        >
          <MapPin className="w-4 h-4" /> Find {p.name.toLowerCase()} near you
        </Link>
      </section>

      <div className="h-12" />
    </main>
  )
}
