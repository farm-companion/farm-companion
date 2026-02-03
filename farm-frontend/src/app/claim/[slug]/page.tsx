import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClaimForm from '@/components/ClaimForm'
import { getFarmBySlug } from '@/lib/farm-data'
import { MapPin, Shield, Clock, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-caption text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href={`/shop/${slug}`} className="hover:text-brand-primary transition-colors">
              {shop.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">Claim Listing</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[13px] font-semibold border border-primary-200 dark:border-primary-700 mb-6">
              <Shield className="h-4 w-4" />
              Claim Your Listing
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              {shop.name}
            </h1>

            <div className="flex items-center gap-2 text-body text-slate-600 dark:text-slate-400 mb-6">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <span>{shop.location.address}, {shop.location.county} {shop.location.postcode}</span>
            </div>

            <p className="text-body text-slate-600 dark:text-slate-400 max-w-2xl">
              Take control of your listing on Farm Companion. Update your details, add photos,
              respond to visitors, and reach more customers across the UK.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form */}
          <main className="lg:col-span-3">
            <ClaimForm shop={shop} />
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Why Claim */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Why claim your listing?
                </h2>
                <ul className="space-y-4">
                  {[
                    { text: 'Update business hours, contact info, and photos', icon: CheckCircle },
                    { text: 'Appear higher in local search results', icon: CheckCircle },
                    { text: 'Display a verified badge on your listing', icon: Shield },
                    { text: 'Respond to visitor questions directly', icon: CheckCircle },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <item.icon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-caption text-slate-700 dark:text-slate-300">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* How It Works */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
                  How it works
                </h2>
                <ol className="space-y-4">
                  {[
                    { step: '1', title: 'Submit your claim', desc: 'Fill in your details and select a claim type' },
                    { step: '2', title: 'Verification', desc: 'We verify your identity via email, phone, or documents' },
                    { step: '3', title: 'You are in control', desc: 'Manage your listing and connect with customers' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-[13px] font-bold flex-shrink-0">
                        {item.step}
                      </span>
                      <div>
                        <div className="text-caption font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-caption text-slate-600 dark:text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Response Time */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Response time
                  </h2>
                </div>
                <p className="text-caption text-slate-600 dark:text-slate-400">
                  Most claims are reviewed within 2-3 business days. You will receive
                  a confirmation email from hello@farmcompanion.co.uk once submitted.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
