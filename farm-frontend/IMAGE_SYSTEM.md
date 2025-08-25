# 🖼️ ENHANCED IMAGE SYSTEM

## **🎯 OVERVIEW**

The enhanced image system provides:
- ✅ **Image Validation** - Automatic checking for accuracy and quality
- ✅ **Hybrid Support** - Both local and external images
- ✅ **Smart Fallbacks** - Graceful handling of failed images
- ✅ **Performance Optimization** - Automatic optimization and lazy loading
- ✅ **Accessibility** - Proper alt text and ARIA support
- ✅ **Error Prevention** - Catches common issues before deployment

---

## **🔧 QUICK START**

### **1. Validate Current Images**
```bash
npm run validate-images
```

### **2. Add Your Own Images**
```bash
# Create directory structure
mkdir -p public/images/produce/{sweetcorn,tomatoes,strawberries,blackberries,runner-beans,plums,apples,pumpkins}

# Add your images to each folder:
# - hero.jpg (main image)
# - gallery-1.jpg (secondary image)
# - gallery-2.jpg (tertiary image)
```

### **3. Update Data File**
Edit `src/data/produce.ts` to use local images:

```typescript
{
  slug: 'blackberries',
  name: 'Blackberries',
  images: [
    { src: '/images/produce/blackberries/hero.jpg', alt: 'Fresh blackberries in a bowl' },
    { src: '/images/produce/blackberries/gallery-1.jpg', alt: 'Ripe blackberries on the bush' },
    { src: '/images/produce/blackberries/gallery-2.jpg', alt: 'Blackberries close-up detail' },
  ],
  // ... rest of data
}
```

---

## **📋 IMAGE REQUIREMENTS**

### **Technical Specifications**
- **Format**: JPG, PNG, or WebP
- **Size**: 800x600px minimum (1200x900px recommended)
- **Quality**: High resolution, clear, professional
- **File Size**: Under 500KB per image
- **Naming**: Use descriptive names (e.g., `hero.jpg`, `gallery-1.jpg`)

### **Content Requirements**
- ✅ **Accurate produce** - Must show the correct fruit/vegetable
- ✅ **High quality** - Professional food photography
- ✅ **Appetizing** - Makes users want to buy/eat the produce
- ✅ **Educational** - Shows proper ripeness and characteristics
- ✅ **Seasonal context** - Shows natural growing environment when possible

### **Accessibility Requirements**
- ✅ **Alt text** - Descriptive and accurate (max 150 characters)
- ✅ **No inappropriate content** - No clothing, furniture, etc.
- ✅ **Correct identification** - Must match the produce type

---

## **🚀 FEATURES**

### **1. Automatic Validation**
The system automatically checks for:
- ❌ Wrong produce in alt text (e.g., "blueberries" for blackberries)
- ❌ Inappropriate content (e.g., "trousers", "pants")
- ❌ Missing alt text
- ❌ Poor quality indicators
- ⚠️ Missing optimization parameters
- 💡 Suggestions for improvement

### **2. Smart Fallbacks**
- **Loading State**: Shows spinner while image loads
- **Error State**: Shows graceful fallback with produce name
- **Missing Images**: Shows placeholder with produce icon

### **3. Performance Optimization**
- **Automatic Optimization**: Next.js Image component optimization
- **Lazy Loading**: Images load as needed
- **Priority Loading**: Hero images load first
- **Responsive Sizes**: Optimized for different screen sizes

### **4. Hybrid Image Support**
- **Local Images**: `/images/produce/blackberries/hero.jpg`
- **External Images**: `https://images.unsplash.com/...`
- **Automatic Optimization**: Adds parameters to external URLs

---

## **🔍 VALIDATION COMMANDS**

### **Check All Images**
```bash
npm run validate-images
```

### **Check Specific Produce**
```bash
# Edit scripts/validate-images.js to check specific items
node scripts/validate-images.js
```

### **Integration with Build**
```bash
# Add to CI/CD pipeline
npm run validate-images && npm run build
```

---

## **📁 FILE STRUCTURE**

```
farm-frontend/
├── src/
│   ├── components/
│   │   └── ProduceImage.tsx          # Enhanced image component
│   ├── lib/
│   │   └── image-utils.ts            # Image utilities and validation
│   └── data/
│       └── produce.ts                # Produce data with images
├── public/
│   └── images/
│       └── produce/                  # Your local images
│           ├── sweetcorn/
│           │   ├── hero.jpg
│           │   ├── gallery-1.jpg
│           │   └── gallery-2.jpg
│           ├── tomatoes/
│           │   ├── hero.jpg
│           │   ├── gallery-1.jpg
│           │   └── gallery-2.jpg
│           └── ... (other produce)
├── scripts/
│   └── validate-images.js            # Validation script
└── IMAGE_SYSTEM.md                   # This documentation
```

