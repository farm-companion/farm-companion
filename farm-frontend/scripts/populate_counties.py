#!/usr/bin/env python3
"""
Script to populate missing county data in farms.uk.json
Uses UK postcode patterns to map postcodes to counties
"""

import json
import re
import os
from typing import Dict, List, Optional

# UK Postcode to County mapping
# This is a simplified mapping based on postcode areas
POSTCODE_TO_COUNTY = {
    # England
    'AB': 'Aberdeenshire', 'AL': 'Hertfordshire', 'B': 'West Midlands', 'BA': 'Somerset',
    'BB': 'Lancashire', 'BD': 'West Yorkshire', 'BH': 'Dorset', 'BL': 'Greater Manchester',
    'BN': 'East Sussex', 'BR': 'Greater London', 'BS': 'Bristol', 'BT': 'Northern Ireland',
    'CA': 'Cumbria', 'CB': 'Cambridgeshire', 'CF': 'South Glamorgan', 'CH': 'Cheshire',
    'CM': 'Essex', 'CO': 'Essex', 'CR': 'Greater London', 'CT': 'Kent',
    'CV': 'Warwickshire', 'CW': 'Cheshire', 'DA': 'Kent', 'DD': 'Angus',
    'DE': 'Derbyshire', 'DG': 'Dumfries and Galloway', 'DH': 'Durham', 'DL': 'North Yorkshire',
    'DN': 'South Yorkshire', 'DT': 'Dorset', 'DY': 'Worcestershire', 'E': 'Greater London',
    'EC': 'Greater London', 'EH': 'Edinburgh', 'EN': 'Hertfordshire', 'EX': 'Devon',
    'FK': 'Stirlingshire', 'FY': 'Lancashire', 'G': 'Glasgow', 'GL': 'Gloucestershire',
    'GU': 'Surrey', 'HA': 'Greater London', 'HD': 'West Yorkshire', 'HG': 'North Yorkshire',
    'HP': 'Buckinghamshire', 'HR': 'Herefordshire', 'HS': 'Outer Hebrides', 'HU': 'East Riding of Yorkshire',
    'HX': 'West Yorkshire', 'IG': 'Essex', 'IP': 'Suffolk', 'IV': 'Inverness-shire',
    'KA': 'Ayrshire', 'KT': 'Surrey', 'KW': 'Caithness', 'KY': 'Fife',
    'L': 'Merseyside', 'LA': 'Cumbria', 'LD': 'Powys', 'LE': 'Leicestershire',
    'LL': 'Clwyd', 'LN': 'Lincolnshire', 'LS': 'West Yorkshire', 'LU': 'Bedfordshire',
    'M': 'Greater Manchester', 'ME': 'Kent', 'MK': 'Buckinghamshire', 'ML': 'Lanarkshire',
    'N': 'Greater London', 'NE': 'Tyne and Wear', 'NG': 'Nottinghamshire', 'NN': 'Northamptonshire',
    'NP': 'Gwent', 'NR': 'Norfolk', 'NW': 'Greater London', 'OL': 'Lancashire',
    'OX': 'Oxfordshire', 'PA': 'Renfrewshire', 'PE': 'Lincolnshire', 'PH': 'Perthshire',
    'PL': 'Cornwall', 'PO': 'Hampshire', 'PR': 'Lancashire', 'RG': 'Berkshire',
    'RH': 'West Sussex', 'RM': 'Essex', 'S': 'South Yorkshire', 'SA': 'West Glamorgan',
    'SE': 'Greater London', 'SG': 'Hertfordshire', 'SK': 'Derbyshire', 'SL': 'Berkshire',
    'SM': 'Surrey', 'SN': 'Wiltshire', 'SO': 'Hampshire', 'SP': 'Wiltshire',
    'SR': 'Tyne and Wear', 'SS': 'Essex', 'ST': 'Staffordshire', 'SW': 'Greater London',
    'SY': 'Shropshire', 'TA': 'Somerset', 'TD': 'Roxburghshire', 'TF': 'Shropshire',
    'TN': 'Kent', 'TQ': 'Devon', 'TR': 'Cornwall', 'TS': 'Cleveland',
    'TW': 'Greater London', 'UB': 'Greater London', 'W': 'Greater London', 'WA': 'Cheshire',
    'WC': 'Greater London', 'WD': 'Hertfordshire', 'WF': 'West Yorkshire', 'WN': 'Greater Manchester',
    'WR': 'Worcestershire', 'WS': 'Staffordshire', 'WV': 'West Midlands', 'YO': 'North Yorkshire',
    'ZE': 'Shetland'
}

def extract_postcode_from_city(city: str) -> Optional[str]:
    """Extract postcode from city field which contains both city and postcode"""
    if not city:
        return None
    
    # UK postcode pattern: A9 9AA or AA9 9AA or A9A 9AA or AA9A 9AA
    # Look for postcode pattern in the city string
    postcode_match = re.search(r'\b[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}\b', city.upper())
    if postcode_match:
        return postcode_match.group(0)
    
    return None

def extract_postcode_area(postcode: str) -> Optional[str]:
    """Extract the postcode area (first 1-2 letters) from a UK postcode"""
    if not postcode:
        return None
    
    # Clean the postcode
    postcode = postcode.upper().strip()
    
    # UK postcode pattern: A9 9AA or AA9 9AA or A9A 9AA or AA9A 9AA
    # Extract the area code (first part before space)
    match = re.match(r'^([A-Z]{1,2})', postcode)
    if match:
        return match.group(1)
    
    return None

def get_county_from_postcode(postcode: str) -> Optional[str]:
    """Get county name from UK postcode"""
    area = extract_postcode_area(postcode)
    if area:
        return POSTCODE_TO_COUNTY.get(area)
    return None

def populate_counties():
    """Populate missing county data in farms.uk.json"""
    
    # Load the farms data
    farms_file = 'public/data/farms.uk.json'
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    print(f"Processing {len(farms)} farms...")
    
    # Track statistics
    total_farms = len(farms)
    farms_with_county = 0
    farms_updated = 0
    farms_no_postcode = 0
    
    for farm in farms:
        location = farm.get('location', {})
        current_county = location.get('county', '')
        city = location.get('city', '')
        
        # Skip if already has county data
        if current_county and current_county.strip():
            farms_with_county += 1
            continue
        
        # Try to extract postcode from city field
        postcode = extract_postcode_from_city(city)
        if postcode:
            county = get_county_from_postcode(postcode)
            if county:
                location['county'] = county
                farms_updated += 1
                print(f"Updated {farm['name']}: {postcode} → {county}")
            else:
                print(f"No county found for {farm['name']}: {postcode}")
        else:
            farms_no_postcode += 1
            print(f"No postcode found for {farm['name']}: {city}")
    
    # Save the updated data
    with open(farms_file, 'w', encoding='utf-8') as f:
        json.dump(farms, f, indent=2, ensure_ascii=False)
    
    # Print statistics
    print(f"\n=== COUNTY POPULATION STATISTICS ===")
    print(f"Total farms: {total_farms}")
    print(f"Already had county: {farms_with_county}")
    print(f"Updated with county: {farms_updated}")
    print(f"No postcode available: {farms_no_postcode}")
    print(f"Remaining without county: {total_farms - farms_with_county - farms_updated}")
    print(f"Success rate: {((farms_with_county + farms_updated) / total_farms * 100):.1f}%")

if __name__ == "__main__":
    populate_counties()
