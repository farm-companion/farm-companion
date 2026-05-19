/**
 * UK county landscape characteristics — extracted from
 * `county-image-generator.ts` (Slice 1.1.2k-δ-3) so the generator file
 * stays under the 500-line hard limit. Pure data + a single lookup
 * helper; no side effects.
 */

export interface CountyLandscape {
  terrain: string
  features: string
  atmosphere: string
}

/**
 * UK county landscape characteristics.
 * Authentic topography and natural features for each region.
 */
export const COUNTY_LANDSCAPES: Record<string, CountyLandscape> = {
  // South West
  cornwall: {
    terrain: 'dramatic Cornish cliffs and rugged coastline',
    features: 'wild Atlantic ocean, granite tors, fishing coves',
    atmosphere: 'misty coastal morning, salt spray in the air',
  },
  devon: {
    terrain: 'rolling Devonshire hills and lush green valleys',
    features: 'Dartmoor tors, thatched villages, red earth lanes',
    atmosphere: 'soft golden light through morning mist',
  },
  somerset: {
    terrain: 'Somerset Levels wetlands and Mendip Hills',
    features: 'willow-lined rhynes, cider orchards, ancient churches',
    atmosphere: 'ethereal morning fog over flat marshlands',
  },
  dorset: {
    terrain: 'Jurassic Coast chalk cliffs and rolling downs',
    features: 'Durdle Door arch, Thomas Hardy landscapes, heathland',
    atmosphere: 'dramatic coastal light, white cliffs catching sun',
  },
  wiltshire: {
    terrain: 'Salisbury Plain chalk downland',
    features: 'ancient standing stones, rolling wheat fields, white horses',
    atmosphere: 'mystical morning light over ancient landscape',
  },

  // Cotswolds & Heart of England
  gloucestershire: {
    terrain: 'Cotswold escarpment and golden limestone villages',
    features: 'honey-stone cottages, dry stone walls, beech woodlands',
    atmosphere: 'warm afternoon light on golden stone',
  },
  oxfordshire: {
    terrain: 'Chiltern Hills and Thames Valley meadows',
    features: 'dreaming spires in distance, water meadows, willows',
    atmosphere: 'gentle English summer afternoon',
  },
  warwickshire: {
    terrain: 'gentle Warwickshire countryside and Avon valley',
    features: 'Shakespeare country, timber-framed villages, hedgerows',
    atmosphere: 'soft pastoral light over green fields',
  },
  worcestershire: {
    terrain: 'Malvern Hills ridge and Vale of Evesham',
    features: 'dramatic hill views, fruit orchards, hop yards',
    atmosphere: 'misty morning over orchard valleys',
  },
  herefordshire: {
    terrain: 'Black Mountains foothills and Wye Valley',
    features: 'cider apple orchards, half-timbered farms, meandering river',
    atmosphere: 'golden autumn light through apple trees',
  },

  // South East
  kent: {
    terrain: 'Garden of England rolling countryside',
    features: 'oast houses, hop gardens, orchards, white cliffs',
    atmosphere: 'warm summer light over fruit-laden orchards',
  },
  sussex: {
    terrain: 'South Downs chalk grassland and weald',
    features: 'rolling downs, flint villages, coastal views',
    atmosphere: 'bright downland light, big sky country',
  },
  surrey: {
    terrain: 'Surrey Hills wooded ridges and heathland',
    features: 'ancient woodlands, sandy commons, village greens',
    atmosphere: 'dappled woodland light through beech canopy',
  },
  hampshire: {
    terrain: 'New Forest heathland and Test Valley',
    features: 'wild ponies, ancient oaks, thatched cottages',
    atmosphere: 'misty forest morning, shafts of sunlight',
  },
  berkshire: {
    terrain: 'Thames Valley and Berkshire Downs',
    features: 'riverside meadows, ancient woodlands, racehorse country',
    atmosphere: 'soft river valley light at dawn',
  },

  // East Anglia
  norfolk: {
    terrain: 'vast Norfolk skies and flat fenland',
    features: 'windmills, reed beds, Broads waterways, flint churches',
    atmosphere: 'dramatic big sky, endless horizon',
  },
  suffolk: {
    terrain: 'gentle Suffolk countryside and Heritage Coast',
    features: 'pink-washed cottages, Constable country, estuaries',
    atmosphere: 'soft diffused light, painterly quality',
  },
  essex: {
    terrain: 'Essex marshes and rolling farmland',
    features: 'weatherboard villages, Thames estuary, ancient woodland',
    atmosphere: 'moody estuary light, atmospheric sky',
  },
  cambridgeshire: {
    terrain: 'Cambridgeshire Fens and gently rolling chalk',
    features: 'cathedral silhouette, endless fields, drainage channels',
    atmosphere: 'vast sky over flat productive land',
  },

  // Midlands
  lincolnshire: {
    terrain: 'Lincolnshire Wolds and fenland',
    features: 'church spires, market towns, endless arable fields',
    atmosphere: 'big sky country, dramatic cloud formations',
  },
  nottinghamshire: {
    terrain: 'Sherwood Forest and Trent Valley',
    features: 'ancient oak woodland, river meadows, red brick villages',
    atmosphere: 'dappled forest light, Robin Hood country',
  },
  derbyshire: {
    terrain: 'Peak District limestone dales and gritstone edges',
    features: 'dramatic crags, dry stone walls, lead mining heritage',
    atmosphere: 'dramatic moorland light, clouds over peaks',
  },
  staffordshire: {
    terrain: 'Staffordshire Moorlands and Trent Valley',
    features: 'pottery country, canal network, rolling farmland',
    atmosphere: 'soft Midlands light over green pastures',
  },
  shropshire: {
    terrain: 'Shropshire Hills and Welsh Marches',
    features: 'Long Mynd ridge, timber-framed market towns',
    atmosphere: 'mystical borderland light, ancient hillforts',
  },

  // North
  yorkshire: {
    terrain: 'Yorkshire Dales limestone and moorland',
    features: 'dry stone walls, waterfalls, grey stone villages',
    atmosphere: 'dramatic dale light, clouds over moors',
  },
  lancashire: {
    terrain: 'Forest of Bowland and Ribble Valley',
    features: 'rolling fells, stone villages, river valleys',
    atmosphere: 'moody Pennine light, rain-washed greens',
  },
  cumbria: {
    terrain: 'Lake District mountains and lakes',
    features: 'dramatic fells, mirror lakes, whitewashed farms',
    atmosphere: 'mountain light through clouds, reflections',
  },
  northumberland: {
    terrain: 'Cheviot Hills and Northumbrian coast',
    features: 'castle ruins, empty beaches, dark sky country',
    atmosphere: 'wild northern light, dramatic skies',
  },
  durham: {
    terrain: 'Durham Dales and Pennine foothills',
    features: 'cathedral city, lead mining heritage, moorland',
    atmosphere: 'atmospheric northern light, ancient landscape',
  },

  // Scotland
  scotland: {
    terrain: 'Scottish Highlands and glens',
    features: 'lochs, mountains, heather moorland, castles',
    atmosphere: 'dramatic Highland light, mist in glens',
  },
  highland: {
    terrain: 'dramatic Highland mountains and sea lochs',
    features: 'munros, whisky distilleries, crofting landscape',
    atmosphere: 'ethereal mountain light, weather drama',
  },
  borders: {
    terrain: 'Scottish Borders rolling hills',
    features: 'abbey ruins, wool towns, river valleys',
    atmosphere: 'soft pastoral light, peaceful valleys',
  },
  fife: {
    terrain: 'Fife coastal kingdom and farmland',
    features: 'fishing villages, golf courses, East Neuk charm',
    atmosphere: 'bright coastal light, North Sea horizon',
  },

  // Wales
  wales: {
    terrain: 'Welsh mountains and green valleys',
    features: 'Snowdonia peaks, castles, sheep-dotted hills',
    atmosphere: 'dramatic mountain light, Celtic mystery',
  },
  pembrokeshire: {
    terrain: 'Pembrokeshire coastal path and islands',
    features: 'wild cliffs, sea birds, hidden coves',
    atmosphere: 'Atlantic light, dramatic coastal weather',
  },
  powys: {
    terrain: 'Brecon Beacons and Cambrian Mountains',
    features: 'waterfalls, red kites, market towns',
    atmosphere: 'mountain mist, green valley light',
  },
  gwynedd: {
    terrain: 'Snowdonia mountain peaks and coastline',
    features: 'dramatic peaks, slate quarries, Welsh heritage',
    atmosphere: 'dramatic mountain weather, mythical landscape',
  },

  // Northern Ireland
  antrim: {
    terrain: 'Antrim Coast and Glens',
    features: 'Giants Causeway, dramatic cliffs, green glens',
    atmosphere: 'wild Atlantic light, ancient geology',
  },
  down: {
    terrain: 'Mourne Mountains and coastal drumlin landscape',
    features: 'sweeping mountains to sea, fishing villages',
    atmosphere: 'dramatic Irish light, mountains and sea',
  },
}

/**
 * Default landscape used when a county is not in `COUNTY_LANDSCAPES`.
 */
export const DEFAULT_LANDSCAPE: CountyLandscape = {
  terrain: 'rolling British countryside and pastoral farmland',
  features: 'hedgerows, country lanes, village church spires',
  atmosphere: 'soft English light, peaceful rural scene',
}

/**
 * Look up the landscape for a county by slug and/or display name.
 * Falls back to `DEFAULT_LANDSCAPE` if neither matches a key in
 * `COUNTY_LANDSCAPES`. Matches are substring-based and case-insensitive
 * so variations like "north-yorkshire" or "Yorkshire Dales" still hit
 * the `yorkshire` entry.
 */
export function findCountyLandscape(
  slug: string,
  displayName: string
): CountyLandscape {
  const slugLower = slug.toLowerCase()
  const nameLower = displayName.toLowerCase()
  for (const [key, value] of Object.entries(COUNTY_LANDSCAPES)) {
    if (slugLower.includes(key) || nameLower.includes(key)) {
      return value
    }
  }
  return DEFAULT_LANDSCAPE
}
