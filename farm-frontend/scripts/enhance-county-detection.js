const fs = require('fs');
const path = require('path');

// Enhanced UK postcode to county mapping
const POSTCODE_TO_COUNTY = {
  'AB': 'Aberdeenshire',
  'AL': 'Hertfordshire',
  'B': 'West Midlands',
  'BA': 'Somerset',
  'BB': 'Lancashire',
  'BD': 'West Yorkshire',
  'BH': 'Dorset',
  'BL': 'Greater Manchester',
  'BN': 'East Sussex',
  'BR': 'Greater London',
  'BS': 'Bristol',
  'BT': 'Northern Ireland',
  'CA': 'Cumbria',
  'CB': 'Cambridgeshire',
  'CF': 'Cardiff',
  'CH': 'Cheshire',
  'CM': 'Essex',
  'CO': 'Essex',
  'CR': 'Greater London',
  'CT': 'Kent',
  'CV': 'Warwickshire',
  'CW': 'Cheshire',
  'DA': 'Kent',
  'DD': 'Dundee',
  'DE': 'Derbyshire',
  'DG': 'Dumfries and Galloway',
  'DH': 'Durham',
  'DL': 'North Yorkshire',
  'DN': 'South Yorkshire',
  'DT': 'Dorset',
  'DY': 'Worcestershire',
  'E': 'Greater London',
  'EC': 'Greater London',
  'EH': 'Edinburgh',
  'EN': 'Hertfordshire',
  'EX': 'Devon',
  'FK': 'Falkirk',
  'FY': 'Lancashire',
  'G': 'Glasgow',
  'GL': 'Gloucestershire',
  'GU': 'Surrey',
  'HA': 'Greater London',
  'HD': 'West Yorkshire',
  'HG': 'North Yorkshire',
  'HP': 'Buckinghamshire',
  'HR': 'Herefordshire',
  'HS': 'Outer Hebrides',
  'HU': 'East Riding of Yorkshire',
  'HX': 'West Yorkshire',
  'IG': 'Essex',
  'IP': 'Suffolk',
  'IV': 'Highland',
  'KA': 'Ayrshire',
  'KT': 'Surrey',
  'KW': 'Highland',
  'KY': 'Fife',
  'L': 'Merseyside',
  'LA': 'Cumbria',
  'LD': 'Powys',
  'LE': 'Leicestershire',
  'LL': 'Gwynedd',
  'LN': 'Lincolnshire',
  'LS': 'West Yorkshire',
  'LU': 'Bedfordshire',
  'M': 'Greater Manchester',
  'ME': 'Kent',
  'MK': 'Buckinghamshire',
  'ML': 'North Lanarkshire',
  'N': 'Greater London',
  'NE': 'Tyne and Wear',
  'NG': 'Nottinghamshire',
  'NN': 'Northamptonshire',
  'NP': 'Newport',
  'NR': 'Norfolk',
  'NW': 'Greater London',
  'OL': 'Lancashire',
  'OX': 'Oxfordshire',
  'PA': 'Renfrewshire',
  'PE': 'Lincolnshire',
  'PH': 'Perth and Kinross',
  'PL': 'Cornwall',
  'PO': 'West Sussex',
  'PR': 'Lancashire',
  'RG': 'Berkshire',
  'RH': 'West Sussex',
  'RM': 'Essex',
  'S': 'South Yorkshire',
  'SA': 'Swansea',
  'SE': 'Greater London',
  'SG': 'Hertfordshire',
  'SK': 'Derbyshire',
  'SL': 'Berkshire',
  'SM': 'Surrey',
  'SN': 'Wiltshire',
  'SO': 'Hampshire',
  'SP': 'Wiltshire',
  'SR': 'Tyne and Wear',
  'SS': 'Essex',
  'ST': 'Staffordshire',
  'SW': 'Greater London',
  'SY': 'Shropshire',
  'TA': 'Somerset',
  'TD': 'Scottish Borders',
  'TF': 'Shropshire',
  'TN': 'Kent',
  'TQ': 'Devon',
  'TR': 'Cornwall',
  'TS': 'Cleveland',
  'TW': 'Greater London',
  'UB': 'Greater London',
  'W': 'Greater London',
  'WA': 'Cheshire',
  'WC': 'Greater London',
  'WD': 'Hertfordshire',
  'WF': 'West Yorkshire',
  'WN': 'Greater Manchester',
  'WR': 'Worcestershire',
  'WS': 'Staffordshire',
  'WV': 'West Midlands',
  'YO': 'North Yorkshire',
  'ZE': 'Shetland Islands'
};

