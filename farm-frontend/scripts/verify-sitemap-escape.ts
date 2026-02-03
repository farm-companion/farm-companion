/**
 * One-off verification: sitemap XML escapes & in image URLs and captions.
 * Run: pnpm exec tsx scripts/verify-sitemap-escape.ts
 */
import { generateSitemapXML } from '../src/lib/enhanced-sitemap'

const entry = {
  url: '/shop/test',
  changeFrequency: 'weekly' as const,
  priority: 0.8,
  lastModified: new Date(),
  images: [
    {
      url: 'https://im.runware.ai/x?w=800&q=85',
      caption: 'A & B',
      title: 'Farm <script>',
    },
  ],
}

const xml = generateSitemapXML([entry])

// Must use &amp; for ampersands
if (!xml.includes('&amp;')) {
  console.error('FAIL: output should contain &amp;')
  process.exit(1)
}
// image:loc must not contain raw &
if (/<image:loc>[^<]*&(?!amp;)[^<]*<\/image:loc>/.test(xml)) {
  console.error('FAIL: image:loc contains unescaped &')
  process.exit(1)
}
// Caption with & should be escaped
if (!xml.includes('A &amp; B')) {
  console.error('FAIL: caption "A & B" should appear as A &amp; B')
  process.exit(1)
}
// Title with < should be escaped
if (!xml.includes('&lt;script&gt;')) {
  console.error('FAIL: title with <script> should be escaped')
  process.exit(1)
}

console.log('OK: sitemap XML correctly escapes &, <, > in image URLs and text')
