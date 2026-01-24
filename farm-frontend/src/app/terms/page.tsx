import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms of Service | Farm Companion',
  description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory and seasonal produce guide.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | Farm Companion',
    description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory.',
    url: `${SITE_URL}/terms`,
    siteName: 'Farm Companion',
    images: [
      {
        url: `${SITE_URL}/og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Terms of Service - Farm Companion',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Farm Companion',
    description: 'Terms of service for Farm Companion. Learn about the terms and conditions for using our UK farm shops directory.',
    images: [`${SITE_URL}/og.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-gray-700 dark:text-[#E4E2DD]/80">
        These terms govern your use of Farm Companion. By using the site, you agree to them.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Who we are</h2>
        <p>
          Farm Companion is a UK directory helping people find farm shops. Contact:
          <a className="underline ml-1" href="mailto:hello@farmcompanion.co.uk">hello@farmcompanion.co.uk</a>.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Use of the site</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Do not misuse the site, attempt unauthorised access, or disrupt services.</li>
          <li>You may link to our pages provided you do so fairly and lawfully.</li>
          <li>We may update or remove content and features without notice.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Accuracy of information</h2>
        <p>
          We aim for accuracy but do not guarantee that listings, opening hours, or seasonality data
          are complete, current, or error-free. Always check directly with the farm shop before travelling.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">User submissions</h2>
        <p>
          If you submit or claim a listing, you represent that the information is accurate and that
          you have the right to share it. You grant us a worldwide, non-exclusive, royalty-free licence
          to host, display, and adapt the submission for the purpose of operating the directory.
        </p>
        <p>
          We may edit, moderate, or remove submissions that are inaccurate, unlawful, or abusive.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Third-party links & advertising</h2>
        <p>
          The site may display third-party links. We do not
          endorse or control third-party sites or products and are not responsible for their content or policies.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Privacy</h2>
        <p>
          See our <a className="underline" href="/privacy">Privacy Policy</a> for how we handle personal data and cookies.
          Non-essential tools (including advertising) load only after consent.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Availability</h2>
        <p>
          We try to keep the service available and fast. However, we do not guarantee uninterrupted access and
          may suspend or limit features for maintenance or security.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Liability</h2>
        <p>
          To the fullest extent permitted by law, we exclude all implied warranties and are not liable for any
          loss or damage arising from use of the site, except where caused by our fraud or wilful misconduct.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-heading font-semibold">Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction.
        </p>
      </section>

      <p className="mt-10 text-caption text-gray-600 dark:text-[#E4E2DD]/70">
        Effective date: {new Date().toLocaleDateString('en-GB')}
      </p>
    </main>
  )
}
