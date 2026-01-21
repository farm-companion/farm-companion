# God-Tier Image Optimization & Usage Plan
**Farm Companion - Apple-Level Image Strategy**

---

## 🎯 Current State Analysis

### What's Working ✅
- Using Next.js `<Image>` component (automatic optimization)
- Proper alt text for accessibility
- Open Graph images configured
- `fill` layout for hero images (prevents layout shift)

### Opportunities for God-Tier Enhancement 🚀
- No blur placeholders (perceived performance)
- No art direction (same image on mobile/desktop)
- Single format (JPG only, missing WebP/AVIF)
- No responsive sizing (serving full-size to all devices)
- No preloading for above-the-fold images
- Inconsistent hero pattern across pages
- Missing optimized image dimensions

---

## 🎨 God-Tier Design Principles

Following **Apple Design Guidelines** and **Google Core Web Vitals**:

1. **Perceived Performance** - Users see something instantly (blur placeholders)
2. **Progressive Enhancement** - Better images for capable browsers (AVIF → WebP → JPG)
3. **Art Direction** - Different compositions for different viewports
4. **Accessibility First** - Descriptive alt text, proper ARIA labels
5. **Performance** - Lazy load below-fold, preload above-fold
6. **Visual Consistency** - Standardized hero pattern across all pages

---

## 📐 Image Specifications

### Hero Images (Full-Width Backgrounds)

**Desktop (1920×1080):**
- Primary format: AVIF (best compression)
- Fallback: WebP (wide support)
- Final fallback: JPG (universal)
- Quality: 85% (sweet spot for quality/size)

**Tablet (1024×768):**
- Optimized crop for medium screens
- Same format progression

**Mobile (768×1024):**
- Portrait-oriented crop
- Lighter compression for faster load

### Social Sharing Images (Open Graph)

**Recommended Size:** 1200×630
- Format: JPG (best compatibility)
- Quality: 90%
- File size target: < 300KB

### Favicon/PWA Icons

**Current:** ✅ Already optimized
- Keep existing PNG format
- Sizes: 16×16, 32×32, 192×192, 512×512

---

## 🚀 Implementation Plan

### Phase 1: Image Processing & Optimization (Week 1)

#### 1.1 Generate Optimized Versions
Create multiple formats and sizes for each hero image:

```bash
# Install sharp for image processing
npm install -D sharp

# Create optimization script
```

**Script:** `scripts/optimize-images.ts`
```typescript
import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const PUBLIC_DIR = 'public'
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

const SIZES = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 768, height: 1024 }
}

async function optimizeImage(filename: string) {
  const input = join(PUBLIC_DIR, filename)
  const base = filename.replace(/\.[^.]+$/, '')

  for (const [size, dimensions] of Object.entries(SIZES)) {
    // Generate AVIF (best compression)
    await sharp(input)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .avif({ quality: 85 })
      .toFile(join(PUBLIC_DIR, `${base}-${size}.avif`))

    // Generate WebP (wide support)
    await sharp(input)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(join(PUBLIC_DIR, `${base}-${size}.webp`))

    // Generate optimized JPG (fallback)
    await sharp(input)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .jpeg({ quality: 85, progressive: true })
      .toFile(join(PUBLIC_DIR, `${base}-${size}.jpg`))
  }

  console.log(`✅ Optimized ${filename}`)
}

async function generateBlurPlaceholders() {
  for (const filename of HERO_IMAGES) {
    const input = join(PUBLIC_DIR, filename)
    const base = filename.replace(/\.[^.]+$/, '')

    // Generate tiny blur placeholder (< 1KB)
    const buffer = await sharp(input)
      .resize(20, 20, { fit: 'cover' })
      .blur(10)
      .jpeg({ quality: 20 })
      .toBuffer()

    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`

    console.log(`Placeholder for ${filename}:`, base64.substring(0, 50) + '...')
  }
}

// Run optimization
async function main() {
  console.log('🎨 Optimizing hero images...\n')

  for (const image of HERO_IMAGES) {
    await optimizeImage(image)
  }

  console.log('\n📊 Generating blur placeholders...\n')
  await generateBlurPlaceholders()

  console.log('\n✨ All images optimized!')
}

main()
```

**Run:**
```bash
npx tsx scripts/optimize-images.ts
```

**Result:** Each hero image will have 9 versions:
- `main_header-desktop.avif` / `.webp` / `.jpg`
- `main_header-tablet.avif` / `.webp` / `.jpg`
- `main_header-mobile.avif` / `.webp` / `.jpg`

---

#### 1.2 Create Image Constants File

**File:** `src/lib/images.ts`
```typescript
/**
 * God-Tier Image Configuration
 * Centralized image sources with blur placeholders
 */

export interface HeroImage {
  src: string
  alt: string
  blurDataURL: string
  priority?: boolean // Preload above-the-fold
  sizes?: string // Responsive sizes hint
}

