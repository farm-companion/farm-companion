# Produce Data & Image Automation - Foolproof System Specification

## Overview

Transform the seasonal produce system from manual (10 items) to fully automated (100+ items) with foolproof data generation, validation, and image management.

---

## System 1: DeepSeek Produce Data Generator

### Project Structure
```
/farm-companion/produce-data-generator/
├── src/
│   ├── deepseek-client.ts           # DeepSeek API integration
│   ├── produce-generator.ts         # Main orchestration
│   ├── data-validator.ts            # Comprehensive validation
│   ├── templates/
│   │   ├── seasonality.prompt.ts    # UK seasonal calendar generation
│   │   ├── nutrition.prompt.ts      # Nutrition facts generation
│   │   ├── tips.prompt.ts           # Selection/storage/prep tips
│   │   ├── recipes.prompt.ts        # Family-friendly recipe search
│   │   └── review.prompt.ts         # Self-review for accuracy
│   ├── validators/
│   │   ├── seasonality-validator.ts # UK seasonal validation
│   │   ├── nutrition-validator.ts   # Nutrition range checks
│   │   ├── recipe-validator.ts      # Family-friendly check
│   │   └── url-validator.ts         # Recipe URL verification
│   ├── formatters/
│   │   ├── produce-formatter.ts     # Format to produce.ts structure
│   │   └── markdown-formatter.ts    # Human-readable reports
│   └── utils/
│       ├── retry.ts                 # Exponential backoff
│       ├── rate-limiter.ts          # API rate limiting
│       └── logger.ts                # Structured logging
├── config/
│   ├── uk-produce-list.json         # 100+ UK produce items
│   ├── nutrition-ranges.json        # Valid nutrition ranges
│   ├── uk-seasons.json              # UK seasonal calendar reference
│   └── recipe-sources.json          # Approved recipe domains
├── output/
│   ├── generated/                   # Generated TypeScript files
│   ├── validation-reports/          # Validation results
│   └── review-queue/                # Items needing manual review
├── tests/
│   ├── validator.test.ts
│   ├── generator.test.ts
│   └── integration.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Core Features

#### 1. DeepSeek Client (`deepseek-client.ts`)
```typescript
export class DeepSeekClient {
  private apiKey: string
  private baseUrl: string = 'https://api.deepseek.com/v1'

  async generateSeasonality(produceName: string): Promise<SeasonalityData> {
    // Prompt: "Generate UK seasonality for {produce}"
    // Returns: { monthsInSeason: number[], peakMonths: number[] }
  }

  async generateNutrition(produceName: string): Promise<NutritionData> {
    // Prompt: "Generate accurate nutrition per 100g for {produce}"
    // Returns: { kcal, protein, carbs, sugars, fiber, fat }
  }

  async generateTips(produceName: string): Promise<TipsData> {
    // Prompt: "Generate selection, storage, and prep tips for {produce}"
    // Returns: { selectionTips[], storageTips[], prepIdeas[] }
  }

  async findRecipes(produceName: string): Promise<RecipeData[]> {
    // Prompt: "Find 3 family-friendly recipe URLs for {produce}"
    // Returns: [{ title, url, description }]
  }

  async reviewGeneration(data: ProduceData): Promise<ReviewResult> {
    // Prompt: "Review this produce data for accuracy and completeness"
    // Returns: { approved: boolean, issues: string[], confidence: number }
  }
}
```

#### 2. Validation System (`data-validator.ts`)

**Foolproof Validation Checks:**

1. **Seasonality Validation**
   - Months must be 1-12
   - peakMonths must be subset of monthsInSeason
   - Cross-reference with UK seasonal calendar database
   - Flag if seasonality conflicts with known data

2. **Nutrition Validation**
   - All values must be positive numbers
   - Ranges must be realistic (e.g., kcal: 15-900, protein: 0-30g)
   - Protein + carbs + fat ≈ total kcal (within 15% margin)
   - Flag outliers for manual review

3. **Tips Validation**
   - 3-5 tips per category
   - No duplicate tips across categories
   - Check for inappropriate content
   - Verify UK-specific advice (not US measurement systems)

4. **Recipe Validation**
   - URLs must be accessible (HTTP 200)
   - Domain must be in approved list (BBC, Jamie Oliver, etc.)
   - No alcohol-related recipes
   - No gambling/inappropriate content
   - Verify recipe actually contains the produce

5. **Cross-Validation**
   - Compare with existing produce.ts items
   - Check for duplicates or conflicts
   - Verify consistency across similar items

```typescript
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  confidence: number  // 0-100
  needsManualReview: boolean
  autoFixSuggestions: AutoFix[]
}

