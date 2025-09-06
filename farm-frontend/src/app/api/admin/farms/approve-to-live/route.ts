import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'
import { trackContentChange, createFarmChangeEvent } from '@/lib/content-change-tracker'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { farmId } = await request.json()

    // Read the approved farm submission
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    const farmFile = path.join(farmsDir, `${farmId}.json`)
    
    let farm
    try {
      const content = await fs.readFile(farmFile, 'utf-8')
      farm = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'Farm submission not found' },
        { status: 404 }
      )
    }

    // Verify farm is approved
    if (farm.status !== 'approved') {
      return NextResponse.json(
        { error: 'Farm must be approved before moving to live directory' },
        { status: 400 }
      )
    }

    // Transform farm data to match live directory format
    const liveFarm = {
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      location: {
        lat: farm.location.lat || 54.5, // UK fallback
        lng: farm.location.lng || -2.5,
        address: farm.location.address,
        county: farm.location.county,
        postcode: farm.location.postcode
      },
      contact: farm.contact,
      hours: farm.hours || [],
      offerings: farm.offerings || [],
      story: farm.story,
      images: farm.images || [],
      verified: true,
      verification: {
        method: 'admin_approval',
        timestamp: farm.approvedAt || new Date().toISOString()
      },
      seasonal: farm.seasonal || [],
      updatedAt: farm.approvedAt || new Date().toISOString(),
      // Add metadata from submission
      submittedAt: farm.submittedAt,
      approvedAt: farm.approvedAt,
      approvedBy: farm.approvedBy
    }

    // Ensure live farms directory exists
    const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
    await fs.mkdir(liveFarmsDir, { recursive: true })

    // Save to live directory
    const liveFarmFile = path.join(liveFarmsDir, `${farm.id}.json`)
    await fs.writeFile(liveFarmFile, JSON.stringify(liveFarm, null, 2))

    // Update submission status to 'live'
    const updatedSubmission = {
      ...farm,
      status: 'live',
      movedToLiveAt: new Date().toISOString(),
      movedToLiveBy: user.email
    }
    await fs.writeFile(farmFile, JSON.stringify(updatedSubmission, null, 2))

    // Send notification to farm contact
    await sendLiveNotification(liveFarm)

    // Track content change and notify Bing IndexNow (fire-and-forget)
    ;(async () => {
      try {
        const changeEvent = createFarmChangeEvent(
          'publish',
          liveFarm.slug,
          undefined,
          liveFarm.location.county
        )
        
        const result = await trackContentChange(changeEvent)
        if (result.success) {
          console.log(`🚀 Content change tracked: ${result.notificationsSent} Bing notifications sent`)
        } else {
          console.warn(`⚠️ Content change tracking failed: ${result.errors.join(', ')}`)
        }
      } catch (error) {
        console.error('Error tracking content change:', error)
        // Don't fail the main operation if content change tracking fails
      }
    })()

    return NextResponse.json({ 
      success: true, 
      message: `Farm ${farm.name} moved to live directory successfully`,
      farmId: farm.id
    })

  } catch (error) {
    console.error('Error moving farm to live directory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendLiveNotification(farm: any) {
  if (farm.contact.email) {
    console.log('📧 FARM LIVE NOTIFICATION:', {
      to: farm.contact.email,
      from: 'hello@farmcompanion.co.uk',
      subject: `Your Farm is Now Live: ${farm.name}`,
      farmId: farm.id,
      farmName: farm.name,
      farmUrl: `https://www.farmcompanion.co.uk/shop/${farm.slug}`,
      message: `Great news! Your farm shop "${farm.name}" is now live on Farm Companion. You can view your listing at: https://www.farmcompanion.co.uk/shop/${farm.slug}`
    })
  }
}
