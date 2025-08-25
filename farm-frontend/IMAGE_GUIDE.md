# 📸 Image Guide - Farm Companion

This guide shows you exactly where to add your images in the Farm Companion project.

## 📁 **Image Directory Structure**

```
farm-companion/farm-frontend/public/images/
├── produce/          # Seasonal produce images
├── farms/           # Farm shop images
└── general/         # General site images (hero, backgrounds, etc.)
```

## 🍓 **1. Produce Images (Seasonal Pages)**

**Location**: `public/images/produce/`

**Purpose**: Images for seasonal produce pages (strawberries, tomatoes, etc.)

**Examples**:
- `strawberries-fresh.jpg`
- `tomatoes-vine.jpg`
- `sweetcorn-field.jpg`
- `blackberries-bush.jpg`

**How to Use**: These images will automatically appear on the seasonal produce pages.

## 🏡 **2. Farm Shop Images**

**Location**: `public/images/farms/`

**Purpose**: Images for individual farm shops

**Examples**:
- `farm-name-exterior.jpg`
- `farm-name-shop.jpg`
- `farm-name-produce.jpg`

**How to Use**: Add these to farm shop data or use in farm detail pages.

## 🎨 **3. General Site Images**

**Location**: `public/images/`

**Purpose**: Hero images, backgrounds, icons, general site assets

**Examples**:
- `hero-background.jpg`
- `farm-icon.svg`
- `about-hero.jpg`

## 📋 **Image Requirements**

### **Supported Formats**
- ✅ **JPG/JPEG** - Best for photographs
- ✅ **PNG** - Best for graphics with transparency
- ✅ **WebP** - Best for web (smaller file sizes)
- ✅ **SVG** - Best for icons and graphics

### **Recommended Sizes**
- **Hero Images**: 1200x630px (16:9 ratio)
- **Produce Images**: 800x600px (4:3 ratio)
- **Farm Images**: 1200x800px (3:2 ratio)
- **Thumbnails**: 400x300px

### **File Size Guidelines**
- **Hero Images**: < 500KB
- **Produce Images**: < 300KB
- **Farm Images**: < 400KB
- **Thumbnails**: < 100KB

## 🚀 **How to Add Images**

### **Step 1: Prepare Your Images**
1. Resize to recommended dimensions
2. Optimize for web (compress if needed)
3. Use descriptive filenames

### **Step 2: Upload to Correct Folder**
```bash
# For produce images
cp your-image.jpg farm-companion/farm-frontend/public/images/produce/

# For farm images
cp your-image.jpg farm-companion/farm-frontend/public/images/farms/

# For general images
cp your-image.jpg farm-companion/farm-frontend/public/images/
```

### **Step 3: Reference in Code**
```jsx
// In your React components
import Image from 'next/image'

// For produce images
<Image 
  src="/images/produce/strawberries-fresh.jpg"
  alt="Fresh strawberries"
  width={800}
  height={600}
/>

// For farm images
<Image 
  src="/images/farms/farm-name-exterior.jpg"
  alt="Farm shop exterior"
  width={1200}
  height={800}
/>
```

## 🛠️ **Image Optimization Tips**

### **Before Uploading**
1. **Compress**: Use tools like TinyPNG or ImageOptim
2. **Resize**: Don't upload images larger than needed
3. **Format**: Use WebP when possible for better compression
4. **Naming**: Use descriptive, lowercase names with hyphens

### **Performance Best Practices**
- Use Next.js `Image` component for automatic optimization
- Provide proper `alt` text for accessibility
- Use appropriate `width` and `height` attributes
- Consider using `priority` for above-the-fold images

## 📱 **Responsive Images**

The site automatically handles responsive images. For best results:

```jsx
<Image 
  src="/images/produce/strawberries-fresh.jpg"
  alt="Fresh strawberries"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="rounded-lg"
/>
```

## 🔍 **Image Validation**

Run the image validation script to check your images:

```bash
npm run validate-images
```

This will check for:
- ✅ Proper file formats
- ✅ Appropriate file sizes
- ✅ Descriptive alt text
- ✅ Correct naming conventions

## 📝 **Example Usage**

### **Adding a New Produce Image**
1. Save your image as `public/images/produce/apples-orchard.jpg`
2. Update the produce data in `src/data/produce.ts`:

```typescript
{
  name: "Apples",
  slug: "apples",
  images: [
    {
      url: "/images/produce/apples-orchard.jpg",
      alt: "Fresh apples in the orchard"
    }
  ]
}
```

### **Adding a Farm Image**
1. Save your image as `public/images/farms/sunny-farm-exterior.jpg`
2. Reference it in your farm data or components

## 🎯 **Quick Reference**

| Image Type | Folder | Example Filename | Recommended Size |
|------------|--------|------------------|------------------|
| Produce | `produce/` | `strawberries-fresh.jpg` | 800x600px |
| Farm | `farms/` | `farm-name-exterior.jpg` | 1200x800px |
| Hero | `images/` | `hero-background.jpg` | 1200x630px |
| Icon | `images/` | `farm-icon.svg` | 64x64px |

## 🚨 **Important Notes**

- **Never** upload images directly to the `src/` folder
- **Always** use the `public/images/` directory
- **Always** provide descriptive alt text for accessibility
- **Always** optimize images before uploading
- **Test** your images on different screen sizes

## 📞 **Need Help?**

If you have questions about adding images or need help with optimization, check the image validation script or refer to the Next.js Image documentation.
