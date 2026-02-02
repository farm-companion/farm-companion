import Script from 'next/script'

interface JsonLdData {
  '@context': string
  '@type': string
  [key: string]: unknown
}

const JsonLd = ({ data }: { data: JsonLdData }) => (
  <Script
    id="jsonld"
    type="application/ld+json"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)

export default JsonLd
