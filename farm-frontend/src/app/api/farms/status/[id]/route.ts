import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: farmId } = await params

    // Check in submissions directory
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    const farmFile = path.join(farmsDir, `${farmId}.json`)
    
    let farm
    try {
      const content = await fs.readFile(farmFile, 'utf-8')
      farm = JSON.parse(content)
    } catch {
      // Check in live farms directory
      const liveFarmsDir = path.join(process.cwd(), 'data', 'live-farms')
      const liveFarmFile = path.join(liveFarmsDir, `${farmId}.json`)
      
      try {
        const liveContent = await fs.readFile(liveFarmFile, 'utf-8')
        farm = JSON.parse(liveContent)
        farm.status = 'live' // Override status for live farms
      } catch {
        return NextResponse.json(
          { error: 'Farm submission not found' },
          { status: 404 }
        )
      }
    }

    // Return only public information
    const publicInfo = {
      id: farm.id,
      name: farm.name,
      status: farm.status,
      submittedAt: farm.submittedAt,
      reviewedAt: farm.reviewedAt,
      approvedAt: farm.approvedAt,
      movedToLiveAt: farm.movedToLiveAt,
      reviewNotes: farm.reviewNotes,
      farmUrl: farm.status === 'live' ? `https://www.farmcompanion.co.uk/shop/${farm.slug}` : null
    }

    return NextResponse.json(publicInfo)

  } catch (error) {
    console.error('Error fetching farm status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
