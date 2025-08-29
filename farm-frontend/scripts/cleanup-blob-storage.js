#!/usr/bin/env node

/**
 * Script to clean up blob storage
 * This script will list all farm photos in blob storage and optionally delete them
 */

import { list, del } from '@vercel/blob'

async function cleanupBlobStorage() {
  try {
    console.log('🔍 Scanning blob storage for farm photos...')
    
    // List all blobs with the farm-photos prefix
    const { blobs } = await list({ prefix: 'farm-photos/' })
    
    console.log(`📊 Found ${blobs.length} farm photos in blob storage:`)
    
    if (blobs.length === 0) {
      console.log('✅ No farm photos found in blob storage')
      return
    }
    
    // Display all found blobs
    blobs.forEach((blob, index) => {
      console.log(`${index + 1}. ${blob.pathname} (${blob.size} bytes)`)
    })
    
    // Ask for confirmation before deletion
    console.log('\n⚠️  WARNING: This will permanently delete all farm photos from blob storage!')
    console.log('To proceed with deletion, run this script with the --delete flag:')
    console.log('node scripts/cleanup-blob-storage.js --delete')
    
    // Check if --delete flag is provided
    if (process.argv.includes('--delete')) {
      console.log('\n🗑️  Deleting all farm photos...')
      
      let deletedCount = 0
      for (const blob of blobs) {
        try {
          await del(blob.pathname)
          console.log(`✅ Deleted: ${blob.pathname}`)
          deletedCount++
        } catch (error) {
          console.error(`❌ Failed to delete ${blob.pathname}:`, error.message)
        }
      }
      
      console.log(`\n🎉 Successfully deleted ${deletedCount} out of ${blobs.length} farm photos`)
    } else {
      console.log('\n💡 Run with --delete flag to actually delete the files')
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up blob storage:', error)
  }
}

// Run the script
cleanupBlobStorage()
