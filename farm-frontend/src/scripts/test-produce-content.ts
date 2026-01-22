#!/usr/bin/env tsx
/**
 * Test script for ProduceContentGenerator
 *
 * Usage:
 *   pnpm tsx src/scripts/test-produce-content.ts [produce-name]
 *
 * Examples:
 *   pnpm tsx src/scripts/test-produce-content.ts
 *   pnpm tsx src/scripts/test-produce-content.ts kale
 *   pnpm tsx src/scripts/test-produce-content.ts "purple sprouting broccoli"
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { ProduceContentGenerator } from '../lib/produce-content-generator'

async function main() {
  const produceName = process.argv[2] || 'strawberries'

  console.log('🌾 Farm Companion - Produce Content Generator Test')
  console.log('='.repeat(60))
  console.log(`📦 Testing with: ${produceName}`)
  console.log('='.repeat(60))

  // Check for API key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('\n❌ ERROR: DEEPSEEK_API_KEY not found in environment')
    console.error('   Please set it in .env.local:')
    console.error('   DEEPSEEK_API_KEY=your-key-here')
    console.error('\n   Get your API key from: https://platform.deepseek.com/')
    process.exit(1)
  }

  console.log(`✅ DeepSeek API key found: ${process.env.DEEPSEEK_API_KEY.substring(0, 10)}...`)

  // Create generator and run test
  const generator = new ProduceContentGenerator()
  await generator.testGeneration(produceName)

  console.log('\n✨ Test complete!')
}

main().catch(error => {
  console.error('\n❌ Test failed:', error)
  process.exit(1)
})
