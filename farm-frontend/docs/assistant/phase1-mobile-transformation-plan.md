# Phase 1: Comprehensive Mobile-First Transformation Plan

**Goal:** Transform ALL 37 pages to mobile-first, god-tier quality

**Scope:** Every page from homepage to admin panels

**Timeline:** Days 3-5 (multiple slices)

---

## Page Inventory (37 Total)

### Foundation (P0 - Critical)
- [x] Design tokens (`/styles/tokens.ts`) - Slice 5 DONE
- [x] Mobile utilities (`/styles/mobile.ts`) - Slice 5 DONE
- [x] Tailwind config enhanced - Slice 5 DONE
- [x] Bottom navigation bar - Slice 6 DONE
- [x] Header touch target enhancements - Slice 6 DONE
- [x] Root layout updated - Slice 6 DONE
- [ ] Core UI components (Button, Card, Input, Select, Modal)

### Public Pages (P1 - High Traffic - 16 pages)
- [x] Homepage hero section - Slice 7 DONE
- [x] Homepage AnimatedStats - Slice 8 DONE
- [x] Homepage CategoryGrid - Slice 8 DONE
- [x] Homepage SeasonalCarousel - Already mobile-optimized
- [x] Homepage FeaturedGuides - Slice 9 DONE
- [x] Homepage AnimatedFeatures - Slice 9 DONE
- [x] Homepage CTA Section - Slice 9 DONE
- [x] Homepage Newsletter - Slice 9 DONE
- [ ] Homepage NearbyFarms (complex component, needs separate slice)
- [ ] Homepage SEO content section
- [ ] Map page (`/map`)
- [ ] Shop directory (`/shop`)
- [ ] Shop detail (`/shop/[slug]`)
- [ ] Seasonal hub (`/seasonal`)
- [ ] Seasonal detail (`/seasonal/[slug]`) x8 pages
- [ ] Counties hub (`/counties`)
- [ ] County detail (`/counties/[slug]`) x~50 pages
- [ ] Categories hub (`/categories`)
- [ ] Category detail (`/categories/[slug]`)

### Secondary Pages (P2 - Medium Traffic - 8 pages)
- [ ] Best hub (`/best`)
- [ ] Best detail (`/best/[slug]`)
- [ ] Compare (`/compare`)
- [ ] About (`/about`)
- [ ] Contact (`/contact`)
- [ ] Not found (`/not-found.tsx`)

### Utility Pages (P3 - Lower Traffic - 5 pages)
- [ ] Add farm (`/add`)
- [ ] Claim hub (`/claim`)
- [ ] Claim detail (`/claim/[slug]`)
- [ ] Submission success (`/submission-success`)
- [ ] Privacy (`/privacy`)
- [ ] Terms (`/terms`)

### Admin Pages (P4 - Internal - 8 pages)
- [ ] Admin dashboard (`/admin`)
- [ ] Admin login (`/admin/login`)
- [ ] Admin farms (`/admin/farms`)
- [ ] Admin claims (`/admin/claims`)
- [ ] Admin photos (`/admin/photos`)
- [ ] Admin photos approved (`/admin/photos/approved`)
- [ ] Admin produce (`/admin/produce`)
- [ ] Admin produce stats (`/admin/produce/stats`)
- [ ] Admin produce upload (`/admin/produce/upload`)
- [ ] Admin documentation (`/admin/documentation`)

---

## Transformation Checklist (Per Page)

### Mobile Audit
- [ ] Test on 320px (iPhone SE)
- [ ] Test on 375px (iPhone 13)
- [ ] Test on 390px (iPhone 14 Pro)
- [ ] Test on 430px (iPhone 14 Pro Max)
- [ ] Test on 768px (iPad)

### Touch Targets
- [ ] All buttons ≥ 48x48px
- [ ] All links ≥ 48x48px
- [ ] Form inputs ≥ 48px height
- [ ] Icon buttons ≥ 48x48px
- [ ] Spacing between targets ≥ 8px

### Typography
- [ ] Body text ≥ 16px (no zooming needed)
- [ ] Headings scale properly (clamp)
- [ ] Line height ≥ 1.5 for body
- [ ] Readable contrast (WCAG AA)

### Layout
- [ ] No horizontal scrolling
- [ ] Proper spacing (mobile-first)
- [ ] Images responsive
- [ ] Cards stack on mobile
- [ ] Navigation mobile-optimized

### Performance
- [ ] Images optimized (Next/Image)
- [ ] Lazy loading where appropriate
- [ ] No layout shift (CLS)
- [ ] Fast interaction (FID)

### Interactions
- [ ] Touch-friendly (no hover-dependent)
- [ ] Active states on tap
- [ ] Smooth animations (respect prefers-reduced-motion)
- [ ] Swipe gestures where appropriate
- [ ] Pull-to-refresh where appropriate

---

## Execution Strategy

### Slice Order
1. **Foundation Slices (1-5):** Design tokens + core components
2. **Navigation Slice (6):** Bottom nav + mobile menu
3. **High-Priority Pages (7-15):** Homepage, map, shop, seasonal, counties
4. **Secondary Pages (16-20):** Categories, best, compare, about, contact
5. **Utility Pages (21-24):** Add, claim, privacy, terms
6. **Admin Pages (25-30):** Admin dashboard and all admin pages
7. **Polish Slice (31):** Final mobile testing and fixes

### Slice Rules (CLAUDE.md)
- Max 8 files per slice
- Max 300 lines changed per slice (excluding deletions/docs)
- One slice per response
- Verify build after each slice
- Update ledger after each slice

---

## Success Metrics

### Per Page
- [ ] Lighthouse mobile score ≥ 90
- [ ] All touch targets ≥ 48x48px
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Navigation thumb-friendly

### Overall
- [ ] 37/37 pages mobile-optimized
- [ ] Consistent design system
- [ ] 0 TypeScript errors
- [ ] Build successful
- [ ] All pages tested on real devices

---

## Current Status
- Phase 0: ✅ Complete
- Phase 1: 🏗️ Starting now

**Next:** Slice 5 - Create Design Tokens Foundation
