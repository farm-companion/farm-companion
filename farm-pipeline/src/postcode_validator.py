#!/usr/bin/env python3
"""
UK Postcode Validator using postcodes.io

Free API for UK postcode validation and enrichment.
https://postcodes.io/

Features:
- Validate UK postcodes
- Get coordinates for postcodes
- Bulk validation (up to 100 at a time)
- Fix malformed postcodes
"""

import asyncio
import httpx
import re
from typing import Dict, List, Optional, Any

# postcodes.io is free and doesn't require an API key
POSTCODES_API_BASE = "https://api.postcodes.io"

# UK postcode regex pattern
UK_POSTCODE_PATTERN = re.compile(
    r'^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$',
    re.IGNORECASE
)


def normalize_postcode(postcode: str) -> str:
    """
    Normalize a UK postcode to standard format.
    Example: "sw1a1aa" -> "SW1A 1AA"
    """
    if not postcode:
        return ""

    # Remove all whitespace and convert to uppercase
    cleaned = re.sub(r'\s+', '', postcode.upper())

    # Try to match and format
    match = UK_POSTCODE_PATTERN.match(cleaned)
    if match:
        outward, inward = match.groups()
        return f"{outward} {inward}".upper()

    # If doesn't match, try inserting space before last 3 chars
    if len(cleaned) >= 5:
        return f"{cleaned[:-3]} {cleaned[-3:]}".upper()

    return postcode.strip().upper()


async def validate_postcode(
    client: httpx.AsyncClient,
    postcode: str
) -> Optional[Dict[str, Any]]:
    """
    Validate a single postcode and get its details.

    Returns:
        Dict with postcode details if valid, None if invalid
    """
    if not postcode:
        return None

    normalized = normalize_postcode(postcode)
    encoded = normalized.replace(' ', '%20')

    try:
        response = await client.get(
            f"{POSTCODES_API_BASE}/postcodes/{encoded}",
            timeout=10.0
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 200:
                result = data.get('result', {})
                return {
                    'postcode': result.get('postcode'),
                    'latitude': result.get('latitude'),
                    'longitude': result.get('longitude'),
                    'admin_district': result.get('admin_district'),
                    'admin_county': result.get('admin_county'),
                    'parish': result.get('parish'),
                    'region': result.get('region'),
                    'country': result.get('country'),
                    'valid': True
                }
        return None
    except Exception as e:
        print(f"  ⚠️  Postcode validation error for {postcode}: {e}")
        return None


async def bulk_validate_postcodes(
    client: httpx.AsyncClient,
    postcodes: List[str]
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Validate multiple postcodes in bulk (max 100 per request).

    Returns:
        Dict mapping postcode to validation result
    """
    results: Dict[str, Optional[Dict[str, Any]]] = {}

    if not postcodes:
        return results

    # Normalize all postcodes
    normalized = [normalize_postcode(p) for p in postcodes if p]

    # Process in batches of 100
    for i in range(0, len(normalized), 100):
        batch = normalized[i:i+100]

        try:
            response = await client.post(
                f"{POSTCODES_API_BASE}/postcodes",
                json={"postcodes": batch},
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 200:
                    for item in data.get('result', []):
                        query = item.get('query', '')
                        result = item.get('result')

                        if result:
                            results[query] = {
                                'postcode': result.get('postcode'),
                                'latitude': result.get('latitude'),
                                'longitude': result.get('longitude'),
                                'admin_district': result.get('admin_district'),
                                'admin_county': result.get('admin_county'),
                                'region': result.get('region'),
                                'country': result.get('country'),
                                'valid': True
                            }
                        else:
                            results[query] = None
        except Exception as e:
            print(f"  ⚠️  Bulk validation error: {e}")
            # Mark all in batch as unknown
            for p in batch:
                if p not in results:
                    results[p] = None

        # Rate limiting - be nice to the free API
        await asyncio.sleep(0.1)

    return results


async def lookup_postcode_for_coordinates(
    client: httpx.AsyncClient,
    lat: float,
    lng: float
) -> Optional[str]:
    """
    Find the nearest postcode for given coordinates.
    Useful for filling in missing postcodes.
    """
    try:
        response = await client.get(
            f"{POSTCODES_API_BASE}/postcodes",
            params={"lon": lng, "lat": lat, "limit": 1},
            timeout=10.0
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 200:
                results = data.get('result', [])
                if results:
                    return results[0].get('postcode')
        return None
    except Exception as e:
        print(f"  ⚠️  Postcode lookup error for ({lat}, {lng}): {e}")
        return None


async def enrich_farm_postcodes(
    farms: List[Dict[str, Any]],
    fix_missing: bool = True,
    fix_invalid: bool = True
) -> List[Dict[str, Any]]:
    """
    Enrich farm data with validated and corrected postcodes.

    Args:
        farms: List of farm dictionaries
        fix_missing: Use coordinates to find missing postcodes
        fix_invalid: Attempt to correct invalid postcodes

    Returns:
        Updated farm list with enriched postcode data
    """
    print(f"📮 Validating postcodes for {len(farms)} farms...")

    async with httpx.AsyncClient() as client:
        # Collect all postcodes for bulk validation
        postcodes = []
        for farm in farms:
            location = farm.get('location', {})
            postcode = location.get('postcode', '')
            if postcode and postcode.upper() != 'UK':
                postcodes.append(postcode)

        # Bulk validate
        print(f"  📤 Validating {len(postcodes)} postcodes...")
        validated = await bulk_validate_postcodes(client, postcodes)

        valid_count = sum(1 for v in validated.values() if v)
        print(f"  ✅ {valid_count}/{len(postcodes)} postcodes valid")

        # Process farms
        fixed_count = 0
        lookup_count = 0

        for farm in farms:
            location = farm.get('location', {})
            postcode = location.get('postcode', '')
            normalized = normalize_postcode(postcode) if postcode else ''

            # Check validation result
            validation = validated.get(normalized)

            if validation:
                # Use validated postcode (properly formatted)
                location['postcode'] = validation['postcode']
                # Optionally enrich with additional data
                if not location.get('county') and validation.get('admin_county'):
                    location['county'] = validation['admin_county']
                    fixed_count += 1
            elif fix_missing and (not postcode or postcode.upper() == 'UK'):
                # Try to look up postcode from coordinates
                lat = location.get('lat')
                lng = location.get('lng')
                if lat and lng:
                    found = await lookup_postcode_for_coordinates(client, lat, lng)
                    if found:
                        location['postcode'] = found
                        lookup_count += 1
                        print(f"  📍 Found postcode {found} for {farm.get('name', 'Unknown')}")

        print(f"  🔧 Fixed {fixed_count} counties from postcode data")
        print(f"  📍 Found {lookup_count} missing postcodes from coordinates")

    return farms


# CLI for testing
if __name__ == "__main__":
    import sys

    async def test():
        async with httpx.AsyncClient() as client:
            # Test single validation
            result = await validate_postcode(client, "SW1A 1AA")
            print(f"SW1A 1AA: {result}")

            # Test normalization
            print(f"Normalize 'sw1a1aa': {normalize_postcode('sw1a1aa')}")
            print(f"Normalize 'EC1A1BB': {normalize_postcode('EC1A1BB')}")

    asyncio.run(test())
