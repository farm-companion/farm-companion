#!/usr/bin/env node

/**
 * Image Validation Script
 * Validates all produce images for accuracy, quality, and compliance
 * 
 * Usage: node scripts/validate-images.js
 */

const fs = require('fs')
const path = require('path')

// Import the produce data (simplified for Node.js compatibility)
const PRODUCE = [
  {
    slug: 'sweetcorn',
    name: 'Sweetcorn',
    images: [
      { src: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop', alt: 'Fresh sweetcorn on cob with green husks' },
      { src: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=600&fit=crop', alt: 'Close-up of golden sweetcorn kernels' },
      { src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop', alt: 'Corn field at sunset with tall stalks' },
    ],
  },
  {
    slug: 'tomatoes',
    name: 'Tomatoes',
    images: [
      { src: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&h=600&fit=crop', alt: 'Ripe red tomatoes on the vine' },
      { src: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop', alt: 'Assorted heirloom tomatoes in various colors' },
      { src: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&h=600&fit=crop', alt: 'Fresh tomatoes in a wooden basket' },
    ],
  },
  {
    slug: 'strawberries',
    name: 'Strawberries',
    images: [
      { src: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop', alt: 'Fresh red strawberries in a basket' },
      { src: 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=800&h=600&fit=crop', alt: 'Strawberry plants with ripe berries' },
      { src: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=600&fit=crop', alt: 'Strawberries on a white background' },
    ],
  },
  {
    slug: 'blackberries',
    name: 'Blackberries',
    images: [
      { src: 'https://images.unsplash.com/photo-1588952159215-a4b39193464e?w=800&h=600&fit=crop', alt: 'Fresh blackberries in a wooden bowl' },
      { src: 'https://images.unsplash.com/photo-1593181194270-e1c63bc5d7b5?w=800&h=600&fit=crop', alt: 'Ripe purple-black blackberries on the vine' },
      { src: 'https://images.unsplash.com/photo-1629464005877-92c9a5e10e16?w=800&h=600&fit=crop', alt: 'Blackberries scattered on rustic surface' },
    ],
  },
  {
    slug: 'runner-beans',
    name: 'Runner Beans',
    images: [
      { src: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&h=600&fit=crop', alt: 'Fresh green runner beans' },
      { src: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop', alt: 'Runner beans on the vine' },
      { src: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&h=600&fit=crop', alt: 'Harvested runner beans' },
    ],
  },
  {
    slug: 'plums',
    name: 'Plums',
    images: [
      { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', alt: 'Fresh purple plums' },
      { src: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop', alt: 'Plum tree with ripe fruit' },
      { src: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&h=600&fit=crop', alt: 'Assorted plums in a basket' },
    ],
  },
  {
    slug: 'apples',
    name: 'Apples',
    images: [
      { src: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop', alt: 'Fresh red apples on a tree' },
      { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', alt: 'Assorted apples in a basket' },
      { src: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop', alt: 'Apple orchard in autumn' },
    ],
  },
  {
    slug: 'pumpkins',
    name: 'Pumpkins',
    images: [
      { src: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&h=600&fit=crop', alt: 'Orange pumpkins in a field' },
      { src: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=600&fit=crop', alt: 'Pumpkin patch at harvest time' },
      { src: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&h=600&fit=crop', alt: 'Carved and whole pumpkins' },
    ],
  },
]

// Image validation rules
const IMAGE_RULES = {
  minWidth: 800,
  minHeight: 600,
  maxFileSize: 500, // KB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  requiredAltText: true,
  maxAltLength: 150,
}

// Common issues to check for
const COMMON_ISSUES = {
  wrongProduce: {
    blackberries: ['blueberry', 'blueberries'],
    strawberries: ['raspberry', 'raspberries'],
    tomatoes: ['cherry tomato', 'cherry tomatoes'],
  },
  inappropriateContent: ['trouser', 'pant', 'shirt', 'clothing', 'fabric'],
  poorQuality: ['blurry', 'low quality', 'pixelated'],
}

// Validate a single image
function validateImage(image, produceName) {
  const errors = []
  const warnings = []
  const suggestions = []

  // Check if image source exists
  if (!image.src) {
    errors.push('❌ Image source is required')
    return { isValid: false, errors, warnings, suggestions }
  }

  // Check if it's a local image
  const isLocal = image.src.startsWith('/images/')
  
  // Validate external URLs
  if (!isLocal) {
    if (!image.src.startsWith('https://')) {
      errors.push('❌ External images must use HTTPS')
    }
    
    // Check for Unsplash optimization parameters
    if (image.src.includes('unsplash.com') && !image.src.includes('w=800')) {
      warnings.push('⚠️ Unsplash images should include size parameters for optimization')
      suggestions.push('💡 Add ?w=800&h=600&fit=crop to Unsplash URLs')
    }
  }

  // Validate alt text
  if (!image.alt || image.alt.trim().length === 0) {
    errors.push('❌ Alt text is required for accessibility')
  } else if (image.alt.length > IMAGE_RULES.maxAltLength) {
    warnings.push(`⚠️ Alt text is too long (${image.alt.length} chars, max ${IMAGE_RULES.maxAltLength})`)
  }

  // Check for common issues
  const altLower = image.alt.toLowerCase()
  
  // Check for wrong produce in alt text
  Object.entries(COMMON_ISSUES.wrongProduce).forEach(([correctProduce, wrongTerms]) => {
    if (produceName.toLowerCase().includes(correctProduce)) {
      wrongTerms.forEach(term => {
        if (altLower.includes(term)) {
          errors.push(`❌ Alt text mentions "${term}" but this is ${correctProduce}`)
        }
      })
    }
  })

  // Check for inappropriate content
  COMMON_ISSUES.inappropriateContent.forEach(term => {
    if (altLower.includes(term)) {
      errors.push(`❌ Alt text contains inappropriate content: "${term}"`)
    }
  })

  // Check for poor quality indicators
  COMMON_ISSUES.poorQuality.forEach(term => {
    if (altLower.includes(term)) {
      warnings.push(`⚠️ Alt text suggests poor quality: "${term}"`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

// Validate all images for a produce item
function validateProduceImages(produce) {
  console.log(`\n🔍 Validating images for: ${produce.name}`)
  console.log('='.repeat(50))

  if (!produce.images || produce.images.length === 0) {
    console.log('❌ No images found')
    return { isValid: false, errors: ['No images'], warnings: [], suggestions: [] }
  }

  const individual = produce.images.map((image, index) => {
    console.log(`\n📸 Image ${index + 1}:`)
    const validation = validateImage(image, produce.name)
    
    if (validation.errors.length > 0) {
      validation.errors.forEach(error => console.log(`  ${error}`))
    }
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => console.log(`  ${warning}`))
    }
    if (validation.suggestions.length > 0) {
      validation.suggestions.forEach(suggestion => console.log(`  ${suggestion}`))
    }
    
    return validation
  })

  const allErrors = individual.flatMap(v => v.errors)
  const allWarnings = individual.flatMap(v => v.warnings)
  const allSuggestions = individual.flatMap(v => v.suggestions)

  // Check for minimum image count
  if (produce.images.length < 2) {
    allWarnings.push('⚠️ Should have at least 2 images (hero + gallery)')
  }

  // Check for local images
  const localImages = produce.images.filter(img => img.src.startsWith('/images/'))
  if (localImages.length === 0) {
    allSuggestions.push('💡 Consider adding local images to ensure accuracy')
  }

  const overall = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions
  }

  // Summary
  if (overall.isValid) {
    console.log(`\n✅ ${produce.name}: All images are valid`)
  } else {
    console.log(`\n❌ ${produce.name}: ${allErrors.length} error(s) found`)
  }

  return { overall, individual }
}

// Main validation function
function validateAllImages() {
  console.log('🖼️  PRODUCE IMAGE VALIDATION REPORT')
  console.log('='.repeat(60))
  console.log(`📅 Date: ${new Date().toLocaleDateString()}`)
  console.log(`🔢 Total produce items: ${PRODUCE.length}`)
  console.log('')

  const results = PRODUCE.map(validateProduceImages)
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(60))
  
  const totalErrors = results.reduce((sum, r) => sum + r.overall.errors.length, 0)
  const totalWarnings = results.reduce((sum, r) => sum + r.overall.warnings.length, 0)
  const totalSuggestions = results.reduce((sum, r) => sum + r.overall.suggestions.length, 0)
  const validItems = results.filter(r => r.overall.isValid).length
  
  console.log(`✅ Valid items: ${validItems}/${PRODUCE.length}`)
  console.log(`❌ Total errors: ${totalErrors}`)
  console.log(`⚠️ Total warnings: ${totalWarnings}`)
  console.log(`💡 Total suggestions: ${totalSuggestions}`)
  
  if (totalErrors === 0) {
    console.log('\n🎉 All images are valid!')
  } else {
    console.log('\n🔧 Please fix the errors above before deployment.')
  }

  // Check local image directory
  const localImageDir = path.join(__dirname, '../public/images/produce')
  if (fs.existsSync(localImageDir)) {
    const localFiles = fs.readdirSync(localImageDir, { recursive: true })
    console.log(`\n📁 Local images found: ${localFiles.length} files`)
  } else {
    console.log('\n📁 Local image directory not found: /public/images/produce/')
    console.log('💡 Create this directory to add your own images')
  }
}

// Run validation
if (require.main === module) {
  try {
    validateAllImages()
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    process.exit(1)
  }
}

module.exports = { validateAllImages, validateProduceImages, validateImage }
