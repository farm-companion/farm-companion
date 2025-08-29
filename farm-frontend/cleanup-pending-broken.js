const { createClient } = require('redis');
const fs = require('fs');

// Read Redis URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const redisUrlMatch = envContent.match(/REDIS_URL="([^"]+)"/);
const redisUrl = redisUrlMatch ? redisUrlMatch[1] : null;

if (!redisUrl) {
  console.error('❌ REDIS_URL not found in .env.local');
  process.exit(1);
}

async function checkBlobExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function cleanupPendingBroken() {
  const redis = createClient({
    url: redisUrl,
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis');

    // Get all pending photo IDs
    const pendingIds = await redis.lRange('moderation:queue', 0, -1);
    console.log(`\n⏳ Checking ${pendingIds.length} pending photos...`);
    
    const brokenPhotos = [];
    const validPhotos = [];

    // Check each pending photo
    for (const id of pendingIds) {
      const photoData = await redis.hGetAll(`photo:${id}`);
      const url = photoData.url;
      
      console.log(`\n🔍 Checking pending photo ${id}:`);
      console.log('  URL:', url);
      
      const exists = await checkBlobExists(url);
      
      if (exists) {
        console.log('  ✅ Photo exists in blob storage');
        validPhotos.push(id);
      } else {
        console.log('  ❌ Photo NOT found in blob storage');
        brokenPhotos.push({ id, url, photoData });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Valid pending photos: ${validPhotos.length}`);
    console.log(`  ❌ Broken pending photos: ${brokenPhotos.length}`);

    if (brokenPhotos.length > 0) {
      console.log(`\n🗑️ Removing ${brokenPhotos.length} broken pending photos...`);
      
      for (const photo of brokenPhotos) {
        try {
          // Remove from pending queue
          await redis.lRem('moderation:queue', 0, photo.id);
          
          // Delete photo metadata
          await redis.del(`photo:${photo.id}`);
          
          console.log(`  ✅ Removed pending photo ${photo.id}`);
        } catch (error) {
          console.error(`  ❌ Error removing pending photo ${photo.id}:`, error);
        }
      }
      
      console.log(`\n✅ Cleanup complete! Removed ${brokenPhotos.length} broken pending photos.`);
    } else {
      console.log(`\n✅ All pending photos are valid! No cleanup needed.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.disconnect();
  }
}

cleanupPendingBroken();