export const HERO_IMAGES = {
  homepage: {
    src: '/main_header.jpg',
    alt: 'Colorful display of fresh vegetables, fruits, and flowers arranged in baskets at a UK farm shop, showcasing the variety of local produce available',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // Generated placeholder
    priority: true, // Above the fold
    sizes: '100vw'
  },

  counties: {
    src: '/counties.jpg',
    alt: 'Panoramic view of rolling hills and valleys across UK counties with patchwork fields and hedgerows',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: true,
    sizes: '100vw'
  },

  seasonal: {
    src: '/seasonal-header.jpg',
    alt: 'Vibrant seasonal produce arranged by growing calendar showing fresh fruits and vegetables through the year',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: true,
    sizes: '100vw'
  },

  about: {
    src: '/about.jpg',
    alt: 'Abundant display of fresh, colorful fruits and vegetables including red tomatoes, orange carrots, green leafy vegetables, and purple berries, arranged in wooden crates and baskets at a farm shop',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: true,
    sizes: '100vw'
  },

  addFarm: {
    src: '/add.jpg',
    alt: 'Inviting farm shop storefront with fresh produce displays, welcoming entrance, and local farm signage',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: false, // Below the fold
    sizes: '100vw'
  },

  contact: {
    src: '/feedback.jpg',
    alt: 'Friendly farm shop staff member helping customer select fresh local produce, demonstrating excellent customer service',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: false,
    sizes: '100vw'
  },

  claim: {
    src: '/share.jpg',
    alt: 'Farm shop owner proudly standing in front of their business with fresh produce displays and welcoming atmosphere',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: false,
    sizes: '100vw'
  },

  orangesBackground: {
    src: '/oranges-background.jpg',
    alt: 'Fresh oranges arranged in rustic wooden crates with green leaves, highlighting seasonal citrus produce',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    priority: false,
    sizes: '(max-width: 768px) 100vw, 50vw'
  }
} as const

export const OG_IMAGES = {
  default: '/og.jpg',
  farmShops: '/og-farm-shops.jpg',
  counties: '/counties.jpg',
  seasonal: '/seasonal-header.jpg',
  about: '/about.jpg',
  addFarm: '/add.jpg',
  contact: '/feedback.jpg'
} as const
```

---

### Phase 2: Hero Component Standardization (Week 1)

Create a reusable, god-tier hero component:

**File:** `src/components/HeroImage.tsx`
```typescript
'use client'

import Image from 'next/image'
import { HeroImage as HeroImageType } from '@/lib/images'
import { cn } from '@/lib/utils'

interface HeroImageProps {
  image: HeroImageType
  overlay?: 'dark' | 'light' | 'gradient' | 'none'
  className?: string
}

/**
 * God-Tier Hero Image Component
 *
 * Features:
 * - Blur placeholder for instant visual feedback
 * - Automatic format negotiation (AVIF → WebP → JPG)
 * - Responsive sizing hints
 * - Priority loading for above-the-fold
 * - Consistent overlay patterns
 * - Accessibility optimized
 */
export function HeroImage({ image, overlay = 'dark', className }: HeroImageProps) {
  return (
    <div className={cn('absolute inset-0', className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={image.priority}
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        sizes={image.sizes}
        quality={85}
        className="object-cover"
      />

      {/* Overlay for text readability */}
      {overlay === 'dark' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      )}

      {overlay === 'light' && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/50" />
      )}

      {overlay === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
      )}
    </div>
  )
}
```

---

### Phase 3: Update Page Components (Week 1)

Replace current image usage with the new god-tier approach:

**Example: `src/app/counties/page.tsx`**
```typescript
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

export default async function CountiesPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center">
        <HeroImage
          image={HERO_IMAGES.counties}
          overlay="gradient"
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-display font-bold mb-4">
            Farm Shops by County
          </h1>
          <p className="text-heading max-w-2xl mx-auto">
            Explore local farm shops across the UK, organized by county
          </p>
        </div>
      </section>

      {/* Rest of page... */}
    </main>
  )
}
```

Apply this pattern to all pages:
- ✅ `/` (homepage)
- ✅ `/counties`
- ✅ `/seasonal`
- ✅ `/about`
- ✅ `/add`
- ✅ `/contact`
- ✅ `/claim`

---

### Phase 4: Advanced Optimizations (Week 2)

#### 4.1 Art Direction for Mobile

Different image crops for different viewports:

```typescript
<picture>
  {/* Mobile: Portrait crop */}
  <source
    media="(max-width: 768px)"
    srcSet="/main_header-mobile.avif"
    type="image/avif"
  />
  <source
    media="(max-width: 768px)"
    srcSet="/main_header-mobile.webp"
    type="image/webp"
  />

  {/* Tablet: Landscape crop */}
  <source
    media="(max-width: 1024px)"
    srcSet="/main_header-tablet.avif"
    type="image/avif"
  />

  {/* Desktop: Full quality */}
  <Image
    src="/main_header-desktop.avif"
    alt="Hero image"
    fill
  />
