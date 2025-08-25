import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure farms directory exists
    const farmsDir = path.join(process.cwd(), 'data', 'farms')
    
    try {
      await fs.access(farmsDir)
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ submissions: [] })
    }

    // Read all farm submission files
    const files = await fs.readdir(farmsDir)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const submissions = []
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(farmsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const submission = JSON.parse(content)
        submissions.push(submission)
      } catch (error) {
        console.error(`Error reading farm submission file ${file}:`, error)
        // Continue with other files
      }
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return NextResponse.json({ submissions })

  } catch (error) {
    console.error('Error fetching farm submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
