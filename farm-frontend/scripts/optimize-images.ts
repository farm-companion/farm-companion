/**
 * God-Tier Image Optimization Script
 * Generates optimized versions of hero images in multiple formats and sizes
 *
 * Usage: npx tsx scripts/optimize-images.ts
 */

import sharp from 'sharp'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const PUBLIC_DIR = join(process.cwd(), 'public')

// Hero images to optimize
const HERO_IMAGES = [
  'main_header.jpg',
  'counties.jpg',
  'seasonal-header.jpg',
  'about.jpg',
  'add.jpg',
  'feedback.jpg',
  'share.jpg',
  'oranges-background.jpg'
]

// Responsive sizes following Apple/Google guidelines
const SIZES = {
  desktop: { width: 1920, height: 1080, label: 'Desktop' },
  tablet: { width: 1024, height: 768, label: 'Tablet' },
  mobile: { width: 768, height: 1024, label: 'Mobile' }
}

interface OptimizationStats {
  original: number
  avif: number
  webp: number
  jpg: number
}

const stats: Record<string, OptimizationStats> = {}

/**
 * Optimize a single image into multiple formats and sizes
 */
async function optimizeImage(filename: string): Promise<void> {
  const input = join(PUBLIC_DIR, filename)

  if (!existsSync(input)) {
    console.log(`❌ ${filename} not found, skipping`)
    return
  }

  const base = filename.replace(/\.[^.]+$/, '')
  const originalSize = (await sharp(input).metadata()).size || 0

  stats[filename] = {
    original: originalSize,
    avif: 0,
    webp: 0,
    jpg: 0
  }

  console.log(`\n📸 Processing ${filename} (${(originalSize / 1024).toFixed(0)}KB)`)

  for (const [size, dimensions] of Object.entries(SIZES)) {
    try {
      // Generate AVIF (best compression, ~50% smaller than WebP)
      const avifPath = join(PUBLIC_DIR, `${base}-${size}.avif`)
      await sharp(input)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .avif({
          quality: 85,
          effort: 6 // Higher effort = better compression (0-9)
        })
        .toFile(avifPath)

      const avifSize = (await sharp(avifPath).metadata()).size || 0
      stats[filename].avif += avifSize

      // Generate WebP (wide support, ~30% smaller than JPG)
      const webpPath = join(PUBLIC_DIR, `${base}-${size}.webp`)
      await sharp(input)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({
          quality: 85,
          effort: 6
        })
        .toFile(webpPath)

      const webpSize = (await sharp(webpPath).metadata()).size || 0
      stats[filename].webp += webpSize

      // Generate optimized JPG (universal fallback)
      const jpgPath = join(PUBLIC_DIR, `${base}-${size}.jpg`)
      await sharp(input)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 85,
          progressive: true, // Progressive JPEG for perceived performance
          mozjpeg: true // Use mozjpeg for better compression
        })
        .toFile(jpgPath)

      const jpgSize = (await sharp(jpgPath).metadata()).size || 0
      stats[filename].jpg += jpgSize

      console.log(`  ✓ ${dimensions.label}: AVIF ${(avifSize / 1024).toFixed(0)}KB | WebP ${(webpSize / 1024).toFixed(0)}KB | JPG ${(jpgSize / 1024).toFixed(0)}KB`)

    } catch (error) {
      console.error(`  ✗ Error processing ${size}:`, error)
    }
  }
}

/**
 * Generate tiny blur placeholders for instant loading feedback
 */