export class DataValidator {
  validateSeasonality(data: SeasonalityData, produceName: string): ValidationResult
  validateNutrition(data: NutritionData, produceName: string): ValidationResult
  validateTips(data: TipsData): ValidationResult
  validateRecipes(data: RecipeData[]): ValidationResult
  crossValidate(newItem: ProduceData, existing: ProduceData[]): ValidationResult
}
```

#### 3. Generator Pipeline (`produce-generator.ts`)

```typescript
export class ProduceGenerator {
  async generateSingleItem(produceName: string): Promise<ProduceGenerationResult> {
    // 1. Generate data from DeepSeek
    // 2. Validate data
    // 3. Self-review with DeepSeek
    // 4. Format output
    // 5. Create validation report
    // 6. Return result
  }

  async generateBatch(produceList: string[]): Promise<BatchResult> {
    // Process items in parallel with rate limiting
    // Aggregate validation results
    // Separate approved items from review queue
    // Generate comprehensive report
  }

  async generateAll(): Promise<void> {
    // Load UK produce list (100+ items)
    // Generate in batches of 10
    // Auto-approve high-confidence items (>95%)
    // Queue low-confidence items for review
    // Merge approved items into produce.ts
  }
}
```

#### 4. Automated Testing

```typescript
// tests/validator.test.ts
describe('Nutrition Validator', () => {
  it('should reject negative calories', () => {
    expect(validator.validateNutrition({ kcal: -10 })).toBe(false)
  })

  it('should flag unrealistic protein levels', () => {
    expect(validator.validateNutrition({ protein: 50 })).toHaveWarning()
  })

  it('should verify energy calculation accuracy', () => {
    const result = validator.validateNutrition({
      kcal: 100, protein: 5, carbs: 10, fat: 2
    })
    expect(result.energyCalculationAccuracy).toBeGreaterThan(85)
  })
})
```

#### 5. Monitoring & Alerts

```typescript
export class DataMonitor {
  async checkDataQuality(): Promise<QualityReport> {
    // Check for:
    // - Outdated seasonal data
    // - Broken recipe URLs
    // - Nutrition data outliers
    // - Missing images
  }

  async alertOnIssues(report: QualityReport): Promise<void> {
    // Send alerts via:
    // - Email notifications
    // - Slack webhook
    // - Dashboard updates
  }
}
```

---

## System 2: Farm Produce Images - Enhanced Automation

### Current System Issues
1. Manual upload process
2. No automated image sourcing
3. No quality validation
4. No automatic attribution
5. No fallback system

### Enhanced System Architecture

```
/farm-produce-images/ (enhanced)
├── src/
│   ├── api/
│   │   ├── upload/route.ts              # Existing
│   │   ├── auto-source/route.ts         # NEW: Auto-source images
│   │   ├── validate/route.ts            # NEW: Image validation
│   │   └── batch-process/route.ts       # NEW: Batch operations
│   ├── services/
│   │   ├── unsplash-client.ts           # NEW: Unsplash API
│   │   ├── pexels-client.ts             # NEW: Pexels API
│   │   ├── image-validator.ts           # NEW: Quality checks
│   │   └── attribution-manager.ts       # NEW: Auto attribution
│   ├── automation/
│   │   ├── auto-sourcer.ts              # NEW: Automated sourcing
│   │   ├── quality-checker.ts           # NEW: Image quality
│   │   └── scheduler.ts                 # NEW: Cron jobs
│   └── utils/
│       ├── image-processor.ts           # NEW: Optimization
│       └── deduplicator.ts              # NEW: Avoid duplicates
├── config/
│   ├── image-sources.json               # NEW: API configs
│   └── quality-standards.json           # NEW: Quality thresholds
└── cron/
    └── daily-image-check.ts             # NEW: Daily validation