// Coordinate-based county detection (simplified regions)
function detectCountyFromCoordinates(lat, lng) {
  // Scotland
  if (lat >= 55.0 && lng >= -8.0) {
    if (lat >= 57.0) return 'Highland';
    if (lat >= 56.0 && lng >= -4.0) return 'Edinburgh';
    if (lat >= 55.5 && lng >= -4.5) return 'Glasgow';
    return 'Scotland';
  }
  
  // Northern Ireland
  if (lat >= 54.0 && lat <= 55.5 && lng >= -8.0 && lng <= -5.0) {
    return 'Northern Ireland';
  }
  
  // Wales
  if (lat >= 51.5 && lat <= 53.5 && lng >= -5.0 && lng <= -2.5) {
    if (lat >= 52.5) return 'Gwynedd';
    if (lat >= 51.8 && lng >= -3.5) return 'Cardiff';
    return 'Wales';
  }
  
  // England regions
  if (lat >= 54.0 && lat <= 55.5) {
    if (lng >= -2.0) return 'North Yorkshire';
    if (lng >= -3.0) return 'West Yorkshire';
    return 'Cumbria';
  }
  
  if (lat >= 53.0 && lat <= 54.0) {
    if (lng >= -2.5) return 'West Yorkshire';
    if (lng >= -3.0) return 'Greater Manchester';
    if (lng >= -4.0) return 'Lancashire';
    return 'Cheshire';
  }
  
  if (lat >= 52.0 && lat <= 53.0) {
    if (lng >= -2.0) return 'Derbyshire';
    if (lng >= -3.0) return 'Staffordshire';
    if (lng >= -4.0) return 'Shropshire';
    return 'Herefordshire';
  }
  
  if (lat >= 51.0 && lat <= 52.0) {
    if (lng >= -1.0) return 'Oxfordshire';
    if (lng >= -2.0) return 'Gloucestershire';
    if (lng >= -3.0) return 'Somerset';
    return 'Devon';
  }
  
  if (lat >= 50.0 && lat <= 51.0) {
    if (lng >= -1.0) return 'Hampshire';
    if (lng >= -2.0) return 'Dorset';
    return 'Cornwall';
  }
  
  // London and surrounding areas
  if (lat >= 51.0 && lat <= 52.0 && lng >= -1.0 && lng <= 1.0) {
    if (lat >= 51.4 && lat <= 51.7 && lng >= -0.5 && lng <= 0.5) {
      return 'Greater London';
    }
    if (lat >= 51.7) return 'Hertfordshire';
    if (lat <= 51.4) return 'Surrey';
    if (lng >= 0.5) return 'Essex';
    if (lng <= -0.5) return 'Berkshire';
  }
  
  return null;
}

