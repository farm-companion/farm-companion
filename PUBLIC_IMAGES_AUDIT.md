# Public Folder Images Audit Report
**Generated:** 2026-01-21

## ✅ Images Currently In Use

### Homepage & Core Pages

| Image | Used In | Purpose |
|-------|---------|---------|
| `main_header.jpg` | `/` (Homepage) | Hero background in AnimatedHero component |
| `oranges-background.jpg` | `/` (Homepage) | Background image for oranges section |
| `og.jpg` | Root layout + Homepage | Default Open Graph/social share image |

### Feature Pages

| Image | Used In | Purpose |
|-------|---------|---------|
| `counties.jpg` | `/counties` | Hero image + Open Graph for counties directory |
| `seasonal-header.jpg` | `/seasonal` | Hero image + Open Graph for seasonal calendar |
| `about.jpg` | `/about` | Hero image + Open Graph for about page |
| `add.jpg` | `/add` | Hero image + Open Graph for farm submission page |
| `feedback.jpg` | `/contact` | Hero image + Open Graph for contact page |
| `share.jpg` | `/claim` | Claim page hero image |
| `og-farm-shops.jpg` | `/shop` | Open Graph image for shop directory |

### Favicons & PWA Icons

| Image | Purpose |
|-------|---------|
| `favicon-16x16.png` | Browser favicon (16×16) |
| `favicon-32x32.png` | Browser favicon (32×32) |
| `apple-touch-icon.png` | Apple devices home screen icon |
| `android-chrome-192x192.png` | Android PWA icon (192×192) |
| `android-chrome-512x512.png` | Android PWA icon (512×512) |

---

## ⚠️ Images Not Currently Referenced

These images exist in `/public` but are not referenced in the codebase:

### 1. `about-header.jpg`
- **Status:** Not used
- **Possible reason:** Replaced by `about.jpg`
- **Recommendation:** Safe to delete if not needed

### 2. `overlay-banner.jpg`
- **Status:** Explicitly removed (comment in layout.tsx)
- **Comment found:** "Removed overlay-banner.jpg preload - not used above the fold"
- **Recommendation:** Safe to delete

### 3. `produce-secondary-image.jpg`
- **Status:** Not used
- **Possible reason:** May have been for a feature not implemented
- **Recommendation:** Safe to delete if not needed

---

## 📊 Usage Summary

**Total Images:** 18
**In Active Use:** 15 (83%)
**Not Referenced:** 3 (17%)

---

## 🔍 Where Your Images Appear

### Homepage (`/`)
```tsx
// Hero section
<Image src="/main_header.jpg" />

// Oranges background
<Image src="/oranges-background.jpg" />

// Social sharing
og:image: "/og.jpg"
```

### Counties Page (`/counties`)
```tsx
// Hero image
<Image src="/counties.jpg" />

// Open Graph metadata
images: [`${SITE_URL}/counties.jpg`]
```

### Seasonal Calendar (`/seasonal`)
```tsx
// Hero image
<Image src="/seasonal-header.jpg" />

// Open Graph metadata
images: [`${SITE_URL}/seasonal-header.jpg`]
```

### About Page (`/about`)
```tsx
// Hero image
<Image src="/about.jpg" />

// Open Graph metadata
images: [`${SITE_URL}/about.jpg`]
```

### Farm Submission (`/add`)
```tsx
// Hero image
<Image src="/add.jpg" />

// Open Graph metadata
images: [`${SITE_URL}/add.jpg`]
```

### Contact Page (`/contact`)
```tsx
// Hero image (feedback context)
<Image src="/feedback.jpg" />

// Open Graph metadata
images: [`${SITE_URL}/feedback.jpg`]
```

### Claim Page (`/claim`)
```tsx
// Hero image
<Image src="/share.jpg" />
```

### Shop Directory (`/shop`)
```tsx
// Open Graph only (no hero image)
images: [`${SITE_URL}/og-farm-shops.jpg`]
```

---

## ✨ Recommendations

### 1. Keep These Images (Active Use)
All hero images and Open Graph images are actively used and should be kept:
- `main_header.jpg`
- `oranges-background.jpg`
- `counties.jpg`
- `seasonal-header.jpg`
- `about.jpg`
- `add.jpg`
- `feedback.jpg`
- `share.jpg`
- `og.jpg`
- `og-farm-shops.jpg`
- All favicon/PWA icons

### 2. Consider Removing (Not Used)
These can be safely deleted to clean up the public folder:
```bash
rm public/about-header.jpg
rm public/overlay-banner.jpg
rm public/produce-secondary-image.jpg
```

### 3. Image Optimization Opportunities
All your images are currently `.jpg` format. Consider:
- Converting to WebP for better compression (20-30% smaller)
- Creating responsive versions (different sizes for mobile/desktop)
- Adding Next.js Image optimization config

Example conversion:
```bash
# Install sharp if not already available
npm install -g sharp-cli

# Convert to WebP
sharp -i public/main_header.jpg -o public/main_header.webp
```

Then update references to use Next.js Image component (already done for most!).

---

## 🎯 Next Steps

1. **Verify Unused Images:**
   - Check if `about-header.jpg`, `overlay-banner.jpg`, `produce-secondary-image.jpg` are needed
   - Delete them if not

2. **Optimize Current Images:**
   - Consider WebP conversion for better performance
   - Ensure images are properly sized (not oversized)

3. **Check Image Loading:**
   - Run Lighthouse audit to verify images load optimally
   - Ensure Next.js Image component is used (provides automatic optimization)

---

**Audit Status:** ✅ Complete
**Images Working Correctly:** Yes (all referenced images are in correct locations)
**Cleanup Needed:** Optional (3 orphaned images can be removed)
