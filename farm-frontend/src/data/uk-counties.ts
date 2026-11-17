// Canonical UK county taxonomy for Farm Companion.
//
// WHY THIS FILE EXISTS
// The farms table held 280 distinct `county` values, which were not counties:
// they mixed ceremonial counties, English district and borough councils, London
// boroughs, Scottish council areas, Welsh principal areas, Northern Irish
// districts, duplicate spellings of one place, and "Cymru" (the Welsh name for
// Wales). /counties therefore claimed 280 counties and listed a farm in Bolton
// under a different top-level "county" than one in Greater Manchester.
//
// THE STANDARD CHOSEN
//   England          48 ceremonial counties (Lieutenancies Act 1997), plus the
//                    Isles of Scilly, which that Act leaves outside the
//                    counties while giving it its own postal identity.
//   Scotland         32 council areas (Local Government etc. (Scotland) Act 1994)
//   Wales            22 principal areas (Local Government (Wales) Act 1994)
//   Northern Ireland 11 districts (Local Government (Boundaries) Act (NI) 2008)
//
// Chosen because it is the set a UK reader means by "county", it is the set that
// maps onto a postal address, and every tier is a single statutory list rather
// than a mix of tiers. Ceremonial counties are deliberately preferred over the
// current unitary authorities in England: a reader looking for Cumbria does not
// search for "Westmorland and Furness".
//
// SOURCES
//   Lieutenancies Act 1997, Schedule 1 (England and Wales ceremonial counties)
//     https://www.legislation.gov.uk/ukpga/1997/23/schedule/1
//   Local Government etc. (Scotland) Act 1994, Schedule 1 (council areas)
//     https://www.legislation.gov.uk/ukpga/1994/39/schedule/1
//   Local Government (Wales) Act 1994, Schedule 1 (principal areas)
//     https://www.legislation.gov.uk/ukpga/1994/19/schedule/1
//   Local Government (Boundaries) Act (Northern Ireland) 2008
//     https://www.legislation.gov.uk/nia/2008/7
//
// Slugs are not stored here. `slugifyCounty` in @/lib/county-slug is the single
// slug rule for the route, the sitemap and every link; see its header for the
// bug that followed from having more than one.

export type CountyNation = 'England' | 'Scotland' | 'Wales' | 'Northern Ireland'

export interface UkCounty {
  /** Display name, and the exact value stored in farms.county. */
  readonly name: string
  readonly nation: CountyNation
}

