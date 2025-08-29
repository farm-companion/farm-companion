const fs = require('fs');
const path = require('path');

// Read Redis URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const redisUrlMatch = envContent.match(/REDIS_URL="([^"]+)"/);
const redisUrl = redisUrlMatch ? redisUrlMatch[1] : null;

if (!redisUrl) {
  console.error('❌ REDIS_URL not found in .env.local');
  process.exit(1);
}

async function testUploadProcess() {
  console.log('🧪 Testing Photo Upload Process\n');

  // Step 1: Test upload-url endpoint
  console.log('1️⃣ Testing /api/photos/upload-url...');
  try {
    const reserveResponse = await fetch('http://localhost:3000/api/photos/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmSlug: 'priory-farm-shop',
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024 * 1024, // 1MB
        mode: 'new'
      })
    });

    if (!reserveResponse.ok) {
      const errorText = await reserveResponse.text();
      console.log(`❌ Reserve failed: ${reserveResponse.status} - ${errorText}`);
      return;
    }

    const reserveData = await reserveResponse.json();
    console.log('✅ Reserve successful:', {
      leaseId: reserveData.leaseId,
      objectKey: reserveData.objectKey,
      uploadUrl: reserveData.uploadUrl
    });

    // Step 2: Test upload-blob endpoint
    console.log('\n2️⃣ Testing /api/photos/upload-blob...');
    
    // Create a test file (1KB of random data)
    const testFile = new File(['test image data'.repeat(64)], 'test-image.jpg', { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('pathname', reserveData.objectKey);
    formData.append('contentType', 'image/jpeg');

    const uploadResponse = await fetch(reserveData.uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log(`❌ Upload failed: ${uploadResponse.status} - ${errorText}`);
      return;
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful:', uploadData);

    // Step 3: Test finalize endpoint
    console.log('\n3️⃣ Testing /api/photos/finalize...');
    
    const finalizeResponse = await fetch('http://localhost:3000/api/photos/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaseId: reserveData.leaseId,
        objectKey: reserveData.objectKey,
        caption: 'Test photo from script',
        authorName: 'Test User',
        authorEmail: 'test@example.com'
      })
    });

    if (!finalizeResponse.ok) {
      const errorText = await finalizeResponse.text();
      console.log(`❌ Finalize failed: ${finalizeResponse.status} - ${errorText}`);
      return;
    }

    const finalizeData = await finalizeResponse.json();
    console.log('✅ Finalize successful:', finalizeData);

    // Step 4: Check Redis
    console.log('\n4️⃣ Checking Redis...');
    const { createClient } = require('redis');
    const redis = createClient({ url: redisUrl });
    
    try {
      await redis.connect();
      
      // Check pending photos
      const pendingIds = await redis.lRange('moderation:queue', 0, -1);
      console.log(`📸 Pending photos: ${pendingIds.length}`);
      
      if (pendingIds.length > 0) {
        for (const id of pendingIds) {
          const photoData = await redis.hGetAll(`photo:${id}`);
          console.log(`  Photo ${id}:`, {
            url: photoData.url,
            status: photoData.status,
            farmSlug: photoData.farmSlug
          });
        }
      }

      // Check if blob exists
      if (reserveData.objectKey) {
        console.log('\n5️⃣ Checking if blob exists...');
        try {
          const response = await fetch(`https://blob.vercel-storage.com/${reserveData.objectKey}`, { method: 'HEAD' });
          console.log(`  Blob exists: ${response.ok}`);
          if (!response.ok) {
            console.log(`  Status: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log(`  ❌ Blob check failed: ${error.message}`);
        }
      }

    } finally {
      await redis.disconnect();
    }

    console.log('\n🎉 Upload test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('Please start the server with: pnpm dev');
    return;
  }
  
  await testUploadProcess();
}

main();
