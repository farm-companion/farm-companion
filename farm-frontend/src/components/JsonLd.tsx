import Script from 'next/script'

const JsonLd = ({ data }: { data: any }) => (
  <Script
    id="jsonld"
    type="application/ld+json"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)

export default JsonLd
