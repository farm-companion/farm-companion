#!/usr/bin/env tsx
/**
 * Complete Produce Generator - Unified Pipeline
 *
 * Orchestrates DeepSeek content generation + fal.ai image generation
 * Performs comprehensive validation and outputs ready-to-use produce data
 *
 * Usage:
 *   pnpm tsx src/scripts/generate-complete-produce.ts [options]
 *
 * Options:
 *   --produce=slug          Generate for specific produce item
 *   --count=N              Number of images per item (default: 4)
 *   --dry-run              Preview without API calls
 *   --auto-approve         Auto-approve items with 95%+ confidence
 *   --upload               Upload images to Vercel Blob
 *
 * Examples:
 *   pnpm tsx src/scripts/generate-complete-produce.ts --produce=kale
 *   pnpm tsx src/scripts/generate-complete-produce.ts --produce=strawberries --upload --auto-approve
 *   pnpm tsx src/scripts/generate-complete-produce.ts --dry-run
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { ProduceContentGenerator } from '../lib/produce-content-generator'
import { ProduceImageGenerator } from '../lib/produce-image-generator'
import { imageQualityValidator } from '../lib/image-quality-validator'
import type {
  NutritionData,
  SeasonalityData,
  TipsData,
  RecipeChip
} from '../lib/produce-content-generator'

interface Options {
  produce?: string
  count: number
  dryRun: boolean
  autoApprove: boolean
  upload: boolean
}

interface CompleteProduceData {
  slug: string
  name: string
  nutrition?: NutritionData
  seasonality?: SeasonalityData
  tips?: TipsData
  recipes?: RecipeChip[]
  images?: Array<{ url: string; variationId: number }>
  confidence: number
  approved: boolean
  issues: string[]
  notes: string
}

interface GenerationResult {
  success: boolean
  data?: CompleteProduceData
  error?: string
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    count: 4,
    dryRun: false,
    autoApprove: false,
    upload: false
  }

  for (const arg of args) {
    if (arg.startsWith('--produce=')) {
      options.produce = arg.split('=')[1]
    } else if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--auto-approve') {
      options.autoApprove = true
    } else if (arg === '--upload') {
      options.upload = true
    }
  }

  return options
}

async function generateCompleteItem(
  produceName: string,
  slug: string,
  options: Options
): Promise<GenerationResult> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🌾 Generating Complete Data for: ${produceName}`)
  console.log(`${'='.repeat(60)}`)

  try {
    const contentGenerator = new ProduceContentGenerator()
    const imageGenerator = new ProduceImageGenerator()

    let nutrition: NutritionData | undefined
    let seasonality: SeasonalityData | undefined
    let tips: TipsData | undefined
    let recipes: RecipeChip[] | undefined
    let images: Array<{ url: string; variationId: number }> | undefined

    const confidenceScores: number[] = []

    // Step 1: Generate Content with DeepSeek
    console.log('\n📝 STEP 1: Generating Content with DeepSeek...')
    console.log('-'.repeat(60))

    if (!options.dryRun) {
      // Generate nutrition
      console.log('1/4 Generating nutrition data...')
      const nutritionResult = await contentGenerator.generateNutrition(produceName)
      if (nutritionResult.success && nutritionResult.data) {
        nutrition = nutritionResult.data
        confidenceScores.push(nutritionResult.confidence || 0)
        console.log(`✅ Nutrition: ${nutritionResult.confidence}% confidence`)
      } else {
        console.log(`❌ Nutrition failed: ${nutritionResult.error}`)
      }

      // Generate seasonality
      console.log('2/4 Generating seasonality data...')
      const seasonalityResult = await contentGenerator.generateSeasonality(produceName)
      if (seasonalityResult.success && seasonalityResult.data) {
        seasonality = seasonalityResult.data
        confidenceScores.push(seasonalityResult.confidence || 0)
        console.log(`✅ Seasonality: ${seasonalityResult.confidence}% confidence`)
      } else {
        console.log(`❌ Seasonality failed: ${seasonalityResult.error}`)
      }

      // Generate tips
      console.log('3/4 Generating tips...')
      const tipsResult = await contentGenerator.generateTips(produceName)
      if (tipsResult.success && tipsResult.data) {
        tips = tipsResult.data
        confidenceScores.push(tipsResult.confidence || 0)
        console.log(`✅ Tips: ${tipsResult.confidence}% confidence`)
      } else {
        console.log(`❌ Tips failed: ${tipsResult.error}`)
      }

      // Generate recipes
      console.log('4/4 Generating recipes...')
      const recipesResult = await contentGenerator.generateRecipeChips(produceName)
      if (recipesResult.success && recipesResult.data) {
        recipes = recipesResult.data
        confidenceScores.push(recipesResult.confidence || 0)
        console.log(`✅ Recipes: ${recipes.length} recipes, ${recipesResult.confidence}% confidence`)
      } else {
        console.log(`❌ Recipes failed: ${recipesResult.error}`)
      }
    } else {
      console.log('ℹ️  Dry run mode - skipping content generation')
    }

    // Step 2: Self-Review
    console.log('\n🔍 STEP 2: Self-Review...')
    console.log('-'.repeat(60))

    let reviewApproved = false
    let reviewIssues: string[] = []
    let reviewNotes = ''

    if (!options.dryRun && (nutrition || seasonality || tips || recipes)) {
      const reviewResult = await contentGenerator.reviewGeneration(
        produceName,
        nutrition,
        seasonality,
        tips,
        recipes
      )

      if (reviewResult.success && reviewResult.data) {
        reviewApproved = reviewResult.data.approved
        reviewIssues = reviewResult.data.issues
        reviewNotes = reviewResult.data.notes
        confidenceScores.push(reviewResult.confidence || 0)

        console.log(`${reviewApproved ? '✅' : '⚠️ '} Review: ${reviewApproved ? 'APPROVED' : 'NEEDS REVIEW'}`)
        console.log(`   Confidence: ${reviewResult.confidence}%`)
        console.log(`   Notes: ${reviewNotes}`)
        if (reviewIssues.length > 0) {
          console.log('   Issues:')
          reviewIssues.forEach(issue => console.log(`   - ${issue}`))
        }
      }
    } else {
      console.log('ℹ️  Skipping review (dry run or no content generated)')
    }

    // Step 3: Generate Images with fal.ai
    console.log('\n🎨 STEP 3: Generating Images with fal.ai...')
    console.log('-'.repeat(60))

    if (!options.dryRun) {
      // Use peak month for seasonal context if available
      const month = seasonality?.peakMonths?.[0] || seasonality?.monthsInSeason?.[0]

      console.log(`Generating ${options.count} images${month ? ` (month ${month})` : ''}...`)
      const buffers = await imageGenerator.generateVariations(
        produceName,
        slug,
        options.count,
        month
      )

      if (buffers.length > 0) {
        console.log(`✅ Generated ${buffers.length} images`)

        // Validate image quality
        console.log('Validating image quality...')
        const qualityResults = await imageQualityValidator.validateBatch(buffers)
        const summary = imageQualityValidator.getBatchSummary(qualityResults)

        console.log(`✅ Quality: ${summary.passRate.toFixed(1)}% pass rate, ${summary.avgConfidence.toFixed(1)}% avg confidence`)
        confidenceScores.push(summary.avgConfidence)

        if (summary.failed > 0) {
          console.warn(`⚠️  ${summary.failed} images failed quality checks`)
        }

        // Upload if requested
        if (options.upload) {
          console.log('📤 Uploading images to Vercel Blob...')
          const uploadedImages: Array<{ url: string; variationId: number }> = []

          for (let i = 0; i < buffers.length; i++) {
            const variationId = i + 1
            const url = await imageGenerator.uploadImage(
              buffers[i],
              slug,
              variationId,
              produceName,
              false
            )
            uploadedImages.push({ url, variationId })
          }

          images = uploadedImages
          console.log(`✅ Uploaded ${images.length} images`)
        }
      } else {
        console.log('❌ No images generated')
      }
    } else {
      console.log('ℹ️  Dry run mode - skipping image generation')
    }

    // Calculate overall confidence
    const avgConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0

    // Determine approval status
    const approved = reviewApproved && avgConfidence >= 95

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Overall Confidence: ${avgConfidence.toFixed(1)}%`)
    console.log(`Status: ${approved ? '✅ AUTO-APPROVED' : '⚠️  NEEDS MANUAL REVIEW'}`)
    console.log(`Content: ${nutrition ? '✅' : '❌'} nutrition, ${seasonality ? '✅' : '❌'} seasonality, ${tips ? '✅' : '❌'} tips, ${recipes ? '✅' : '❌'} recipes`)
    console.log(`Images: ${images ? `✅ ${images.length} uploaded` : '❌ not generated'}`)

    if (options.autoApprove && !approved) {
      console.log('\n⚠️  Item not auto-approved (confidence < 95% or review failed)')
      console.log('   Review issues and manually approve if acceptable')
    }

    return {
      success: true,
      data: {
        slug,
        name: produceName,
        nutrition,
        seasonality,
        tips,
        recipes,
        images,
        confidence: avgConfidence,
        approved,
        issues: reviewIssues,
        notes: reviewNotes
      }
    }

  } catch (error) {
    console.error(`\n❌ Generation failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function main() {
  const options = parseArgs()

  console.log('🌾 Farm Companion - Complete Produce Generator')
  console.log('='.repeat(60))
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Auto-approve: ${options.autoApprove ? 'YES' : 'NO'}`)
  console.log(`Upload images: ${options.upload ? 'YES' : 'NO'}`)
  console.log('='.repeat(60))

  if (!options.produce) {
    console.error('\n❌ ERROR: --produce=slug required')
    console.error('   Example: pnpm tsx src/scripts/generate-complete-produce.ts --produce=strawberries')
    process.exit(1)
  }

  if (!options.dryRun) {
    // Check for required API keys
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('\n❌ ERROR: DEEPSEEK_API_KEY not found')
      console.error('   Set in .env.local: DEEPSEEK_API_KEY=your-key-here')
      process.exit(1)
    }

    if (!process.env.FAL_KEY) {
      console.warn('\n⚠️  WARNING: FAL_KEY not found')
      console.warn('   Images will use Pollinations fallback')
    }
  }

  // Generate complete produce item
  const result = await generateCompleteItem(
    options.produce,
    options.produce, // Using produce name as slug for now
    options
  )

  if (result.success && result.data) {
    console.log('\n✨ Generation complete!')

    if (result.data.approved && options.autoApprove) {
      console.log('\n✅ Item AUTO-APPROVED and ready for produce.ts')
      console.log('\nNext steps:')
      console.log('1. Copy the generated data to src/data/produce.ts')
      console.log('2. Update alt text for images')
      console.log('3. Test the produce page: /seasonal/' + options.produce)
    } else {
      console.log('\n⚠️  Manual review required')
      console.log('\nReview checklist:')
      console.log('- Verify nutrition values are accurate')
      console.log('- Check UK seasonality matches known data')
      console.log('- Review tips for UK appropriateness')
      console.log('- Verify recipes are family-friendly')
      console.log('- Check image quality and relevance')
    }
  } else {
    console.error('\n❌ Generation failed')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