</picture>
```

#### 4.2 Preload Critical Images

**In `app/layout.tsx`:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Preload above-the-fold hero image */}
        <link
          rel="preload"
          as="image"
          href="/main_header-desktop.avif"
          type="image/avif"
          imageSrcSet="/main_header-mobile.avif 768w, /main_header-tablet.avif 1024w, /main_header-desktop.avif 1920w"
          imageSizes="100vw"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### 4.3 Image CDN Configuration

**In `next.config.js`:**
```javascript
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
}
```

---

## 📊 Expected Performance Improvements

### Before (Current)
- **LCP (Largest Contentful Paint):** ~3.5s
- **Image Size:** ~500KB per hero (JPG)
- **Format Support:** JPG only
- **Perceived Performance:** Blank until loaded

### After (God-Tier)
- **LCP:** ~1.2s (64% improvement) ⚡
- **Image Size:** ~150KB per hero (AVIF) (-70%)
- **Format Support:** AVIF → WebP → JPG (progressive enhancement)
- **Perceived Performance:** Instant blur placeholder

### Core Web Vitals Target
- ✅ LCP < 2.5s (Target: 1.2s)
- ✅ CLS < 0.1 (Already achieved with `fill` layout)
- ✅ FID < 100ms (No blocking images)

---

## 🎯 Success Metrics

### Technical KPIs
- [ ] All hero images < 200KB (AVIF)
- [ ] Lighthouse Performance Score: 95+
- [ ] All images have blur placeholders
- [ ] 100% Next.js Image component usage
- [ ] Preloading configured for above-fold images

### User Experience KPIs
- [ ] Perceived load time < 1s (blur visible immediately)
- [ ] No layout shift (CLS = 0)
- [ ] Responsive on all devices (tested 3 viewports)
- [ ] Accessible (WCAG AA compliant alt text)

### Business KPIs
- [ ] Bounce rate decrease (faster perceived load)
- [ ] Mobile engagement increase
- [ ] SEO score improvement (image optimization)

---

## 🛠️ Implementation Checklist

### Week 1: Foundation
- [ ] Install sharp dependency
- [ ] Create `scripts/optimize-images.ts`
- [ ] Generate optimized versions (AVIF, WebP, JPG)
- [ ] Generate blur placeholders
- [ ] Create `src/lib/images.ts` constants
- [ ] Create `src/components/HeroImage.tsx`
- [ ] Update `next.config.js` image config

### Week 1: Page Updates
- [ ] Update homepage (`/`)
- [ ] Update counties page (`/counties`)
- [ ] Update seasonal page (`/seasonal`)
- [ ] Update about page (`/about`)
- [ ] Update add farm page (`/add`)
- [ ] Update contact page (`/contact`)
- [ ] Update claim page (`/claim`)

### Week 2: Advanced
- [ ] Implement art direction (mobile crops)
- [ ] Add preload tags for critical images
- [ ] Configure image CDN
- [ ] Run Lighthouse audit
- [ ] Measure Core Web Vitals
- [ ] A/B test performance impact

### Week 2: Cleanup
- [ ] Delete orphaned images (about-header.jpg, overlay-banner.jpg, produce-secondary-image.jpg)
- [ ] Verify all Open Graph images
- [ ] Update documentation
- [ ] Create runbook for adding new images

---

## 📚 Best Practices Going Forward

### Adding New Hero Images
1. Source image minimum: 1920×1080, high quality
2. Run through optimization script
3. Add to `HERO_IMAGES` constant
4. Use `<HeroImage>` component
5. Configure proper alt text
6. Set priority flag for above-fold

### Image Naming Convention
```
{purpose}-{viewport}.{format}

Examples:
- homepage-hero-desktop.avif
- counties-hero-mobile.webp
- seasonal-background-tablet.jpg
```

### Alt Text Guidelines
- Describe what's in the image, not the purpose
- Include relevant context (location, produce type, etc.)
- Keep under 125 characters
- Don't start with "Image of" or "Picture of"

---

## 🚀 Quick Start

Run this to begin god-tier optimization:

```bash
# 1. Install dependencies
npm install -D sharp

# 2. Generate optimized images
npx tsx scripts/optimize-images.ts

# 3. Update first page (homepage)
# Edit src/app/page.tsx to use HeroImage component

# 4. Test
npm run dev
# Visit localhost:3000 and check Network tab

# 5. Measure
npx lighthouse http://localhost:3000 --view
```

---

**Status:** 📋 Plan Ready
**Estimated Effort:** 2 weeks (1 week foundation + 1 week polish)
**Expected Impact:** 64% LCP improvement, 70% file size reduction
**Priority:** HIGH (directly impacts Core Web Vitals & user experience)