```

### Enhanced Features

#### 1. Automated Image Sourcing

```typescript
export class ImageAutoSourcer {
  async sourceImagesForProduce(
    produceName: string,
    month: number,
    count: number = 3
  ): Promise<SourcedImage[]> {
    // 1. Search Unsplash for "fresh {produce} UK"
    // 2. Search Pexels as fallback
    // 3. Validate image quality (resolution, clarity)
    // 4. Check license compatibility
    // 5. Download and optimize
    // 6. Auto-generate attribution
    // 7. Upload to storage
  }

  async batchSourceAllProduce(): Promise<BatchSourceResult> {
    // Source images for all 100+ produce items
    // 3 images per item per relevant month
    // Total: ~1,500 images
  }
}
```

#### 2. Image Quality Validation

```typescript
export interface ImageQualityStandards {
  minWidth: 1200
  minHeight: 800
  maxFileSize: 2 * 1024 * 1024  // 2MB
  allowedFormats: ['jpg', 'jpeg', 'webp', 'png']
  minSharpness: 0.7
  minBrightness: 0.3
  maxBrightness: 0.9
  requiresProduceInFrame: true
}

export class ImageQualityValidator {
  async validateImage(image: Buffer): Promise<QualityResult> {
    // Check resolution
    // Check file size
    // Check format
    // Check sharpness (blur detection)
    // Check brightness/contrast
    // Check for produce presence (ML detection)
  }
}
```

#### 3. Smart Attribution System

```typescript
export class AttributionManager {
  async generateAttribution(image: SourcedImage): Promise<Attribution> {
    return {
      photographer: image.photographer,
      source: image.source,  // 'Unsplash', 'Pexels', etc.
      license: image.license,
      url: image.originalUrl,
      attributionText: `Photo by ${image.photographer} on ${image.source}`,
      required: image.license.requiresAttribution
    }
  }

  async embedAttribution(imageUrl: string, attribution: Attribution): Promise<void> {
    // Add attribution watermark to corner (subtle)
    // Store attribution in image metadata
    // Create attribution database entry
  }
}
```

#### 4. Automated Daily Checks

```typescript
// cron/daily-image-check.ts
export async function dailyImageHealthCheck() {
  // 1. Check for missing images (produce items without photos)
  // 2. Validate all image URLs still accessible
  // 3. Check for copyright issues
  // 4. Verify attribution compliance
  // 5. Auto-source replacements for broken images
  // 6. Send daily report
}
```

---

## Integration: Produce Data + Images

### Unified Workflow

```typescript
export class ProduceContentPipeline {
  async generateCompleteProduceItem(produceName: string): Promise<CompleteProduceData> {
    // Step 1: Generate data with DeepSeek
    const data = await produceGenerator.generate(produceName)

    // Step 2: Validate data
    const validation = await validator.validate(data)

    // Step 3: Auto-source images
    const images = await imageSourcer.source(produceName, data.monthsInSeason)

    // Step 4: Validate images
    const imageValidation = await imageValidator.validate(images)

    // Step 5: Combine and format
    const complete = {
      ...data,
      images: imageValidation.approved
    }

    // Step 6: Final review
    if (validation.confidence > 95 && imageValidation.allPassed) {
      return { status: 'auto-approved', data: complete }
    } else {
      return { status: 'needs-review', data: complete, issues: [...] }
    }
  }
}
```

---

## Foolproof Safeguards

### 1. Multi-Stage Validation
- ✅ Initial generation validation
- ✅ Self-review by DeepSeek
- ✅ Cross-validation with existing data
- ✅ URL accessibility checks
- ✅ Content appropriateness checks
- ✅ Final confidence scoring

### 2. Auto-Fix Capabilities
```typescript
export class AutoFixer {
  fixNutritionRounding(nutrition: NutritionData): NutritionData {
    // Round to reasonable precision
  }