export const UK_COUNTIES: readonly UkCounty[] = [
  // --- England ---
  { name: "Bedfordshire", nation: "England" },
  { name: "Berkshire", nation: "England" },
  { name: "Bristol", nation: "England" },
  { name: "Buckinghamshire", nation: "England" },
  { name: "Cambridgeshire", nation: "England" },
  { name: "Cheshire", nation: "England" },
  { name: "City of London", nation: "England" },
  { name: "Cornwall", nation: "England" },
  { name: "County Durham", nation: "England" },
  { name: "Cumbria", nation: "England" },
  { name: "Derbyshire", nation: "England" },
  { name: "Devon", nation: "England" },
  { name: "Dorset", nation: "England" },
  { name: "East Riding of Yorkshire", nation: "England" },
  { name: "East Sussex", nation: "England" },
  { name: "Essex", nation: "England" },
  { name: "Gloucestershire", nation: "England" },
  { name: "Greater London", nation: "England" },
  { name: "Greater Manchester", nation: "England" },
  { name: "Hampshire", nation: "England" },
  { name: "Herefordshire", nation: "England" },
  { name: "Hertfordshire", nation: "England" },
  { name: "Isle of Wight", nation: "England" },
  { name: "Isles of Scilly", nation: "England" },
  { name: "Kent", nation: "England" },
  { name: "Lancashire", nation: "England" },
  { name: "Leicestershire", nation: "England" },
  { name: "Lincolnshire", nation: "England" },
  { name: "Merseyside", nation: "England" },
  { name: "Norfolk", nation: "England" },
  { name: "North Yorkshire", nation: "England" },
  { name: "Northamptonshire", nation: "England" },
  { name: "Northumberland", nation: "England" },
  { name: "Nottinghamshire", nation: "England" },
  { name: "Oxfordshire", nation: "England" },
  { name: "Rutland", nation: "England" },
  { name: "Shropshire", nation: "England" },
  { name: "Somerset", nation: "England" },
  { name: "South Yorkshire", nation: "England" },
  { name: "Staffordshire", nation: "England" },
  { name: "Suffolk", nation: "England" },
  { name: "Surrey", nation: "England" },
  { name: "Tyne and Wear", nation: "England" },
  { name: "Warwickshire", nation: "England" },
  { name: "West Midlands", nation: "England" },
  { name: "West Sussex", nation: "England" },
  { name: "West Yorkshire", nation: "England" },
  { name: "Wiltshire", nation: "England" },
  { name: "Worcestershire", nation: "England" },
  // --- Scotland ---
  { name: "Aberdeen City", nation: "Scotland" },
  { name: "Aberdeenshire", nation: "Scotland" },
  { name: "Angus", nation: "Scotland" },
  { name: "Argyll and Bute", nation: "Scotland" },
  { name: "City of Edinburgh", nation: "Scotland" },
  { name: "Clackmannanshire", nation: "Scotland" },
  { name: "Dumfries and Galloway", nation: "Scotland" },
  { name: "Dundee City", nation: "Scotland" },
  { name: "East Ayrshire", nation: "Scotland" },
  { name: "East Dunbartonshire", nation: "Scotland" },
  { name: "East Lothian", nation: "Scotland" },
  { name: "East Renfrewshire", nation: "Scotland" },
  { name: "Falkirk", nation: "Scotland" },
  { name: "Fife", nation: "Scotland" },
  { name: "Glasgow City", nation: "Scotland" },
  { name: "Highland", nation: "Scotland" },
  { name: "Inverclyde", nation: "Scotland" },
  { name: "Midlothian", nation: "Scotland" },
  { name: "Moray", nation: "Scotland" },
  { name: "Na h-Eileanan Siar", nation: "Scotland" },
  { name: "North Ayrshire", nation: "Scotland" },
  { name: "North Lanarkshire", nation: "Scotland" },
  { name: "Orkney Islands", nation: "Scotland" },
  { name: "Perth and Kinross", nation: "Scotland" },
  { name: "Renfrewshire", nation: "Scotland" },
  { name: "Scottish Borders", nation: "Scotland" },
  { name: "Shetland Islands", nation: "Scotland" },
  { name: "South Ayrshire", nation: "Scotland" },
  { name: "South Lanarkshire", nation: "Scotland" },
  { name: "Stirling", nation: "Scotland" },
  { name: "West Dunbartonshire", nation: "Scotland" },
  { name: "West Lothian", nation: "Scotland" },
  // --- Wales ---
  { name: "Blaenau Gwent", nation: "Wales" },
  { name: "Bridgend", nation: "Wales" },
  { name: "Caerphilly", nation: "Wales" },
  { name: "Cardiff", nation: "Wales" },
  { name: "Carmarthenshire", nation: "Wales" },
  { name: "Ceredigion", nation: "Wales" },
  { name: "Conwy", nation: "Wales" },
  { name: "Denbighshire", nation: "Wales" },
  { name: "Flintshire", nation: "Wales" },
  { name: "Gwynedd", nation: "Wales" },
  { name: "Isle of Anglesey", nation: "Wales" },
  { name: "Merthyr Tydfil", nation: "Wales" },
  { name: "Monmouthshire", nation: "Wales" },
  { name: "Neath Port Talbot", nation: "Wales" },
  { name: "Newport", nation: "Wales" },
  { name: "Pembrokeshire", nation: "Wales" },
  { name: "Powys", nation: "Wales" },
  { name: "Rhondda Cynon Taf", nation: "Wales" },
  { name: "Swansea", nation: "Wales" },
  { name: "Torfaen", nation: "Wales" },
  { name: "Vale of Glamorgan", nation: "Wales" },
  { name: "Wrexham", nation: "Wales" },
  // --- Northern Ireland ---
  { name: "Antrim and Newtownabbey", nation: "Northern Ireland" },
  { name: "Ards and North Down", nation: "Northern Ireland" },
  { name: "Armagh City, Banbridge and Craigavon", nation: "Northern Ireland" },
  { name: "Belfast", nation: "Northern Ireland" },
  { name: "Causeway Coast and Glens", nation: "Northern Ireland" },
  { name: "Derry City and Strabane", nation: "Northern Ireland" },
  { name: "Fermanagh and Omagh", nation: "Northern Ireland" },
  { name: "Lisburn and Castlereagh", nation: "Northern Ireland" },
  { name: "Mid Ulster", nation: "Northern Ireland" },
  { name: "Mid and East Antrim", nation: "Northern Ireland" },
  { name: "Newry, Mourne and Down", nation: "Northern Ireland" },
]

/** Every canonical county name, for O(1) validation. */
export const UK_COUNTY_NAMES: ReadonlySet<string> = new Set(UK_COUNTIES.map((c) => c.name))

/** True when `name` is exactly a canonical county name. */
export function isCanonicalCounty(name: string): boolean {
  return UK_COUNTY_NAMES.has(name)
}
