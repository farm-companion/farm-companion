#!/usr/bin/env node

const { head } = require('@vercel/blob')

async function checkBlobUrl() {
  try {
    console.log('🔍 Checking blob URLs...')
    
    // Test the problematic photo
    const objectKey = 'farm-photos/priory-farm-shop/cd148309-22e1-4083-b475-f9a6b9c2ebc1/main.jpg'
    
    console.log(`Checking object key: ${objectKey}`)
    
    const blobInfo = await head(objectKey)
    
    if (blobInfo) {
      console.log('✅ Blob exists!')
      console.log('Blob info:', {
        url: blobInfo.url,
        size: blobInfo.size,
        uploadedAt: blobInfo.uploadedAt,
        pathname: blobInfo.pathname
      })
      
      // Test the URL from the blob info
      console.log('\n🔗 Testing the actual blob URL...')
      const response = await fetch(blobInfo.url, { method: 'HEAD' })
      console.log(`URL: ${blobInfo.url}`)
      console.log(`Status: ${response.status}`)
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
      
    } else {
      console.log('❌ Blob not found')
    }
    
  } catch (error) {
    console.error('❌ Error checking blob:', error)
  }
}

checkBlobUrl()
