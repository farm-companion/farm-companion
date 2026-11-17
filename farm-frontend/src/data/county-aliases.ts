// Historic county values -> canonical county, for the one-way fold of the 280
// values the farms table held before the taxonomy was unified.
//
// Two jobs, one list:
//   1. The data migration reads it to rewrite farms.county.
//   2. next.config.ts reads it to emit a permanent redirect for every
//      /counties/<slug> that the fold removes, so no indexed URL 404s.
// Keep both uses driven by this file. The sitemap needs no entry here: it
// derives its county list from the farms table, so it follows the fold.
//
// Every key was a live value with at least one active farm on 2026-11-17, so
// every key had a live, indexable /counties/<slug> page. Keys are kept forever
// once added: deleting one turns a 308 back into a 404.
//
// Each fold is one of:
//   district      an English district or borough council -> its ceremonial county
//   borough       a London borough -> Greater London
//   unitary       an English unitary authority -> its ceremonial county
//   spelling      a duplicate spelling or formal suffix of a canonical name
//   mistag        not a place at that tier; resolved from the rows' postcodes

export const COUNTY_ALIASES: Readonly<Record<string, string>> = {
  // -> Bedfordshire
  "Bedford": "Bedfordshire",
  "Central Bedfordshire": "Bedfordshire",
  // -> Berkshire
  "West Berkshire": "Berkshire",
  "Windsor and Maidenhead": "Berkshire",
  "Wokingham": "Berkshire",
  // -> Bristol
  "Bristol City": "Bristol",
  // -> Buckinghamshire
  "Milton Keynes": "Buckinghamshire",
  // -> Cambridgeshire
  "Cambridge City": "Cambridgeshire",
  "East Cambridgeshire": "Cambridgeshire",
  "Fenland": "Cambridgeshire",
  "Huntingdonshire": "Cambridgeshire",
  "Peterborough City": "Cambridgeshire",
  "South Cambridgeshire": "Cambridgeshire",
  // -> Cheshire
  "Cheshire East": "Cheshire",
  "Cheshire West and Chester": "Cheshire",
  "Halton": "Cheshire",
  "Warrington": "Cheshire",
  // -> City of Edinburgh
  "Edinburgh": "City of Edinburgh",
  // -> County Durham
  "Darlington": "County Durham",
  "Stockton-on-Tees": "County Durham",
  // -> Cumbria
  "Cumberland": "Cumbria",
  "Westmorland and Furness": "Cumbria",
  // -> Denbighshire
  "Cymru": "Denbighshire",
  // -> Derbyshire
  "Bolsover": "Derbyshire",
  "Derby City": "Derbyshire",
  "Derbyshire Dales": "Derbyshire",
  "High Peak": "Derbyshire",
  "North East Derbyshire": "Derbyshire",
  // -> Devon
  "East Devon": "Devon",
  "Mid Devon": "Devon",
  "North Devon": "Devon",
  "South Hams": "Devon",
  "Teignbridge": "Devon",
  "Torbay": "Devon",
  "Torridge": "Devon",
  "West Devon": "Devon",
  // -> Dorset
  "Bournemouth, Christchurch and Poole": "Dorset",
  // -> East Sussex
  "Brighton and Hove": "East Sussex",
  "Lewes": "East Sussex",
  "Rother": "East Sussex",
  "Wealden": "East Sussex",
  // -> Essex
  "Brentwood": "Essex",
  "Chelmsford": "Essex",
  "Colchester": "Essex",
  "Epping Forest": "Essex",
  "Maldon": "Essex",
  "Rochford": "Essex",
  "Tendring": "Essex",
  "Thurrock": "Essex",
  "Uttlesford": "Essex",
  // -> Gloucestershire
  "Cotswold": "Gloucestershire",
  "Forest of Dean": "Gloucestershire",
  "South Gloucestershire": "Gloucestershire",
  "Stroud": "Gloucestershire",
  "Tewkesbury": "Gloucestershire",
  // -> Greater London
  "Ealing": "Greater London",
  "Enfield": "Greater London",
  "Havering": "Greater London",
  "Hillingdon": "Greater London",
  "Hounslow": "Greater London",
  "Redbridge": "Greater London",
  "Southwark": "Greater London",
  "Tower Hamlets": "Greater London",
  "Wandsworth": "Greater London",
  // -> Greater Manchester
  "Bolton": "Greater Manchester",
  "Manchester": "Greater Manchester",
  "Oldham": "Greater Manchester",
  "Stockport": "Greater Manchester",
  "Trafford": "Greater Manchester",
  // -> Hampshire
  "Basingstoke and Deane": "Hampshire",
  "East Hampshire": "Hampshire",
  "Fareham": "Hampshire",
  "Hart": "Hampshire",
  "Havant": "Hampshire",
  "Winchester City": "Hampshire",
  // -> Hertfordshire
  "Dacorum": "Hertfordshire",
  "East Hertfordshire": "Hertfordshire",
  "Hertsmere": "Hertfordshire",
  "Three Rivers": "Hertfordshire",
  "Watford": "Hertfordshire",
  "Welwyn Hatfield": "Hertfordshire",
  // -> Isle of Anglesey
  "Anglesey": "Isle of Anglesey",
  // -> Kent
  "Ashford": "Kent",
  "Canterbury City": "Kent",
  "Dover": "Kent",
  "Folkestone and Hythe": "Kent",
  "Medway": "Kent",
  "Sevenoaks": "Kent",
  "Tunbridge Wells": "Kent",
  // -> Lancashire
  "Blackpool": "Lancashire",
  "Fylde": "Lancashire",
  "Lancaster City": "Lancashire",
  "Pendle": "Lancashire",
  "Preston": "Lancashire",
  "Ribble Valley": "Lancashire",
  "West Lancashire": "Lancashire",
  "Wyre": "Lancashire",
  // -> Leicestershire
  "Charnwood": "Leicestershire",
  "Harborough": "Leicestershire",
  "Hinckley and Bosworth": "Leicestershire",
  "Leicester": "Leicestershire",
  "Leicester City": "Leicestershire",
  "Melton": "Leicestershire",
  // -> Lincolnshire
  "Lincoln City": "Lincolnshire",
  "North East Lincolnshire": "Lincolnshire",
  "North Lincolnshire": "Lincolnshire",
  "South Kesteven": "Lincolnshire",
  "West Lindsey": "Lincolnshire",
  // -> Merseyside
  "Sefton": "Merseyside",
  "Wirral": "Merseyside",
  // -> Na h-Eileanan Siar
  "Comhairle nan Eilean Siar (Western Isles)": "Na h-Eileanan Siar",
  // -> Norfolk
  "Breckland": "Norfolk",
  "Broadland": "Norfolk",
  "King's Lynn and West Norfolk": "Norfolk",
  "North Norfolk": "Norfolk",
  "Norwich City": "Norfolk",
  "South Norfolk": "Norfolk",
  // -> North Yorkshire
  "Redcar and Cleveland": "North Yorkshire",
  "York": "North Yorkshire",
  // -> Northamptonshire
  "North Northamptonshire": "Northamptonshire",
  "West Northamptonshire": "Northamptonshire",
  // -> Nottinghamshire
  "Bassetlaw": "Nottinghamshire",
  "Broxtowe": "Nottinghamshire",
  "Gedling": "Nottinghamshire",
  "Nottingham City": "Nottinghamshire",
  "Rushcliffe": "Nottinghamshire",
  // -> Oxfordshire
  "Cherwell": "Oxfordshire",
  "Oxford City": "Oxfordshire",
  "South Oxfordshire": "Oxfordshire",
  "Vale of White Horse": "Oxfordshire",
  "West Oxfordshire": "Oxfordshire",
  // -> Perth and Kinross
  "Perthshire": "Perth and Kinross",
  // -> Rhondda Cynon Taf
  "Rhondda Cynon Taff": "Rhondda Cynon Taf",
  // -> Shropshire
  "Telford and Wrekin": "Shropshire",
  // -> Somerset
  "Bath and North East Somerset": "Somerset",
  "North Somerset": "Somerset",
  // -> South Yorkshire
  "Barnsley": "South Yorkshire",
  "Doncaster": "South Yorkshire",
  "Rotherham": "South Yorkshire",
  "Sheffield": "South Yorkshire",
  // -> Staffordshire
  "East Staffordshire": "Staffordshire",
  "Lichfield": "Staffordshire",
  "Newcastle-Under-Lyme": "Staffordshire",
  "Stafford": "Staffordshire",
  "Staffordshire Moorlands": "Staffordshire",
  "Stoke-on-Trent": "Staffordshire",
  // -> Suffolk
  "Babergh": "Suffolk",
  "East Suffolk": "Suffolk",
  "Mid Suffolk": "Suffolk",
  "West Suffolk": "Suffolk",
  // -> Surrey
  "Guildford": "Surrey",
  "Mole Valley": "Surrey",
  "Runnymede": "Surrey",
  "Tandridge": "Surrey",
  "Waverley": "Surrey",
  "Woking": "Surrey",
  // -> Torfaen
  "Torfaen Principal Area": "Torfaen",
  // -> Tyne and Wear
  "Gateshead": "Tyne and Wear",
  "Newcastle Upon Tyne": "Tyne and Wear",
  "South Tyneside": "Tyne and Wear",
  // -> Warwickshire
  "Nuneaton and Bedworth": "Warwickshire",
  "Rugby": "Warwickshire",
  "Stratford-on-Avon": "Warwickshire",
  "Warwick": "Warwickshire",
  // -> West Midlands
  "Coventry": "West Midlands",
  "Dudley": "West Midlands",
  // -> West Sussex
  "Chichester": "West Sussex",
  "Horsham": "West Sussex",
  "Worthing": "West Sussex",
  // -> West Yorkshire
  "Bradford": "West Yorkshire",
  "Calderdale": "West Yorkshire",
  "Kirklees": "West Yorkshire",
  "Leeds": "West Yorkshire",
  "Wakefield": "West Yorkshire",
  // -> Wiltshire
  "Swindon": "Wiltshire",
  // -> Worcestershire
  "Bromsgrove": "Worcestershire",
  "Malvern Hills": "Worcestershire",
  "Wychavon": "Worcestershire",
  // -> Wrexham
  "Wrexham Principal Area": "Wrexham",
}

/**
 * Canonical name for any county value, historic or current.
 * Returns `name` unchanged when it is already canonical or unknown; callers
 * that need to reject unknown values should use `isCanonicalCounty`.
 */
export function canonicalCounty(name: string): string {
  return COUNTY_ALIASES[name] ?? name
}
