import { NextRequest, NextResponse } from 'next/server'
import { listProduceImages } from '@/lib/storage'
import { saveImageMetadata, getImageMetadata } from '@/lib/database'
import { ProduceImage } from '@/types/produce'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting database sync with blob storage...')
    
    const { searchParams } = new URL(request.url)
    const produceSlug = searchParams.get('produceSlug')
    const month = searchParams.get('month')
    
    let syncedCount = 0
    let errors: string[] = []
    
    if (produceSlug && month) {
      // Sync specific produce/month
      const monthNum = parseInt(month, 10)
      const blobUrls = await listProduceImages(produceSlug, monthNum)
      
      for (const blobUrl of blobUrls) {
        try {
          // Extract filename from URL
          const filename = blobUrl.split('/').pop() || ''
          const imageId = `${produceSlug}-${monthNum}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          // Check if image already exists in database
          const existingImage = await getImageMetadata(imageId)
          if (existingImage) {
            console.log(`Image ${filename} already exists in database`)
            continue
          }
          
          // Determine format from filename
          const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg'
          let format: 'jpeg' | 'png' | 'webp' = 'jpeg'
          if (fileExt === 'png') format = 'png'
          else if (fileExt === 'webp') format = 'webp'
          
          // Create metadata for missing image
          const imageMetadata: ProduceImage = {
            id: imageId,
            url: blobUrl,
            alt: `${produceSlug} - ${filename}`,
            width: 800, // Default dimensions
            height: 600,
            size: 200000, // Default size (200KB)
            format: format,
            uploadedAt: new Date().toISOString(),
            month: monthNum,
            produceSlug,
            isPrimary: false,
            metadata: {
              description: `Synced from blob storage - ${filename}`,
              tags: [produceSlug, monthNum.toString()],
              location: 'Synced',
              photographer: 'System Sync'
            }
          }
          
          // Save to database
          await saveImageMetadata(imageMetadata)
          syncedCount++
          console.log(`✅ Synced ${filename} to database`)
          
        } catch (error) {
          const errorMsg = `Failed to sync ${blobUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }
    } else {
      // Sync all produce types
      const produceTypes = ['apples', 'pumpkins', 'sweetcorn', 'strawberries', 'runner-beans', 'plums', 'blackberries', 'tomato']
      
      for (const slug of produceTypes) {
        for (let month = 1; month <= 12; month++) {
          try {
            const blobUrls = await listProduceImages(slug, month)
            
            for (const blobUrl of blobUrls) {
              try {
                const filename = blobUrl.split('/').pop() || ''
                const imageId = `${slug}-${month}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                
                // Check if image already exists
                const existingImage = await getImageMetadata(imageId)
                if (existingImage) continue
                
                // Determine format from filename
                const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg'
                let format: 'jpeg' | 'png' | 'webp' = 'jpeg'
                if (fileExt === 'png') format = 'png'
                else if (fileExt === 'webp') format = 'webp'
                
                // Create metadata
                const imageMetadata: ProduceImage = {
                  id: imageId,
                  url: blobUrl,
                  alt: `${slug} - ${filename}`,
                  width: 800,
                  height: 600,
                  size: 200000, // Default size (200KB)
                  format: format,
                  uploadedAt: new Date().toISOString(),
                  month,
                  produceSlug: slug,
                  isPrimary: false,
                  metadata: {
                    description: `Synced from blob storage - ${filename}`,
                    tags: [slug, month.toString()],
                    location: 'Synced',
                    photographer: 'System Sync'
                  }
                }
                
                await saveImageMetadata(imageMetadata)
                syncedCount++
                
              } catch (error) {
                const errorMsg = `Failed to sync ${blobUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
                errors.push(errorMsg)
              }
            }
          } catch (error) {
            console.error(`Error syncing ${slug} month ${month}:`, error)
          }
        }
      }
    }
    
    console.log(`🔄 Sync completed: ${syncedCount} images synced`)
    
    return NextResponse.json({
      success: true,
      message: `Database sync completed`,
      syncedCount,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('💥 Sync error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
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