function enhanceCountyDetection() {
  console.log('🔧 Enhancing county detection...');
  
  const farmsPath = path.join(__dirname, '../public/data/farms.uk.json');
  const farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
  
  let enhancedCount = 0;
  let coordinateBasedCount = 0;
  
  const enhancedFarms = farms.map(farm => {
    // Skip if already has a proper county
    if (farm.location?.county && farm.location.county !== 'Unknown County') {
      return farm;
    }
    
    let county = null;
    
    // Method 1: Try postcode
    if (farm.location?.postcode && farm.location.postcode !== 'UK') {
      const outwardCode = farm.location.postcode.split(' ')[0].toUpperCase();
      for (let i = 2; i >= 1; i--) {
        const prefix = outwardCode.substring(0, i);
        if (POSTCODE_TO_COUNTY[prefix]) {
          county = POSTCODE_TO_COUNTY[prefix];
          enhancedCount++;
          break;
        }
      }
    }
    
    // Method 2: Try address keywords
    if (!county && farm.location?.address) {
      const addressLower = farm.location.address.toLowerCase();
      const addressKeywords = {
        'london': 'Greater London',
        'manchester': 'Greater Manchester',
        'birmingham': 'West Midlands',
        'leeds': 'West Yorkshire',
        'liverpool': 'Merseyside',
        'sheffield': 'South Yorkshire',
        'edinburgh': 'Edinburgh',
        'glasgow': 'Glasgow',
        'bristol': 'Bristol',
        'cardiff': 'Cardiff',
        'newcastle': 'Tyne and Wear',
        'leicester': 'Leicestershire',
        'cambridge': 'Cambridgeshire',
        'oxford': 'Oxfordshire',
        'bath': 'Somerset',
        'york': 'North Yorkshire',
        'norwich': 'Norfolk',
        'plymouth': 'Devon',
        'southampton': 'Hampshire',
        'portsmouth': 'Hampshire',
        'brighton': 'East Sussex',
        'bournemouth': 'Dorset',
        'reading': 'Berkshire',
        'luton': 'Bedfordshire',
        'nottingham': 'Nottinghamshire',
        'derby': 'Derbyshire',
        'stoke': 'Staffordshire',
        'wolverhampton': 'West Midlands',
        'coventry': 'West Midlands',
        'sunderland': 'Tyne and Wear',
        'bolton': 'Greater Manchester',
        'stockport': 'Greater Manchester',
        'oldham': 'Greater Manchester',
        'rochdale': 'Greater Manchester',
        'salford': 'Greater Manchester',
        'wigan': 'Greater Manchester',
        'warrington': 'Cheshire',
        'blackburn': 'Lancashire',
        'blackpool': 'Lancashire',
        'preston': 'Lancashire',
        'lancaster': 'Lancashire',
        'chester': 'Cheshire',
        'halifax': 'West Yorkshire',
        'huddersfield': 'West Yorkshire',
        'bradford': 'West Yorkshire',
        'wakefield': 'West Yorkshire',
        'doncaster': 'South Yorkshire',
        'rotherham': 'South Yorkshire',
        'barnsley': 'South Yorkshire',
        'hull': 'East Riding of Yorkshire',
        'grimsby': 'Lincolnshire',
        'scunthorpe': 'Lincolnshire',
        'lincoln': 'Lincolnshire',
        'peterborough': 'Cambridgeshire',
        'ipswich': 'Suffolk',
        'colchester': 'Essex',
        'southend': 'Essex',
        'basildon': 'Essex',
        'chelmsford': 'Essex',
        'brentwood': 'Essex',
        'harlow': 'Essex',
        'watford': 'Hertfordshire',
        'st albans': 'Hertfordshire',
        'hemel hempstead': 'Hertfordshire',
        'welwyn': 'Hertfordshire',
        'stevenage': 'Hertfordshire',
        'bedford': 'Bedfordshire',
        'milton keynes': 'Buckinghamshire',
        'aylesbury': 'Buckinghamshire',
        'high wycombe': 'Buckinghamshire',
        'slough': 'Berkshire',
        'bracknell': 'Berkshire',
        'maidenhead': 'Berkshire',
        'windsor': 'Berkshire',
        'guildford': 'Surrey',
        'woking': 'Surrey',
        'reigate': 'Surrey',
        'crawley': 'West Sussex',
        'worthing': 'West Sussex',
        'eastbourne': 'East Sussex',
        'hastings': 'East Sussex',
        'canterbury': 'Kent',
        'dover': 'Kent',
        'folkestone': 'Kent',
        'maidstone': 'Kent',
        'rochester': 'Kent',
        'tunbridge wells': 'Kent',
        'medway': 'Kent',
        'ashford': 'Kent',
        'margate': 'Kent',
        'ramsgate': 'Kent',
        'dartford': 'Kent',
        'gravesend': 'Kent',
        'sittingbourne': 'Kent',
        'chatham': 'Kent',
        'gillingham': 'Kent',
        'sevenoaks': 'Kent',
        'tonbridge': 'Kent',
        'cranbrook': 'Kent',
        'deal': 'Kent',
        'sandwich': 'Kent',
        'whitstable': 'Kent',
        'herne bay': 'Kent',
        'broadstairs': 'Kent',
        'faversham': 'Kent',
        'tenterden': 'Kent'
      };
      
      for (const [keyword, detectedCounty] of Object.entries(addressKeywords)) {
        if (addressLower.includes(keyword)) {
          county = detectedCounty;
          enhancedCount++;
          break;
        }
      }
    }
    
    // Method 3: Coordinate-based detection
    if (!county && farm.location?.lat && farm.location?.lng) {
      const detectedCounty = detectCountyFromCoordinates(farm.location.lat, farm.location.lng);
      if (detectedCounty) {
        county = detectedCounty;
        coordinateBasedCount++;
      }
    }
    
    if (county) {
      return {
        ...farm,
        location: {
          ...farm.location,
          county: county
        }
      };
    }
    
    // If we still can't determine county, keep as unknown
    return farm;
  });
  
  console.log(`✅ Enhanced counties for ${enhancedCount} farms`);
  console.log(`🗺️ Coordinate-based detection for ${coordinateBasedCount} farms`);
  console.log(`📊 Total farms processed: ${farms.length}`);
  
  // Count remaining unknown counties
  const unknownCount = enhancedFarms.filter(farm => 
    farm.location?.county === 'Unknown County'
  ).length;
  
  console.log(`❓ Remaining unknown counties: ${unknownCount}`);
  console.log(`📈 County coverage: ${(((farms.length - unknownCount) / farms.length) * 100).toFixed(1)}%`);
  
  // Save enhanced data
  fs.writeFileSync(farmsPath, JSON.stringify(enhancedFarms, null, 2));
  console.log('💾 Enhanced farm data saved');
  
  return enhancedFarms;
}

// Run the enhancement
const enhancedFarms = enhanceCountyDetection();
console.log('\n🎯 County enhancement complete!');
