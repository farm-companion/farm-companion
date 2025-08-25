const fs = require('fs');
const path = require('path');

// UK postcode to county mapping (simplified)
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

// Address keywords to county mapping
const ADDRESS_TO_COUNTY = {
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
  'warrington': 'Cheshire',
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
  'norwich': 'Norfolk',
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
  'luton': 'Bedfordshire',
  'milton keynes': 'Buckinghamshire',
  'aylesbury': 'Buckinghamshire',
  'high wycombe': 'Buckinghamshire',
  'slough': 'Berkshire',
  'reading': 'Berkshire',
  'bracknell': 'Berkshire',
  'maidenhead': 'Berkshire',
  'windsor': 'Berkshire',
  'guildford': 'Surrey',
  'woking': 'Surrey',
  'reigate': 'Surrey',
  'crawley': 'West Sussex',
  'worthing': 'West Sussex',
  'brighton': 'East Sussex',
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
  'tunbridge wells': 'Kent',
  'cranbrook': 'Kent',
  'deal': 'Kent',
  'sandwich': 'Kent',
  'whitstable': 'Kent',
  'herne bay': 'Kent',
  'broadstairs': 'Kent',
  'ramsgate': 'Kent',
  'margate': 'Kent',
  'folkestone': 'Kent',
  'hythe': 'Kent',
  'dover': 'Kent',
  'deal': 'Kent',
  'sandwich': 'Kent',
  'canterbury': 'Kent',
  'faversham': 'Kent',
  'sittingbourne': 'Kent',
  'chatham': 'Kent',
  'gillingham': 'Kent',
  'rochester': 'Kent',
  'maidstone': 'Kent',
  'ashford': 'Kent',
  'tenterden': 'Kent',
  'cranbrook': 'Kent',
  'tonbridge': 'Kent',
  'tunbridge wells': 'Kent',
  'sevenoaks': 'Kent',
  'dartford': 'Kent',
  'gravesend': 'Kent',
  'medway': 'Kent'
};

function extractCountyFromPostcode(postcode) {
  if (!postcode || typeof postcode !== 'string') return null;
  
  // Extract the outward code (first part of postcode)
  const outwardCode = postcode.split(' ')[0].toUpperCase();
  
  // Try to match the first 1-2 characters
  for (let i = 2; i >= 1; i--) {
    const prefix = outwardCode.substring(0, i);
    if (POSTCODE_TO_COUNTY[prefix]) {
      return POSTCODE_TO_COUNTY[prefix];
    }
  }
  
  return null;
}

function extractCountyFromAddress(address) {
  if (!address || typeof address !== 'string') return null;
  
  const addressLower = address.toLowerCase();
  
  // Check for county keywords in address
  for (const [keyword, county] of Object.entries(ADDRESS_TO_COUNTY)) {
    if (addressLower.includes(keyword)) {
      return county;
    }
  }
  
  return null;
}

function fixFarmCounties() {
  console.log('🔧 Starting farm county fix...');
  
  const farmsPath = path.join(__dirname, '../public/data/farms.uk.json');
  const farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
  
  let fixedCount = 0;
  let totalFarms = farms.length;
  
  const enhancedFarms = farms.map(farm => {
    // Skip if already has county
    if (farm.location?.county && farm.location.county !== '') {
      return farm;
    }
    
    let county = null;
    
    // Try to extract from postcode first
    if (farm.location?.postcode) {
      county = extractCountyFromPostcode(farm.location.postcode);
    }
    
    // If no county from postcode, try address
    if (!county && farm.location?.address) {
      county = extractCountyFromAddress(farm.location.address);
    }
    
    // If still no county, try city field
    if (!county && farm.location?.city) {
      county = extractCountyFromAddress(farm.location.city);
    }
    
    if (county) {
      fixedCount++;
      return {
        ...farm,
        location: {
          ...farm.location,
          county: county
        }
      };
    }
    
    // If we can't determine county, mark as unknown
    return {
      ...farm,
      location: {
        ...farm.location,
        county: 'Unknown County'
      }
    };
  });
  
  console.log(`✅ Fixed counties for ${fixedCount} farms`);
  console.log(`📊 Total farms processed: ${totalFarms}`);
  
  // Save enhanced data
  fs.writeFileSync(farmsPath, JSON.stringify(enhancedFarms, null, 2));
  console.log('💾 Enhanced farm data saved');
  
  return enhancedFarms;
}

// Run the fix
const enhancedFarms = fixFarmCounties();
console.log('\n🎯 County fix complete!');