async function generateBlurPlaceholders(): Promise<void> {
  console.log('\n📊 Generating blur placeholders...\n')

  const placeholders: Record<string, string> = {}

  for (const filename of HERO_IMAGES) {
    const input = join(PUBLIC_DIR, filename)

    if (!existsSync(input)) continue

    try {
      // Generate 20×20 blurred thumbnail (< 1KB)
      const buffer = await sharp(input)
        .resize(20, 20, {
          fit: 'cover',
          position: 'center'
        })
        .blur(10)
        .jpeg({
          quality: 20,
          progressive: true
        })
        .toBuffer()

      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
      placeholders[filename] = base64

      console.log(`  ✓ ${filename}: ${buffer.length} bytes`)

    } catch (error) {
      console.error(`  ✗ Error generating placeholder for ${filename}:`, error)
    }
  }

  // Output placeholders as TypeScript code
  console.log('\n📝 Copy these blur placeholders to src/lib/images.ts:\n')
  console.log('export const BLUR_PLACEHOLDERS = {')
  for (const [filename, placeholder] of Object.entries(placeholders)) {
    const key = filename.replace(/\.[^.]+$/, '').replace(/-/g, '_')
    console.log(`  ${key}: '${placeholder.substring(0, 80)}...',`)
  }
  console.log('} as const\n')
}

/**
 * Print optimization statistics
 */
function printStats(): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 OPTIMIZATION SUMMARY')
  console.log('='.repeat(80) + '\n')

  let totalOriginal = 0
  let totalAvif = 0
  let totalWebp = 0
  let totalJpg = 0

  for (const [filename, fileStat] of Object.entries(stats)) {
    totalOriginal += fileStat.original
    totalAvif += fileStat.avif
    totalWebp += fileStat.webp
    totalJpg += fileStat.jpg

    const originalKB = (fileStat.original / 1024).toFixed(0)
    const avifKB = (fileStat.avif / 1024).toFixed(0)
    const webpKB = (fileStat.webp / 1024).toFixed(0)
    const jpgKB = (fileStat.jpg / 1024).toFixed(0)

    const avifSavings = (((fileStat.original - fileStat.avif) / fileStat.original) * 100).toFixed(0)
    const webpSavings = (((fileStat.original - fileStat.webp) / fileStat.original) * 100).toFixed(0)

    console.log(`${filename}:`)
    console.log(`  Original: ${originalKB}KB`)
    console.log(`  AVIF:     ${avifKB}KB (-${avifSavings}%)`)
    console.log(`  WebP:     ${webpKB}KB (-${webpSavings}%)`)
    console.log(`  JPG:      ${jpgKB}KB`)
    console.log()
  }

  const totalAvifSavings = (((totalOriginal - totalAvif) / totalOriginal) * 100).toFixed(0)
  const totalWebpSavings = (((totalOriginal - totalWebp) / totalOriginal) * 100).toFixed(0)

  console.log('TOTALS:')
  console.log(`  Original: ${(totalOriginal / 1024).toFixed(0)}KB`)
  console.log(`  AVIF:     ${(totalAvif / 1024).toFixed(0)}KB (-${totalAvifSavings}%)`)
  console.log(`  WebP:     ${(totalWebp / 1024).toFixed(0)}KB (-${totalWebpSavings}%)`)
  console.log(`  JPG:      ${(totalJpg / 1024).toFixed(0)}KB`)
  console.log()
  console.log(`💾 Estimated bandwidth savings: ${totalAvifSavings}% (AVIF) | ${totalWebpSavings}% (WebP)`)
  console.log()
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🎨 God-Tier Image Optimization Starting...\n')
  console.log(`Processing ${HERO_IMAGES.length} hero images in ${Object.keys(SIZES).length} sizes`)
  console.log(`Output formats: AVIF, WebP, JPG\n`)

  // Optimize all images
  for (const image of HERO_IMAGES) {
    await optimizeImage(image)
  }

  // Generate blur placeholders
  await generateBlurPlaceholders()

  // Print statistics
  printStats()

  console.log('✨ Optimization complete!\n')
  console.log('Next steps:')
  console.log('  1. Copy blur placeholders to src/lib/images.ts')
  console.log('  2. Update page components to use <HeroImage> component')
  console.log('  3. Run: npm run dev')
  console.log('  4. Test and verify images load correctly')
  console.log('  5. Run Lighthouse audit to measure improvements\n')
}

// Execute
main().catch((error) => {
  console.error('❌ Optimization failed:', error)
  process.exit(1)
})
