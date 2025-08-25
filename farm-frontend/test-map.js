const fs = require('fs');
const path = require('path');

function testMapData() {
  console.log('🧪 Testing Map Data...');
  
  // Test farm data
  const farmsPath = path.join(__dirname, 'public/data/farms.uk.json');
  const farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
  
  console.log(`📊 Total farms: ${farms.length}`);
  
  // Test coordinate validation
  const validFarms = farms.filter(farm => {
    if (!farm.location?.lat || !farm.location?.lng) return false;
    const { lat, lng } = farm.location;
    return lat >= 49.9 && lat <= 60.9 && lng >= -8.6 && lng <= 1.8;
  });
  
  console.log(`✅ Valid UK farms: ${validFarms.length}`);
  console.log(`📈 Map coverage: ${((validFarms.length / farms.length) * 100).toFixed(1)}%`);
  
  // Test county distribution
  const countyCounts = {};
  validFarms.forEach(farm => {
    const county = farm.location.county || 'Unknown';
    countyCounts[county] = (countyCounts[county] || 0) + 1;
  });
  
  console.log('\n🗺️ Top 10 counties by farm count:');
  Object.entries(countyCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([county, count]) => {
      console.log(`  ${county}: ${count} farms`);
    });
  
  // Test sample farm data
  const sampleFarm = validFarms[0];
  if (sampleFarm) {
    console.log('\n🏠 Sample farm data:');
    console.log(`  Name: ${sampleFarm.name}`);
    console.log(`  Location: ${sampleFarm.location.lat}, ${sampleFarm.location.lng}`);
    console.log(`  County: ${sampleFarm.location.county}`);
    console.log(`  Postcode: ${sampleFarm.location.postcode}`);
  }
  
  return {
    total: farms.length,
    valid: validFarms.length,
    coverage: (validFarms.length / farms.length) * 100,
    counties: Object.keys(countyCounts).length
  };
}

const results = testMapData();
console.log('\n🎯 Map data test complete!');
console.log(`📊 Ready to display ${results.valid} farms across ${results.counties} counties`);
