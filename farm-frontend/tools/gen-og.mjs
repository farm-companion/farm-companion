// Generate a brand-consistent Open Graph image as JPEG (1200x630)
// Palette: Midnight Navy #121D2B, Sandstone Fog #E4E2DD, Serum Teal #00C2B2, Solar Lime #D4FF4F
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const W = 1200, H = 630
const bg = '#121D2B'
const fg = '#E4E2DD'
const teal = '#00C2B2'
const lime = '#D4FF4F'

// Simple, legible composition (no gradients, high contrast)
const svg = String.raw`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${bg}" />

  <!-- Accent corner band -->
  <rect x="${W-200}" y="0" width="200" height="12" fill="${teal}" />
  <circle cx="${W-24}" cy="24" r="6" fill="${lime}" />

  <!-- Title -->
  <g transform="translate(80, 180)">
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          font-size="72" font-weight="700" fill="${fg}" letter-spacing="0.5">
      Farm Companion
    </text>
  </g>

  <!-- Subtitle -->
  <g transform="translate(80, 260)">
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          font-size="34" font-weight="500" fill="${fg}" opacity="0.9">
      Find fresh local produce from trusted UK farm shops
    </text>
  </g>

  <!-- Bullets -->
  <g transform="translate(80, 340)" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
     font-size="28" fill="${fg}" opacity="0.9">
    <text x="0" y="0">• Trusted listings • Near me • Seasonal produce</text>
  </g>

  <!-- URL -->
  <g transform="translate(80, ${H-80})">
    <rect x="-10" y="-38" rx="10" ry="10" width="620" height="56" fill="rgba(0,0,0,0.25)"/>
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
          font-size="28" font-weight="600" fill="${fg}">
      www.farmcompanion.co.uk
    </text>
  </g>
</svg>`

const outDir = path.join(process.cwd(), 'public')
const outFile = path.join(outDir, 'og.jpg')
await fs.promises.mkdir(outDir, { recursive: true })
await sharp(Buffer.from(svg))
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
  .toFile(outFile)
console.log('✅ Wrote', outFile)
