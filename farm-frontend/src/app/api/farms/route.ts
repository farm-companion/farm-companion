import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { FarmShop } from '@/types/farm'

interface FarmShopData {
  name: string
  slug: string
  location: {
    lat: number
    lng: number
    address: string
    county: string
    postcode: string
  }
  contact: {
    website?: string
    email?: string
    phone?: string
  }
  hours: Array<{
    day: string
    open: string
    close: string
  }>
  offerings?: string[]
  story?: string
  images: Array<{
    id: string
    name: string
    size: number
    type: string
  }>
  verified: boolean
  verification: {
    method: string
    timestamp: string
  }
  seasonal: string[]
  updatedAt: string
}

// Enhanced GET endpoint with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const query = searchParams.get('q')?.toLowerCase()
    const county = searchParams.get('county')
    const category = searchParams.get('category')
    const bbox = searchParams.get('bbox') // "west,south,east,north"
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Load farm data with deduplication
    const farmsPath = path.join(process.cwd(), 'public', 'data', 'farms.uk.json')
    const farmsData = await fs.readFile(farmsPath, 'utf-8')
    const rawFarms: FarmShop[] = JSON.parse(farmsData)
    
    // Apply deduplication
    const { dedupeFarms } = await import('@/lib/schemas')
    const { farms: allFarms, stats } = dedupeFarms(rawFarms)
    
    console.log('📊 Farm data processing:', stats)
    console.log(`✅ Loaded ${allFarms.length} valid, deduplicated farms from JSON file`)
    
    // Apply filters
    const filteredFarms = allFarms.filter((farm: FarmShop) => {
      // Text search
      if (query) {
        const searchText = `${farm.name} ${farm.location.address} ${farm.location.county} ${farm.location.postcode}`.toLowerCase()
        if (!searchText.includes(query)) return false
      }
      
      // County filter
      if (county && farm.location.county !== county) return false
      
      // Category filter (offerings)
      if (category && farm.offerings && !farm.offerings.includes(category)) return false
      
      // Bounding box filter
      if (bbox) {
        const [west, south, east, north] = bbox.split(',').map(Number)
        const { lat, lng } = farm.location
        if (lat < south || lat > north || lng < west || lng > east) return false
      }
      
      // Validate coordinates
      if (!farm.location.lat || !farm.location.lng) return false
      if (farm.location.lat === 0 && farm.location.lng === 0) return false
      
      return true
    })
    
    // Apply pagination
    const paginatedFarms = filteredFarms.slice(offset, offset + limit)
    
    // Get unique counties and categories for faceted search
    const counties = [...new Set(allFarms.map(f => f.location.county).filter(Boolean))].sort()
    const categories = [...new Set(allFarms.flatMap(f => f.offerings || []).filter(Boolean))].sort()
    
    return NextResponse.json({
      farms: paginatedFarms,
      total: filteredFarms.length,
      offset,
      limit,
      facets: {
        counties,
        categories
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error serving farm data:', error)
    return NextResponse.json(
      { error: 'Failed to load farm data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const farmData: FarmShopData = await request.json()

    // Validate required fields
    if (!farmData.name || !farmData.location?.address || !farmData.location?.county || !farmData.location?.postcode) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, county, and postcode are required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (farmData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(farmData.contact.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate website format if provided
    if (farmData.contact.website && !/^https?:\/\/.+/.test(farmData.contact.website)) {
      return NextResponse.json(
        { error: 'Website must start with http:// or https://' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    if (farmData.location.lat && (farmData.location.lat < 49 || farmData.location.lat > 61)) {
      return NextResponse.json(
        { error: 'Latitude must be within UK bounds (49-61)' },
        { status: 400 }
      )
    }
    if (farmData.location.lng && (farmData.location.lng < -8 || farmData.location.lng > 2)) {
      return NextResponse.json(
        { error: 'Longitude must be within UK bounds (-8 to 2)' },
        { status: 400 }
      )
    }

    // Validate postcode format (basic UK postcode validation)
    if (farmData.location.postcode && !/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(farmData.location.postcode)) {
      return NextResponse.json(
        { error: 'Please enter a valid UK postcode' },
        { status: 400 }
      )
    }

    // Check for potential duplicates
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
    
    try {
      // Check submissions directory
      const submissionFiles = await fs.readdir(farmsDir)
      for (const file of submissionFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(farmsDir, file)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const existingFarm = JSON.parse(fileContent)
          
          // Check for exact name match
          if (existingFarm.name.toLowerCase() === farmData.name.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm with this name already exists' },
              { status: 409 }
            )
          }
          
          // Check for exact address match
          if (existingFarm.location?.address?.toLowerCase() === farmData.location.address.toLowerCase() &&
              existingFarm.location?.postcode?.toLowerCase() === farmData.location.postcode.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm at this address already exists' },
              { status: 409 }
            )
          }
        }
      }
      
      // Check live farms directory
      const liveFiles = await fs.readdir(liveFarmsDir)
      for (const file of liveFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(liveFarmsDir, file)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const existingFarm = JSON.parse(fileContent)
          
          // Check for exact name match
          if (existingFarm.name.toLowerCase() === farmData.name.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm with this name already exists' },
              { status: 409 }
            )
          }
          
          // Check for exact address match
          if (existingFarm.location?.address?.toLowerCase() === farmData.location.address.toLowerCase() &&
              existingFarm.location?.postcode?.toLowerCase() === farmData.location.postcode.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm at this address already exists' },
              { status: 409 }
            )
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or other error, continue with submission
      console.log('Directory check failed, continuing with submission:', error)
    }

    // Generate unique ID and slug
    const id = `farm_${farmData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
    const slug = farmData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Create farm object
    const newFarm = {
      id,
      slug,
      name: farmData.name,
      location: {
        lat: farmData.location.lat || null,
        lng: farmData.location.lng || null,
        address: farmData.location.address,
        city: '',
        county: farmData.location.county,
        postcode: farmData.location.postcode
      },
      contact: {
        phone: farmData.contact.phone || null,
        email: farmData.contact.email || null,
        website: farmData.contact.website || null
      },
      hours: farmData.hours || [],
      offerings: farmData.offerings || [],
      description: farmData.story || '',
      images: farmData.images || [],
      verified: false,
      updatedAt: new Date().toISOString()
    }

    // Save to submissions directory
    const submissionPath = path.join(farmsDir, `${id}.json`)
    await fs.writeFile(submissionPath, JSON.stringify(newFarm, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Farm submission received successfully',
      farm: newFarm
    }, { status: 201 })

  } catch (error) {
    console.error('Error processing farm submission:', error)
    return NextResponse.json(
      { error: 'Failed to process farm submission' },
      { status: 500 }
    )
  }
}
