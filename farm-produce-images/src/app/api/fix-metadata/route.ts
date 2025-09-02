import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting metadata fix...')
    
    let fixedCount = 0
    let errors: string[] = []
    
    // Get all image keys from Redis
    const keys = await redis.keys('image:*')
    console.log(`Found ${keys.length} image records`)
    
    for (const key of keys) {
      try {
        const imageData = await redis.get(key)
        if (!imageData) continue
        
        const image = JSON.parse(imageData)
        let needsUpdate = false
        
        // Check if image is missing produceSlug or month fields
        if (!image.produceSlug || !image.month) {
          // Extract from URL path: /produce/{produceSlug}/{month}/{filename}
          const urlParts = image.url.split('/')
          const produceIndex = urlParts.findIndex(part => part === 'produce')
          
          if (produceIndex !== -1 && urlParts.length > produceIndex + 2) {
            const produceSlug = urlParts[produceIndex + 1]
            const month = parseInt(urlParts[produceIndex + 2], 10)
            
            if (produceSlug && !isNaN(month) && month >= 1 && month <= 12) {
              // Update the image metadata
              if (!image.produceSlug) {
                image.produceSlug = produceSlug
                needsUpdate = true
              }
              if (!image.month) {
                image.month = month
                needsUpdate = true
              }
              
              if (needsUpdate) {
                // Save back to Redis
                await redis.set(key, JSON.stringify(image))
                fixedCount++
                console.log(`✅ Fixed ${image.alt}: produceSlug=${produceSlug}, month=${month}`)
              }
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to fix ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
    
    console.log(`🔧 Metadata fix completed: ${fixedCount} records fixed`)
    
    return NextResponse.json({
      success: true,
      message: `Metadata fix completed`,
      fixedCount,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('💥 Metadata fix error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Metadata fix failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
