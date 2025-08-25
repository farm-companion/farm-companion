const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Simple fetch implementation for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData)
          });
        } catch (error) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve({ data })
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test data
const testFarm = {
  name: "Test Farm Shop",
  slug: "test-farm-shop",
  location: {
    address: "123 Test Lane",
    county: "Devon",
    postcode: "EX1 1AA",
    lat: 50.7,
    lng: -3.5
  },
  contact: {
    email: "test@farmcompanion.co.uk",
    phone: "01392 123456",
    website: "https://testfarm.co.uk"
  },
  offerings: ["vegetables", "fruits", "eggs"],
  story: "A wonderful test farm with fresh produce",
  images: [
    {
      id: "img1",
      name: "test-image-1.jpg",
      size: 1024000,
      type: "image/jpeg",
      url: "https://example.com/test1.jpg"
    }
  ]
};

async function testFarmSubmission() {
  console.log('🧪 Testing Farm Submission System...\n');

  try {
    // Test 1: Submit a new farm
    console.log('📝 Test 1: Submitting new farm...');
    const response = await fetch('http://localhost:3001/api/farms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testFarm)
    });

    const result = await response.json();
    console.log('✅ Submission result:', result);

    if (result.success && result.farmId) {
      const farmId = result.farmId;
      console.log(`✅ Farm submitted successfully with ID: ${farmId}\n`);

      // Test 2: Check status tracking
      console.log('📊 Test 2: Checking status tracking...');
      const statusResponse = await fetch(`http://localhost:3001/api/farms/status/${farmId}`);
      const statusResult = await statusResponse.json();
      console.log('✅ Status result:', statusResult);

      // Test 3: Check admin farms endpoint (this would require auth in real scenario)
      console.log('\n🔐 Test 3: Checking admin farms endpoint...');
      try {
        const adminResponse = await fetch('http://localhost:3001/api/admin/farms');
        const adminResult = await adminResponse.json();
        console.log('✅ Admin farms result:', adminResult);
      } catch (error) {
        console.log('⚠️ Admin endpoint requires authentication (expected)');
      }

      // Test 4: Check file creation
      console.log('\n📁 Test 4: Checking file creation...');
      const farmsDir = path.join(process.cwd(), 'data', 'farms');
      const farmFile = path.join(farmsDir, `${farmId}.json`);
      
      try {
        const fileContent = await fs.readFile(farmFile, 'utf-8');
        const savedFarm = JSON.parse(fileContent);
        console.log('✅ Farm file created successfully');
        console.log('📋 Farm details:', {
          id: savedFarm.id,
          name: savedFarm.name,
          status: savedFarm.status,
          submittedAt: savedFarm.submittedAt
        });
      } catch (error) {
        console.log('❌ Error reading farm file:', error.message);
      }

      // Test 5: Test duplicate detection
      console.log('\n🔄 Test 5: Testing duplicate detection...');
      const duplicateResponse = await fetch('http://localhost:3001/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFarm)
      });

      const duplicateResult = await duplicateResponse.json();
      if (duplicateResult.error && duplicateResult.error.includes('already been submitted')) {
        console.log('✅ Duplicate detection working correctly');
      } else {
        console.log('❌ Duplicate detection failed');
      }

    } else {
      console.log('❌ Farm submission failed:', result);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function testValidation() {
  console.log('\n🔍 Testing Validation...\n');

  const invalidTests = [
    {
      name: "Missing required fields",
      data: { name: "Test Farm" }, // Missing location
      expectedError: "Missing required fields"
    },
    {
      name: "Invalid email format",
      data: {
        ...testFarm,
        contact: { ...testFarm.contact, email: "invalid-email" }
      },
      expectedError: "Invalid email format"
    },
    {
      name: "Invalid website format",
      data: {
        ...testFarm,
        contact: { ...testFarm.contact, website: "not-a-url" }
      },
      expectedError: "Website must start with http:// or https://"
    },
    {
      name: "Invalid postcode format",
      data: {
        ...testFarm,
        location: { ...testFarm.location, postcode: "INVALID" }
      },
      expectedError: "Please enter a valid UK postcode"
    }
  ];

  for (const test of invalidTests) {
    console.log(`📝 Testing: ${test.name}...`);
    try {
      const response = await fetch('http://localhost:3001/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data)
      });

      const result = await response.json();
      if (result.error && result.error.includes(test.expectedError)) {
        console.log(`✅ ${test.name} - Validation working correctly`);
      } else {
        console.log(`❌ ${test.name} - Validation failed:`, result);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Test failed:`, error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Farm Submission System Tests...\n');
  
  await testFarmSubmission();
  await testValidation();
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