---

## **🎨 COMPONENT USAGE**

### **Single Image**
```tsx
import ProduceImage from '@/components/ProduceImage'

<ProduceImage
  image={produce.images[0]}
  produceName={produce.name}
  index={0}
  fill
  className="object-cover"
  priority
/>
```

### **Image Gallery**
```tsx
import { ProduceGallery } from '@/components/ProduceImage'

<ProduceGallery
  images={produce.images.slice(1)}
  produceName={produce.name}
  className="grid-cols-1 md:grid-cols-2"
/>
```

---

## **🚨 COMMON ISSUES & SOLUTIONS**

### **Issue: Wrong Produce in Images**
**Solution**: Use validation script to catch issues
```bash
npm run validate-images
```

### **Issue: Images Not Loading**
**Solution**: Check file paths and permissions
```bash
# Verify local images exist
ls -la public/images/produce/blackberries/
```

### **Issue: Poor Performance**
**Solution**: Optimize images and use local storage
```bash
# Convert to WebP for better compression
# Use local images instead of external URLs
```

### **Issue: Accessibility Problems**
**Solution**: Write descriptive alt text
```typescript
// Good
alt: "Fresh blackberries in a wooden bowl"

// Bad
alt: "berries"
```

---

## **🔧 ADVANCED CONFIGURATION**

### **Custom Validation Rules**
Edit `src/lib/image-utils.ts` to add custom validation:

```typescript
// Add to COMMON_ISSUES
const COMMON_ISSUES = {
  wrongProduce: {
    blackberries: ['blueberry', 'blueberries'],
    // Add more mappings
  },
  inappropriateContent: ['trouser', 'pant', 'shirt'],
  // Add more categories
}
```

### **Custom Fallback Images**
Edit `getFallbackImage()` function:

```typescript
export function getFallbackImage(produceName: string): string {
  // Return custom fallback based on produce type
  return `/images/fallbacks/${produceName.toLowerCase()}.jpg`
}
```

### **Performance Tuning**
Edit image optimization settings:

```typescript
// In ProduceImage component
<Image
  quality={85}                    // Adjust quality (1-100)
  placeholder="blur"              // Loading placeholder
  blurDataURL="..."               // Custom blur data
  sizes="(max-width: 768px) 100vw, 50vw"  // Responsive sizes
/>
```

---

## **📊 MONITORING & ANALYTICS**

### **Image Performance Tracking**
```typescript
// Track image load times
const handleImageLoad = () => {
  // Send analytics
  trackEvent({
    name: 'image_loaded',
    properties: {
      produce: produceName,
      imageIndex: index,
      loadTime: performance.now() - startTime
    }
  })
}
```

### **Error Tracking**
```typescript
// Track image errors
const handleImageError = () => {
  // Send error analytics
  trackEvent({
    name: 'image_error',
    properties: {
      produce: produceName,
      imageSrc: image.src,
      errorType: 'load_failed'
    }
  })
}
```

---

## **🎯 BEST PRACTICES**

### **1. Image Quality**
- Use high-resolution images (1200x900px minimum)
- Ensure good lighting and composition
- Show produce at its best

### **2. File Management**
- Use consistent naming conventions
- Keep file sizes under 500KB
- Use appropriate formats (JPG for photos, PNG for graphics)

### **3. Accessibility**
- Write descriptive alt text
- Avoid generic descriptions
- Include key characteristics

### **4. Performance**
- Use local images when possible
- Optimize external URLs
- Implement lazy loading

### **5. Validation**
- Run validation before deployment
- Fix all errors before going live
- Review warnings and suggestions

---

## **🚀 DEPLOYMENT CHECKLIST**

Before deploying, ensure:

- [ ] **Validation Passes**: `npm run validate-images` shows no errors
- [ ] **Local Images**: All local images are in correct directories
- [ ] **Alt Text**: All images have descriptive alt text
- [ ] **Performance**: Images load quickly and efficiently
- [ ] **Accessibility**: Images are accessible to screen readers
- [ ] **Mobile**: Images look good on mobile devices
- [ ] **Fallbacks**: Error states work correctly

---

## **📞 SUPPORT**

For issues with the image system:

1. **Run Validation**: `npm run validate-images`
2. **Check Documentation**: Review this file
3. **Check Console**: Look for error messages
4. **Verify Files**: Ensure images exist in correct locations
5. **Contact Team**: If issues persist

---

**🎯 Goal: Professional, accurate, and accessible produce imagery that enhances user experience and educational value.**
