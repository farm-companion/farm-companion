'use client'

const EFFECTIVE_DATE = '22 August 2025' // Update when you change this policy

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-text-muted">
          We respect your privacy. This notice explains what we collect, why, and your rights under UK GDPR.
        </p>
        <nav aria-label="On this page" className="mt-6">
          <ul className="flex flex-wrap gap-3 text-caption text-text-muted">
            <li><a className="underline" href="#who-we-are">Who we are</a></li>
            <li><a className="underline" href="#what-we-collect">What we collect</a></li>
            <li><a className="underline" href="#how-we-use">How we use your data</a></li>
            <li><a className="underline" href="#lawful-bases">Lawful bases</a></li>
            <li><a className="underline" href="#sharing">Sharing</a></li>
            <li><a className="underline" href="#cookies">Cookies & consent</a></li>
            <li><a className="underline" href="#transfers">International transfers</a></li>
            <li><a className="underline" href="#security">Security</a></li>
            <li><a className="underline" href="#retention">Retention</a></li>
            <li><a className="underline" href="#your-rights">Your rights</a></li>
            <li><a className="underline" href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section id="who-we-are" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Who we are</h2>
        <p>
          Farm Companion helps people find farm shops across the UK. For this site, we act as the
          <strong> data controller</strong>. Contact: <a className="underline ml-1" href="mailto:hello@farmcompanion.co.uk">hello@farmcompanion.co.uk</a>.
        </p>
      </section>

      <section id="what-we-collect" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">What we collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Essential data</strong> (strictly necessary): server/app logs, error diagnostics, basic security telemetry (IP, user-agent, timestamps).
          </li>
          <li>
            <strong>Consent-based data</strong> (optional): if you accept cookies, we may load analytics (which can use cookies/SDKs).
          </li>
          <li>
            <strong>Shop submissions</strong> (you provide): shop name, address, contact details, links, and any photos/text you upload.
          </li>
          <li>
            <strong>Communications</strong>: emails you send us and our replies.
          </li>
        </ul>
        <p className="text-caption text-text-muted">
          We do not intentionally collect sensitive categories of personal data.
        </p>
      </section>

      <section id="how-we-use" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">How we use your data</h2>
        <ul className="list-disc pl-5 space-y-2">
                      <li>Operate, secure, and improve the site (debugging, uptime, fraud prevention).</li>
            <li>Measure basic usage (analytics) if you consent.</li>
          <li>Publish and moderate shop listings you submit.</li>
          <li>Respond to enquiries and provide support.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section id="lawful-bases" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Lawful bases (UK GDPR)</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Legitimate interests</strong>: site security, debugging, preventing abuse.</li>
          <li><strong>Consent</strong>: analytics, advertising cookies, and any optional tracking.</li>
          <li><strong>Contract</strong>: processing necessary to publish/manage your submitted listings.</li>
          <li><strong>Legal obligation</strong>: records we must keep by law.</li>
        </ul>
      </section>

      <section id="sharing" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Sharing your data</h2>
        <p>
          We share limited data with service providers (processors) who help us run the site, under data-processing agreements.
          Typical categories include:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Hosting and infrastructure (to serve the website and store logs).</li>
          <li>Map/tiles and geolocation services (to render maps and locate you if you opt in).</li>
          <li>Analytics and advertising (loaded only with your consent).</li>
          <li>Email and support tooling (to respond to enquiries).</li>
        </ul>
        <p className="text-caption text-text-muted">
          We do not sell your personal data. If we are required to disclose data by law, we will do so.
        </p>
      </section>

      <section id="cookies" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Cookies & consent</h2>
        <p>
          We ask for your consent before loading non-essential cookies (analytics/ads). You can change your choice at any time.
        </p>
        <div className="mt-2">
          <button
            onClick={() => (window as any).showCookiePreferences?.()}
            className="underline text-brand-600"
            aria-label="Manage cookie preferences"
          >
            Manage cookies
          </button>
        </div>
        <p className="text-caption text-text-muted">
          If you do not consent, analytics/ads will not load.
        </p>
      </section>

      <section id="transfers" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">International transfers</h2>
        <p>
          Where data is transferred outside the UK/EEA, we rely on appropriate safeguards such as UK Addendum/EU SCCs or
          an adequacy decision, as applicable.
        </p>
      </section>

      <section id="security" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Security</h2>
        <p>
          We apply reasonable technical and organisational measures (access controls, least-privilege, encryption in transit,
          monitoring). No internet service can be 100% secure.
        </p>
      </section>

      <section id="retention" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Data retention</h2>
        <p>We keep data only as long as necessary for the purposes described above.</p>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full border border-border-default text-sm">
            <thead className="bg-background-surface">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-left font-medium">Typical retention</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-3 py-2">Server/application logs</td>
                <td className="px-3 py-2">Up to 30–90 days (rolling), unless required for security investigations</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">Shop submissions</td>
                <td className="px-3 py-2">For as long as the listing is live; archived for moderation/audit as needed</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">Support emails</td>
                <td className="px-3 py-2">Up to 24 months</td>
              </tr>
              <tr className="border-t">
                <td className="px-3 py-2">Consent records</td>
                <td className="px-3 py-2">As required to demonstrate compliance</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="your-rights" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Your rights</h2>
        <p>
          Under UK GDPR you can request access, correction, deletion, restriction, portability, and object to certain processing.
          Where we rely on consent, you can withdraw it at any time (it won’t affect prior processing).
        </p>
        <p className="text-caption text-gray-600">
          You also have the right to complain to the Information Commissioner’s Office (ICO) at ico.org.uk.
        </p>
      </section>

      <section id="contact" className="mt-10 space-y-3">
        <h2 className="text-heading font-semibold">Contact</h2>
        <p>
          To exercise your rights or ask questions, email
          <a className="underline ml-1" href="mailto:hello@farmcompanion.co.uk">hello@farmcompanion.co.uk</a>.
        </p>
      </section>

      <footer className="mt-10 text-caption text-text-muted">
        <p>Effective date: {EFFECTIVE_DATE}</p>
        <p className="mt-1">We may update this notice; material changes will be posted here.</p>
      </footer>
    </main>
  )
}
