# Hero Image Migration Example
**How to update pages to use the god-tier HeroImage component**

---

## Before (Current Approach)

**File: `src/app/counties/page.tsx`**
```tsx
import Image from 'next/image'

export default async function CountiesPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white">
        <div className="absolute inset-0">
          <Image
            src="/counties.jpg"
            alt="Panoramic view of rolling hills and valleys across UK counties"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>

        <div className="relative container mx-auto px-6 py-24 md:py-32">
          <h1 className="text-display font-bold mb-4">
            Farm Shops by County
          </h1>
          <p className="text-heading text-slate-300 max-w-2xl">
            Explore local farm shops across the UK, organized by county
          </p>
        </div>
      </section>

      {/* Rest of page... */}
    </main>
  )
}
```

**Issues:**
- ❌ No blur placeholder (blank until image loads)
- ❌ Manual opacity adjustment
- ❌ Hardcoded image path
- ❌ Alt text duplicated
- ❌ No responsive sizing hints
- ❌ Inconsistent pattern across pages

---

## After (God-Tier Approach)

**File: `src/app/counties/page.tsx`**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

export default async function CountiesPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white">
        <HeroImage
          image={HERO_IMAGES.counties}
          overlay="gradient"
        />

        <div className="relative z-10 container mx-auto px-6 py-24 md:py-32">
          <h1 className="text-display font-bold mb-4">
            Farm Shops by County
          </h1>
          <p className="text-heading text-slate-300 max-w-2xl">
            Explore local farm shops across the UK, organized by county
          </p>
        </div>
      </section>

      {/* Rest of page... */}
    </main>
  )
}
```

**Benefits:**
- ✅ Blur placeholder shows instantly (perceived performance)
- ✅ Automatic AVIF → WebP → JPG format selection
- ✅ Centralized image configuration
- ✅ Consistent hero pattern
- ✅ Responsive size hints
- ✅ Priority preloading configured
- ✅ Better accessibility (proper alt text)

---

## Migration Steps for Each Page

### 1. Homepage (`src/app/page.tsx`)

**Before:**
```tsx
<Image
  src="/main_header.jpg"
  alt="Colorful display of fresh vegetables..."
  fill
  className="object-cover"
  priority
/>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.homepage}
  overlay="gradient"
/>
```

---

### 2. Seasonal Page (`src/app/seasonal/page.tsx`)

**Before:**
```tsx
<div className="absolute inset-0">
  <Image
    src="/seasonal-header.jpg"
    alt="Vibrant seasonal produce..."
    fill
    className="object-cover"
    priority
  />
</div>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.seasonal}
  overlay="dark"
/>
```

---

### 3. About Page (`src/app/about/page.tsx`)

**Before:**
```tsx
<div className="absolute inset-0">
  <Image
    src="/about.jpg"
    alt="Abundant display of fresh, colorful fruits..."
    fill
    className="object-cover"
    priority
  />
</div>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.about}
  overlay="gradient"
/>
```

---

### 4. Add Farm Page (`src/app/add/page.tsx`)

**Before:**
```tsx
<div className="absolute inset-0">
  <Image
    src="/add.jpg"
    alt="Inviting farm shop storefront..."
    fill
    className="object-cover"
  />
</div>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.addFarm}
  overlay="dark"
/>
```

---

### 5. Contact Page (`src/app/contact/page.tsx`)

**Before:**
```tsx
<div className="absolute inset-0">
  <Image
    src="/feedback.jpg"
    alt="Friendly farm shop staff member..."
    fill
    className="object-cover"
  />
</div>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.contact}
  overlay="gradient"
/>
```

---

### 6. Claim Page (`src/app/claim/page.tsx`)

**Before:**
```tsx
<div className="absolute inset-0">
  <Image
    src="/share.jpg"
    alt="Farm shop owner proudly standing..."
    fill
    className="object-cover"
  />
</div>
```

**After:**
```tsx
import { HeroImage } from '@/components/HeroImage'
import { HERO_IMAGES } from '@/lib/images'

<HeroImage
  image={HERO_IMAGES.claim}
  overlay="dark"
/>
```

---

## Overlay Options

Choose the overlay style that works best for your content:

```tsx
// Dark overlay (for light text on dark background)
<HeroImage image={HERO_IMAGES.homepage} overlay="dark" />

// Light overlay (for dark text on light background)
<HeroImage image={HERO_IMAGES.homepage} overlay="light" />

// Gradient overlay (subtle, fades from top to bottom)
<HeroImage image={HERO_IMAGES.homepage} overlay="gradient" />

// No overlay (full image visibility)
<HeroImage image={HERO_IMAGES.homepage} overlay="none" />
```

---

## Advanced: Art Direction (Optional)

For different image crops on mobile vs desktop:

**Create mobile-optimized crops:**
```bash
# Portrait crop for mobile (768×1024)
sharp -i public/main_header.jpg -o public/main_header-mobile.jpg --resize 768x1024 --crop center

# Landscape crop for desktop (1920×1080)
sharp -i public/main_header.jpg -o public/main_header-desktop.jpg --resize 1920x1080 --crop center
```

**Use in component:**
```tsx
<picture>
  <source
    media="(max-width: 768px)"
    srcSet="/main_header-mobile.avif"
    type="image/avif"
  />
  <source
    media="(min-width: 769px)"
    srcSet="/main_header-desktop.avif"
    type="image/avif"
  />
  <HeroImage image={HERO_IMAGES.homepage} />
</picture>
```

---

## Testing Checklist

After migrating each page, verify:

- [ ] Image loads with blur placeholder visible first
- [ ] Hero section height is correct (no layout shift)
- [ ] Text is readable over image (overlay working)
- [ ] Image is crisp on retina displays
- [ ] No console warnings about image optimization
- [ ] Lighthouse score improved (run audit)
- [ ] Mobile and desktop both look good

---

## Performance Validation

**Before migration:**
```bash
npx lighthouse http://localhost:3000/counties --view
```

**After migration:**
```bash
npx lighthouse http://localhost:3000/counties --view
```

**Expected improvements:**
- LCP: -40% to -60% (faster load)
- Performance Score: +5 to +15 points
- Image size: -50% to -70% (AVIF compression)

---

## Quick Migration Script

Update all pages at once:

```bash
# 1. Run image optimization
npx tsx scripts/optimize-images.ts

# 2. Copy blur placeholders to src/lib/images.ts
# (Output from step 1)

# 3. Update each page component
# (Follow examples above)

# 4. Test locally
npm run dev

# 5. Run Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

---

**Ready to start?** Begin with the homepage and work through each page systematically.