  fixSeasonalityGaps(seasonality: SeasonalityData): SeasonalityData {
    // Fill missing peak months based on in-season data
  }

  fixRecipeUrls(recipes: RecipeData[]): RecipeData[] {
    // Update broken URLs with archive.org fallbacks
  }
}
```

### 3. Manual Review Queue
- Items with confidence < 95% go to review queue
- Dashboard shows pending reviews
- One-click approve/reject
- Edit capabilities for minor fixes
- Audit trail for all approvals

### 4. Rollback System
```typescript
export class VersionControl {
  async backupCurrentData(): Promise<BackupId>
  async rollbackToVersion(backupId: BackupId): Promise<void>
  async compareVersions(v1: BackupId, v2: BackupId): Promise<Diff>
}
```

### 5. Continuous Monitoring
- Daily health checks
- Weekly data quality reports
- Monthly full audits
- Alerts on anomalies
- Auto-remediation where possible

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Set up produce-data-generator project
- ✅ Implement DeepSeek client
- ✅ Build core validators
- ✅ Create test suite
- ✅ Generate first 10 items (validation run)

### Phase 2: Automation (Week 2)
- ✅ Build batch generation pipeline
- ✅ Implement auto-fix capabilities
- ✅ Create review queue dashboard
- ✅ Set up monitoring system
- ✅ Generate 50 items

### Phase 3: Image System (Week 3)
- ✅ Integrate Unsplash/Pexels APIs
- ✅ Build image quality validator
- ✅ Implement auto-sourcing
- ✅ Create attribution system
- ✅ Source images for 50 items

### Phase 4: Full Deployment (Week 4)
- ✅ Generate all 100+ items
- ✅ Source all images
- ✅ Run comprehensive validation
- ✅ Manual review of flagged items
- ✅ Deploy to production
- ✅ Enable daily automation

---

## Success Metrics

### Data Quality
- ✅ 100+ UK produce items
- ✅ 95%+ validation pass rate
- ✅ <5% requiring manual review
- ✅ Zero inappropriate content
- ✅ 100% recipe URL accessibility

### Image Quality
- ✅ 3+ images per produce item
- ✅ 100% attribution compliance
- ✅ 100% image accessibility
- ✅ High resolution (1200x800+)
- ✅ Relevant to produce

### Automation
- ✅ Daily automated checks
- ✅ Auto-remediation of broken URLs
- ✅ Auto-sourcing of missing images
- ✅ Alerts on quality issues
- ✅ Zero manual intervention needed (95%+ of time)

---

## Cost Estimation

### DeepSeek API Costs
- 100 produce items × 5 API calls = 500 calls
- Estimated: $10-20 total

### Unsplash/Pexels API
- Both offer free tiers
- 100 items × 3 images = 300 images
- Cost: FREE with attribution

### Storage
- 300 images × 500KB average = 150MB
- Vercel Blob: FREE tier covers it

### Total Monthly Cost
- Estimated: $20-40/month for API calls
- Storage: FREE
- Hosting: FREE (Vercel)

---

## Next Steps

Ready to start building? Here's the order:

1. **Create produce-data-generator project** - Scaffold TypeScript project
2. **Implement DeepSeek client** - API integration with retry logic
3. **Build validators** - Foolproof validation system
4. **Test with 5 items** - Validate approach
5. **Scale to 50 items** - Build automation
6. **Add image system** - Integrate Unsplash/Pexels
7. **Full deployment** - Generate all 100+ items

Shall I start with Step 1?
