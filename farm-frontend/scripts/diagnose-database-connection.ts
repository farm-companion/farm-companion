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

console.log('🔍 Database Connection Diagnostics')
console.log('='.repeat(60))
console.log('')

// Check if DATABASE_URL exists
const dbUrl = process.env.DATABASE_URL
const poolerUrl = process.env.DATABASE_POOLER_URL

console.log('📋 Environment Variables:')
console.log(`  DATABASE_URL: ${dbUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`  DATABASE_POOLER_URL: ${poolerUrl ? '✅ Set' : '❌ Missing'}`)
console.log('')

if (!dbUrl) {
  console.log('❌ DATABASE_URL is not set in .env.local')
  console.log('')
  console.log('Please add your Supabase connection string to .env.local:')
  console.log('  DATABASE_URL="postgresql://..."')
  process.exit(1)
}

// Parse the connection string
try {
  const url = new URL(dbUrl)

  console.log('🔗 Connection String Analysis:')
  console.log(`  Protocol: ${url.protocol}`)
  console.log(`  Host: ${url.hostname}`)
  console.log(`  Port: ${url.port}`)
  console.log(`  Database: ${url.pathname.slice(1)}`)
  console.log(`  Username: ${url.username}`)
  console.log(`  Password: ${url.password ? '***' + url.password.slice(-4) : 'Not set'}`)
  console.log('')

  // Check port
  if (url.port === '5432') {
    console.log('⚠️  WARNING: Using direct connection (port 5432)')
    console.log('   Recommended: Use connection pooler (port 6543) for better performance')
    console.log('')
    console.log('   In Supabase Dashboard → Settings → Database:')
    console.log('   - Look for "Connection Pooling" section')
    console.log('   - Copy the "Transaction" mode connection string')
    console.log('   - Use port 6543 instead of 5432')
    console.log('')
  } else if (url.port === '6543') {
    console.log('✅ Using connection pooler (port 6543) - Recommended!')
    console.log('')
  }

  // Check for pgbouncer parameter
  const params = new URLSearchParams(url.search)
  const pgbouncer = params.get('pgbouncer')

  if (url.port === '6543' && pgbouncer !== 'true') {
    console.log('⚠️  WARNING: Using pooler port but missing ?pgbouncer=true parameter')
    console.log('   Add ?pgbouncer=true to your DATABASE_URL for pooler compatibility')
    console.log('')
  }

  // Test connection
  console.log('🧪 Testing Database Connection...')
  console.log('')

  const prisma = new PrismaClient({
    log: ['error'],
  })

  try {
    await prisma.$connect()
    console.log('✅ Successfully connected to database!')
    console.log('')

    // Try a simple query
    const farmCount = await prisma.farm.count()
    console.log(`📊 Database Stats:`)
    console.log(`  Total Farms: ${farmCount}`)

    await prisma.$disconnect()
    process.exit(0)
  } catch (error: any) {
    console.log('❌ Connection failed!')
    console.log('')
    console.log('Error:', error.message)
    console.log('')

    if (error.message.includes("Can't reach database server")) {
      console.log('💡 Troubleshooting Steps:')
      console.log('')
      console.log('1. Verify your Supabase project is active:')
      console.log('   - Go to https://supabase.com/dashboard/projects')
      console.log('   - Check project status (should be "Active")')
      console.log('')
      console.log('2. Check your connection string:')
      console.log('   - Go to Project Settings → Database')
      console.log('   - Copy the "Connection Pooling" string (Transaction mode)')
      console.log('   - Should use port 6543, not 5432')
      console.log('')
      console.log('3. Verify network access:')
      console.log('   - Supabase allows connections from all IPs by default')
      console.log('   - Check if you\'re behind a firewall/VPN')
      console.log('')
      console.log('4. Test with psql command:')
      console.log(`   psql "${dbUrl.replace(/password=[^&@]*/, 'password=***')}"`)
      console.log('')
    }

    await prisma.$disconnect()
    process.exit(1)
  }

} catch (error: any) {
  console.log('❌ Invalid DATABASE_URL format')
  console.log('')
  console.log('Error:', error.message)
  console.log('')
  console.log('Expected format:')
  console.log('  postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true')
  console.log('')
  console.log('Example (Supabase pooler):')
  console.log('  postgresql://postgres.xxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true')
  console.log('')
  process.exit(1)
}
