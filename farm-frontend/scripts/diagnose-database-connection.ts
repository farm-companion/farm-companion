#!/usr/bin/env tsx
/**
 * Database Connection Diagnostic Tool
 *
 * Checks your DATABASE_URL configuration and tests connectivity
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

console.log('Database Connection Diagnostics')
console.log('='.repeat(60))
console.log('')

// Check if DATABASE_URL exists
const dbUrl = process.env.DATABASE_URL
const poolerUrl = process.env.DATABASE_POOLER_URL

console.log('Environment Variables:')
console.log(`  DATABASE_URL: ${dbUrl ? 'Set' : 'Missing'}`)
console.log(`  DATABASE_POOLER_URL: ${poolerUrl ? 'Set' : 'Missing'}`)
console.log('')

if (!dbUrl) {
  console.log('DATABASE_URL is not set in .env.local')
  console.log('')
  console.log('Please add your Supabase connection string to .env.local:')
  console.log('  DATABASE_URL="postgresql://..."')
  process.exit(1)
}

// Parse the connection string
function analyzeConnectionString(url: string) {
  try {
    const parsed = new URL(url)

    console.log('Connection String Analysis:')
    console.log(`  Protocol: ${parsed.protocol}`)
    console.log(`  Host: ${parsed.hostname}`)
    console.log(`  Port: ${parsed.port}`)
    console.log(`  Database: ${parsed.pathname.slice(1)}`)
    console.log(`  Username: ${parsed.username}`)
    console.log(`  Password: ${parsed.password ? '***' + parsed.password.slice(-4) : 'Not set'}`)
    console.log('')

    // Check port
    if (parsed.port === '5432') {
      console.log('WARNING: Using direct connection (port 5432)')
      console.log('   Recommended: Use connection pooler (port 6543) for better performance')
      console.log('')
      console.log('   In Supabase Dashboard > Settings > Database:')
      console.log('   - Look for "Connection Pooling" section')
      console.log('   - Copy the "Transaction" mode connection string')
      console.log('   - Use port 6543 instead of 5432')
      console.log('')
    } else if (parsed.port === '6543') {
      console.log('Using connection pooler (port 6543) - Recommended!')
      console.log('')
    }

    return true
  } catch (error) {
    console.log('Failed to parse DATABASE_URL')
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function testConnection() {
  console.log('Testing Database Connection...')
  console.log('')

  const prisma = new PrismaClient()

  try {
    // Test basic connectivity
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    console.log(`Connection successful (${latency}ms)`)
    console.log('')

    // Test farm table access
    const farmCount = await prisma.farm.count()
    console.log(`Farm table accessible: ${farmCount} farms found`)
    console.log('')

    // Get sample data
    const sampleFarm = await prisma.farm.findFirst({
      select: {
        name: true,
        county: true,
        verified: true,
      },
    })

    if (sampleFarm) {
      console.log('Sample farm data:')
      console.log(`  Name: ${sampleFarm.name}`)
      console.log(`  County: ${sampleFarm.county}`)
      console.log(`  Verified: ${sampleFarm.verified}`)
      console.log('')
    }

    console.log('All diagnostics passed!')

  } catch (error) {
    console.log('Connection failed')
    console.log('')

    if (error instanceof Error) {
      console.log(`Error: ${error.message}`)

      if (error.message.includes('ECONNREFUSED')) {
        console.log('')
        console.log('Possible causes:')
        console.log('  - Database server is not running')
        console.log('  - Firewall blocking connection')
        console.log('  - Incorrect host/port')
      } else if (error.message.includes('authentication')) {
        console.log('')
        console.log('Possible causes:')
        console.log('  - Incorrect password')
        console.log('  - User does not exist')
        console.log('  - Password needs to be URL-encoded')
      } else if (error.message.includes('timeout')) {
        console.log('')
        console.log('Possible causes:')
        console.log('  - Network connectivity issues')
        console.log('  - Database server overloaded')
        console.log('  - SSL/TLS handshake issues')
      }
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
analyzeConnectionString(dbUrl)
testConnection().catch(console.error)
