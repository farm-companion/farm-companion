import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

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
  offerings: string[]
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
          const content = await fs.readFile(path.join(farmsDir, file), 'utf-8')
          const existingFarm = JSON.parse(content)
          
          // Check for exact name match
          if (existingFarm.name.toLowerCase() === farmData.name.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm with this name has already been submitted' },
              { status: 400 }
            )
          }
          
          // Check for exact address match
          if (existingFarm.location.address.toLowerCase() === farmData.location.address.toLowerCase() &&
              existingFarm.location.postcode.toLowerCase() === farmData.location.postcode.toLowerCase()) {
            return NextResponse.json(
              { error: 'A farm at this address has already been submitted' },
              { status: 400 }
            )
          }
        }
      }
      
      // Check live farms directory
      try {
        const liveFiles = await fs.readdir(liveFarmsDir)
        for (const file of liveFiles) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(liveFarmsDir, file), 'utf-8')
            const existingFarm = JSON.parse(content)
            
            if (existingFarm.name.toLowerCase() === farmData.name.toLowerCase()) {
              return NextResponse.json(
                { error: 'A farm with this name already exists in our directory' },
                { status: 400 }
              )
            }
            
            if (existingFarm.location.address.toLowerCase() === farmData.location.address.toLowerCase() &&
                existingFarm.location.postcode.toLowerCase() === farmData.location.postcode.toLowerCase()) {
              return NextResponse.json(
                { error: 'A farm at this address already exists in our directory' },
                { status: 400 }
              )
            }
          }
        }
      } catch (error) {
        // Live farms directory doesn't exist yet, which is fine
      }
    } catch (error) {
      // Farms directory doesn't exist yet, which is fine for first submission
    }

    // Add metadata
    const farm = {
      ...farmData,
      id: `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      approvedAt: null,
      approvedBy: null
    }

    // Ensure farms directory exists
    await fs.mkdir(farmsDir, { recursive: true })

    // Save farm to file
    const farmFile = path.join(farmsDir, `${farm.id}.json`)
    await fs.writeFile(farmFile, JSON.stringify(farm, null, 2))

    // Send notification email to admin
    await sendAdminNotification(farm)

    // Send confirmation email to farm contact if email provided
    if (farm.contact.email) {
      await sendFarmConfirmation(farm)
    }

    return NextResponse.json({ 
      success: true, 
      farmId: farm.id,
      message: 'Farm shop submitted successfully. We\'ll review and add it to our directory within 2-3 business days.' 
    })

  } catch (error) {
    console.error('Error processing farm submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const farms: any[] = []
    
    // Read from live farms directory (approved farms)
    const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
    
    try {
      const files = await fs.readdir(liveFarmsDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(liveFarmsDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const farm = JSON.parse(content)
          farms.push(farm)
        } catch (error) {
          console.error(`Error reading farm file ${file}:`, error)
        }
      }
    } catch (error) {
      // Live farms directory doesn't exist yet, which is fine
      console.log('No live farms directory found')
    }
    
    // If no live farms, try to read from the main farms data file
    if (farms.length === 0) {
      try {
        const farmsDataPath = path.join(process.cwd(), 'data', 'farms.json')
        const content = await fs.readFile(farmsDataPath, 'utf-8')
        const farmsData = JSON.parse(content)
        farms.push(...farmsData)
      } catch (error) {
        console.log('No farms.json file found')
      }
    }
    
    // Sort farms by name
    farms.sort((a, b) => a.name.localeCompare(b.name))
    
    const response = NextResponse.json({ 
      farms,
      total: farms.length
    })
    
    // Add cache control headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
    
    return response
    
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendAdminNotification(farm: any) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log('📧 FARM SUBMISSION NOTIFICATION:', {
    to: 'hello@farmcompanion.co.uk',
    subject: `New Farm Shop Submission: ${farm.name}`,
    farmId: farm.id,
    farmName: farm.name,
    farmAddress: farm.location.address,
    farmCounty: farm.location.county,
    contactEmail: farm.contact.email,
    contactPhone: farm.contact.phone,
    offerings: farm.offerings.join(', '),
    hasStory: !!farm.story,
    hasImages: farm.images.length > 0
  })
}

async function sendFarmConfirmation(farm: any) {
  // This would send a confirmation email to the farm contact
  const submissionUrl = `https://www.farmcompanion.co.uk/submission-success?farmId=${farm.id}&farmName=${encodeURIComponent(farm.name)}&farmAddress=${encodeURIComponent(farm.location.address)}&farmCounty=${encodeURIComponent(farm.location.county)}&imagesCount=${farm.images.length}&contactEmail=${encodeURIComponent(farm.contact.email || '')}&contactPhone=${encodeURIComponent(farm.contact.phone || '')}`
  
  console.log('📧 FARM CONFIRMATION:', {
    to: farm.contact.email,
    from: 'hello@farmcompanion.co.uk',
    subject: `Farm Shop Submission Confirmed: ${farm.name}`,
    farmId: farm.id,
    submissionUrl,
    message: `Thank you for submitting ${farm.name} to Farm Companion. We'll review your listing and add it to our directory within 2-3 business days. You can track your submission at: ${submissionUrl}`
  })
}
