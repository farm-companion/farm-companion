const fs = require('fs');
const path = require('path');

// UK bounds for coordinate validation
const UK_BOUNDS = {
  lat: { min: 49.9, max: 60.9 },
  lng: { min: -8.6, max: 1.8 }
};

// Counties data for enhancement
const countiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/counties.uk.json'), 'utf8'));

function validateFarmData() {
  console.log('🔍 Starting farm data validation...');
  
  const farmsPath = path.join(__dirname, '../public/data/farms.uk.json');
  const farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
  
  console.log(`📊 Total farms: ${farms.length}`);
  
  let validFarms = 0;
  let invalidFarms = 0;
  let enhancedFarms = [];
  const issues = [];
  
  // Process each farm
  farms.forEach((farm, index) => {
    const farmIssues = [];
    
    // Check required fields
    if (!farm.name) farmIssues.push('Missing name');
    if (!farm.location) farmIssues.push('Missing location');
    if (!farm.contact) farmIssues.push('Missing contact');
    
    // Validate coordinates
    if (farm.location) {
      const { lat, lng } = farm.location;
      
      if (lat === null || lng === null || lat === undefined || lng === undefined) {
        farmIssues.push('Missing coordinates');
      } else if (typeof lat !== 'number' || typeof lng !== 'number') {
        farmIssues.push('Invalid coordinate types');
      } else if (lat < UK_BOUNDS.lat.min || lat > UK_BOUNDS.lat.max || 
                 lng < UK_BOUNDS.lng.min || lng > UK_BOUNDS.lng.max) {
        farmIssues.push('Coordinates outside UK bounds');
      } else if (lat === 0 && lng === 0) {
        farmIssues.push('Invalid coordinates (0,0)');
      }
    }
    
    // Check county data
    if (!farm.location?.county || farm.location.county === '') {
      farmIssues.push('Missing county');
    }
    
    if (farmIssues.length > 0) {
      invalidFarms++;
      issues.push({
        farmId: farm.id,
        farmName: farm.name,
        issues: farmIssues
      });
    } else {
      validFarms++;
      
      // Enhance farm data with county information
      const enhancedFarm = {
        ...farm,
        location: {
          ...farm.location,
          county: farm.location.county || 'Unknown County'
        }
      };
      
      // Add region information if county matches
      const countyInfo = countiesData.find(c => 
        c.name.toLowerCase() === farm.location.county.toLowerCase()
      );
      
      if (countyInfo) {
        enhancedFarm.location.region = countyInfo.region;
      }
      
      enhancedFarms.push(enhancedFarm);
    }
  });
  
  // Remove duplicates by ID
  const uniqueFarms = enhancedFarms.filter((farm, index, self) => 
    index === self.findIndex(f => f.id === farm.id)
  );
  
  console.log(`✅ Valid farms: ${validFarms}`);
  console.log(`❌ Invalid farms: ${invalidFarms}`);
  console.log(`🔄 Enhanced farms: ${uniqueFarms.length}`);
  console.log(`📈 Data quality score: ${((validFarms / farms.length) * 100).toFixed(1)}%`);
  
  // Save enhanced data
  fs.writeFileSync(farmsPath, JSON.stringify(uniqueFarms, null, 2));
  console.log('💾 Enhanced farm data saved');
  
  // Log issues for review
  if (issues.length > 0) {
    console.log('\n⚠️ Issues found:');
    issues.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.farmName} (${issue.farmId}): ${issue.issues.join(', ')}`);
    });
    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more issues`);
    }
  }
  
  return {
    total: farms.length,
    valid: validFarms,
    invalid: invalidFarms,
    enhanced: uniqueFarms.length,
    qualityScore: (validFarms / farms.length) * 100,
    issues
  };
}

// Run validation
const results = validateFarmData();
console.log('\n🎯 Validation complete!');
console.log(`📊 Final stats: ${results.enhanced} farms ready for map display`);
