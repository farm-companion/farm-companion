const http = require('http');

async function testMapEndpoints() {
  console.log('🧪 Testing Map Functionality (Simple HTTP Test)...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Check if server is running
  console.log('1️⃣ Testing server availability...');
  try {
    const response = await makeRequest(`${baseUrl}/`);
    console.log(`✅ Server running: ${response.statusCode}`);
  } catch (error) {
    console.log(`❌ Server not running: ${error.message}`);
    return;
  }
  
  // Test 2: Check map page
  console.log('\n2️⃣ Testing map page...');
  try {
    const response = await makeRequest(`${baseUrl}/map`);
    console.log(`✅ Map page accessible: ${response.statusCode}`);
    
    // Check if page contains map-related content
    if (response.data.includes('map-shell')) {
      console.log('✅ Map container found in HTML');
    } else {
      console.log('❌ Map container not found in HTML');
    }
    
    if (response.data.includes('Google Maps')) {
      console.log('✅ Google Maps references found');
    } else {
      console.log('⚠️  Google Maps references not found');
    }
    
  } catch (error) {
    console.log(`❌ Map page error: ${error.message}`);
  }
  
  // Test 3: Check API endpoints
  console.log('\n3️⃣ Testing API endpoints...');
  
  const apis = [
    '/api/farms',
    '/api/w3w/convert?words=test.test.test'
  ];
  
  for (const api of apis) {
    try {
      const response = await makeRequest(`${baseUrl}${api}`);
      console.log(`✅ ${api}: ${response.statusCode}`);
    } catch (error) {
      console.log(`❌ ${api}: ${error.message}`);
    }
  }
  
  // Test 4: Check static assets
  console.log('\n4️⃣ Testing static assets...');
  
  const assets = [
    '/favicon.ico',
    '/overlay-banner.jpg'
  ];
  
  for (const asset of assets) {
    try {
      const response = await makeRequest(`${baseUrl}${asset}`);
      console.log(`✅ ${asset}: ${response.statusCode}`);
    } catch (error) {
      console.log(`❌ ${asset}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Simple Map Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open http://localhost:3000/map in your browser');
  console.log('2. Check browser console for any errors');
  console.log('3. Test map interactions (zoom, pan, search)');
  console.log('4. Test mobile responsiveness');
  console.log('5. Verify farm markers are displayed');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testMapEndpoints().catch(console.error);
