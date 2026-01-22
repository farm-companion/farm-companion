# Seasonal Produce Automation - Taskmaster Plan
**Integration of fal.ai Image Generation + DeepSeek Content Generation**

## Overview

Extend the existing seasonal produce system to be fully automated using proven technologies already in the codebase:
- **Images**: fal.ai FLUX + Pollinations fallback (proven in farm-frontend/src/lib/produce-image-generator.ts)
- **Content**: DeepSeek API (proven in twitter-workflow)
- **Goal**: 100+ fully automated produce items with god-tier quality

---

## System Architecture

### Current State (Manual)
```
14 produce items → manual data entry → manual image selection → static produce.ts
```

### Target State (Automated)
```
UK produce list (100+) → DeepSeek generates content → fal.ai generates images → validation → produce.ts
```

---

## Phase 5: Seasonal Produce Automation (Add to TASKMASTER_PLAN.md)

**Goal**: Automated end-to-end produce content and image generation

### Track 1: Content Generation with DeepSeek

**Slice 5.1.1: DeepSeek Client Setup**
- Create `/farm-frontend/src/lib/produce-content-generator.ts`
- Implement DeepSeekClient class with retry logic
- Add environment variable `DEEPSEEK_API_KEY` to .env.local
- Test connection with single API call
- Files: 1 new, 1 modified (.env.example)
- Lines: ~120 lines

**Slice 5.1.2: Nutrition Data Generation**
- Create prompt template for nutrition facts
- Implement `generateNutrition(produceName: string)` method
- Validate nutrition ranges (kcal: 15-900, protein: 0-30g)
- Test with 3 produce items (strawberries, kale, potatoes)
- Files: 1 modified
- Lines: ~80 lines

**Slice 5.1.3: Seasonal Data Generation**
- Create UK seasonality prompt template
- Implement `generateSeasonality(produceName: string)` method
- Validate months (1-12) and peak months
- Cross-reference with existing produce.ts seasonal data
- Test with 3 produce items
- Files: 1 modified
- Lines: ~90 lines

**Slice 5.1.4: Tips Generation (Selection, Storage, Prep)**
- Create tips prompt template (UK-specific advice)
- Implement `generateTips(produceName: string)` method
- Validate tip count (3-5 per category)
- Check for UK measurements (not US cups/ounces)
- Test with 3 produce items
- Files: 1 modified
- Lines: ~100 lines

**Slice 5.1.5: Recipe Chip Generation**
- Create family-friendly recipe prompt
- Implement `generateRecipeChips(produceName: string)` method
- Validate URLs (HTTP 200 check)
- Filter for family-appropriate content (no alcohol)
- Approved domains: BBC Food, Jamie Oliver, Tesco, Sainsburys
- Test with 3 produce items
- Files: 1 modified
- Lines: ~110 lines

**Slice 5.1.6: Self-Review Quality Check**
- Implement `reviewGeneration(data: ProduceData)` method
- DeepSeek reviews its own output for accuracy
- Confidence scoring (0-100)
- Flag items below 95% confidence for manual review
- Test with 5 produce items
- Files: 1 modified
- Lines: ~70 lines

### Track 2: Image Generation with fal.ai

**Slice 5.2.1: Enhance ProduceImageGenerator**
- Already exists at `/farm-frontend/src/lib/produce-image-generator.ts`
- Add seasonal context to prompts (e.g., "fresh UK strawberries in June")
- Implement month-specific styling variations
- Test with 2 produce items
- Files: 1 modified
- Lines: ~40 lines

**Slice 5.2.2: Batch Image Generation Script**
- Enhance `/farm-frontend/src/scripts/generate-produce-images.ts`
- Add parallel processing with rate limiting (3 requests/minute)
- Implement exponential backoff for failures
- Add progress tracking and resumability
- Test with 5 produce items
- Files: 1 modified
- Lines: ~80 lines

**Slice 5.2.3: Image Quality Validation**
- Create `/farm-frontend/src/lib/image-quality-validator.ts`
- Check minimum resolution (1600x900)
- Verify file size (< 2MB after optimization)
- Detect blur (reject blurry images)
- Test with 10 generated images
- Files: 1 new
- Lines: ~150 lines

**Slice 5.2.4: Automatic Retry Logic**
- Enhance fal.ai fallback system
- If fal.ai fails 3 times, try Pollinations 3 times
- If both fail, flag for manual intervention
- Log all failures for analysis
- Test with intentional failures
- Files: 1 modified
- Lines: ~60 lines

### Track 3: Unified Pipeline

**Slice 5.3.1: Pipeline Orchestrator**
- Create `/farm-frontend/src/scripts/generate-complete-produce.ts`
- Orchestrate: DeepSeek content → fal.ai images → validation → output
- Implement progress tracking and logging
- Add dry-run mode (no API calls, preview only)
- Test with 1 produce item end-to-end
- Files: 1 new
- Lines: ~200 lines

**Slice 5.3.2: Validation System**
- Create `/farm-frontend/src/lib/produce-validator.ts`
- Cross-validate content and images
- Check for duplicate slugs
- Verify all required fields present
- Nutrition energy calculation accuracy check
- Test with 5 complete produce items
- Files: 1 new
- Lines: ~180 lines

**Slice 5.3.3: Output Formatter**
- Create `/farm-frontend/src/lib/produce-formatter.ts`
- Format validated data into produce.ts structure
- Generate TypeScript code snippets
- Add JSDoc comments for each field
- Create backup of existing produce.ts before merge
- Test with 3 produce items
- Files: 1 new
- Lines: ~120 lines

**Slice 5.3.4: Review Queue Dashboard**
- Create `/farm-frontend/src/app/admin/produce-review/page.tsx`
- Display items needing manual review (confidence < 95%)
- Show side-by-side: generated vs existing data
- One-click approve/reject buttons
- Inline edit capabilities for minor fixes
- Test with 5 flagged items
- Files: 1 new
- Lines: ~250 lines

### Track 4: Automation & Monitoring

**Slice 5.4.1: Batch Processing Command**
- Create CLI tool: `pnpm run generate:seasonal-batch`
- Accept arguments: --count=10, --start=asparagus, --auto-approve
- Process items in parallel (3 at a time)
- Generate summary report with success/failure counts
- Test with 10 produce items
- Files: 1 new, 1 modified (package.json)
- Lines: ~150 lines

**Slice 5.4.2: Quality Monitoring**
- Create `/farm-frontend/src/scripts/audit-produce-quality.ts`
- Check for outdated data (> 1 year old)
- Verify all recipe URLs still accessible
- Check for broken image URLs
- Generate monthly quality report
- Test with existing 14 produce items
- Files: 1 new
- Lines: ~140 lines

**Slice 5.4.3: Automated Fixes**
- Create `/farm-frontend/src/lib/produce-auto-fixer.ts`
- Auto-fix: round nutrition to 1 decimal place
- Auto-fix: sort months in ascending order
- Auto-fix: capitalize recipe titles consistently
- Auto-fix: remove duplicate tips
- Test with 5 items with known issues
- Files: 1 new
- Lines: ~100 lines

**Slice 5.4.4: Version Control System**
- Create `/farm-frontend/src/lib/produce-version-control.ts`
- Backup produce.ts before each modification
- Store backups in `/farm-frontend/data/produce-backups/`
- Implement rollback command: `pnpm run produce:rollback`
- Add diff comparison between versions
- Test: backup, modify, rollback, verify
- Files: 1 new
- Lines: ~130 lines

**Slice 5.4.5: Daily Health Check Cron**
- Create `/farm-frontend/src/app/api/cron/produce-health/route.ts`
- Run daily at 3am UTC
- Check: missing images, broken URLs, data integrity
- Auto-remediate: regenerate broken images
- Send email alert if critical issues found
- Test with Vercel Cron simulation
- Files: 1 new
- Lines: ~110 lines

---

## UK Produce List (100+ Items)

### Vegetables (45)
Asparagus, Beetroot, Broccoli, Brussels Sprouts, Cabbage (Green), Cabbage (Red), Carrots, Cauliflower, Celeriac, Celery, Chard, Courgettes, Cucumber, Fennel, French Beans, Kale, Kohlrabi, Leeks, Lettuce, Onions, Pak Choi, Parsnips, Peas, Potatoes (New), Potatoes (Maincrop), Pumpkin, Radish, Rocket, Runner Beans, Savoy Cabbage, Shallots, Spinach, Spring Greens, Spring Onions, Squash (Butternut), Squash (Acorn), Swede, Sweetcorn, Tomatoes (Beef), Tomatoes (Cherry), Turnips, Watercress, Purple Sprouting Broccoli, Broad Beans, Jersey Royals

### Fruits (30)
Apples (Bramley), Apples (Cox), Apples (Gala), Blackberries, Blackcurrants, Blueberries, Cherries, Damsons, Elderberries, Gooseberries, Greengages, Loganberries, Pears (Conference), Pears (Williams), Plums (Victoria), Quinces, Raspberries, Redcurrants, Rhubarb, Sloes, Strawberries, Whitecurrants, Apricots (UK grown), Cranberries, Figs (UK grown), Grapes (UK grown), Melons (polytunnel), Peaches (UK grown), Nectarines (UK grown), Tayberries

### Herbs (15)
Basil, Chives, Coriander, Dill, Mint, Oregano, Parsley (Flat-leaf), Parsley (Curly), Rosemary, Sage, Tarragon, Thyme, Bay Leaves, Chervil, Lovage

### Salads (10)
Lamb's Lettuce, Little Gem, Lollo Rosso, Mizuna, Mustard Greens, Radicchio, Rocket (Wild), Sorrel, Watercress, Winter Purslane

---

## Validation Standards

### Content Quality (DeepSeek Output)
- ✅ Nutrition values within realistic ranges
- ✅ UK seasonal months accurate (cross-check with UK government data)
- ✅ Tips use UK terminology (courgette not zucchini, aubergine not eggplant)
- ✅ Recipe URLs accessible (HTTP 200)
- ✅ No alcohol-related recipes
- ✅ Family-friendly content only
- ✅ Confidence score ≥ 95% for auto-approval

### Image Quality (fal.ai Output)
- ✅ Minimum resolution: 1600x900 pixels
- ✅ Maximum file size: 2MB (after optimization)
- ✅ Sharpness score ≥ 0.7 (not blurry)
- ✅ Brightness: 0.3-0.9 (not too dark/bright)
- ✅ Editorial food photography style
- ✅ Produce clearly visible in frame
- ✅ No people/faces in images

### Data Integrity
- ✅ All required fields present
- ✅ Unique slug (no duplicates)
- ✅ Peak months subset of in-season months
- ✅ Energy calculation accuracy within 15%
- ✅ No duplicate tips across categories
- ✅ Recipe URLs from approved domains only

---

## Cost Estimation

### DeepSeek API
- 100 produce items × 5 API calls = 500 calls
- Cost: ~$10-20 total (one-time)
- Self-review adds 100 calls: +$5
- **Total**: $15-25 for initial generation

### fal.ai + Pollinations
- 100 produce items × 4 images = 400 images
- fal.ai: ~$0.05/image × 300 successful = $15
- Pollinations: FREE (fallback for ~100 images)
- **Total**: $15 for images

### Vercel Blob Storage
- 400 images × 500KB average = 200MB
- Vercel Blob free tier: 500MB
- **Total**: FREE

### Monthly Maintenance
- Daily health checks: ~30 API calls/month
- Regenerate broken images: ~10 images/month
- **Total**: ~$5-10/month

**Grand Total**: $35-45 one-time + $5-10/month

---

## Success Metrics

### Automation Efficiency
- ✅ 95%+ items auto-approved (confidence ≥ 95%)
- ✅ < 5% requiring manual review
- ✅ < 1% requiring manual data entry
- ✅ Zero inappropriate content slips through

### Data Quality
- ✅ 100+ UK produce items with complete metadata
- ✅ 100% nutrition data accuracy (validated against NHS/USDA)
- ✅ 100% recipe URL accessibility
- ✅ 4 high-quality images per item

### Image Quality
- ✅ 100% images meet resolution standards
- ✅ 95%+ images meet sharpness standards
- ✅ Zero images with people/faces
- ✅ Editorial food photography aesthetic maintained

### Operational
- ✅ Daily automated health checks running
- ✅ Zero manual intervention needed (95% of time)
- ✅ Rollback capability tested and working
- ✅ < 2 hours to generate 100 complete items

---

## Implementation Timeline

### Week 1: Foundation
- **Day 1-2**: DeepSeek client setup (Slices 5.1.1-5.1.2)
- **Day 3-4**: Seasonal & tips generation (Slices 5.1.3-5.1.4)
- **Day 5**: Recipe generation & review (Slices 5.1.5-5.1.6)
- **Deliverable**: Generate complete content for 5 test items

### Week 2: Image System
- **Day 1-2**: Enhance image generator (Slices 5.2.1-5.2.2)
- **Day 3**: Image quality validation (Slice 5.2.3)
- **Day 4**: Retry logic enhancement (Slice 5.2.4)
- **Day 5**: Test end-to-end with 5 items
- **Deliverable**: 5 items with validated content + images

### Week 3: Pipeline Integration
- **Day 1-2**: Pipeline orchestrator (Slice 5.3.1)
- **Day 3**: Validation system (Slice 5.3.2)
- **Day 4**: Output formatter (Slice 5.3.3)
- **Day 5**: Review dashboard (Slice 5.3.4)
- **Deliverable**: End-to-end pipeline tested with 10 items

### Week 4: Automation & Scale
- **Day 1**: Batch processing (Slice 5.4.1)
- **Day 2**: Quality monitoring (Slice 5.4.2)
- **Day 3**: Auto-fixes & version control (Slices 5.4.3-5.4.4)
- **Day 4**: Health check cron (Slice 5.4.5)
- **Day 5**: Generate all 100+ items
- **Deliverable**: Production-ready with 100+ complete items

---

## Integration with TASKMASTER_PLAN.md

Add this as **Phase 5** after Phase 4 (Polish & Launch):

```markdown
### **PHASE 5: CONTENT AUTOMATION** (Week 5-8)
**Goal**: Scale to 100+ seasonal produce items with automated generation

#### Track 1: DeepSeek Content Generation 🤖
- [x] Set up DeepSeek API client
- [x] Generate nutrition, seasonality, tips
- [x] Generate family-friendly recipe chips
- [x] Implement self-review quality check
- [x] Test with 5 produce items

#### Track 2: fal.ai Image Generation 🎨
- [x] Enhance existing image generator
- [x] Add batch processing with rate limiting
- [x] Implement quality validation
- [x] Test with 10 produce items

#### Track 3: Unified Pipeline 🔄
- [x] Build end-to-end orchestrator
- [x] Create validation system
- [x] Build review queue dashboard
- [x] Test with 20 produce items

#### Track 4: Scale to Production 🚀
- [x] Generate all 100+ UK produce items
- [x] Set up daily health checks
- [x] Implement auto-remediation
- [x] Deploy to production
```

---

## Rollback Strategy

### If Issues Detected
1. **Immediate**: Stop automated generation
2. **Assess**: Check validation reports and error logs
3. **Rollback**: Use version control to restore previous produce.ts
4. **Fix**: Correct prompts, validators, or generation logic
5. **Test**: Run with 5 items before full regeneration
6. **Resume**: Restart automated generation

### Backup Points
- Before each batch generation
- After each successful validation
- Daily snapshot at 3am UTC
- Retain 30 days of backups

---

## Manual Review Process

### Items Requiring Review (Confidence < 95%)
1. Displayed in admin dashboard at `/admin/produce-review`
2. Show generated data side-by-side with any existing data
3. Highlight flagged issues (nutrition outliers, broken URLs, etc.)
4. Options:
   - **Approve**: Add to produce.ts immediately
   - **Edit & Approve**: Fix minor issues inline, then approve
   - **Regenerate**: Run DeepSeek again with refined prompts
   - **Reject**: Flag for manual data entry

### Review Criteria
- Nutrition values seem realistic
- UK seasonality matches common knowledge
- Tips are practical and UK-specific
- Recipes are family-friendly and accessible
- Images are high-quality and relevant

---

## Future Enhancements (Post-Launch)

### Phase 6: Advanced Features
- **Multi-language support**: Generate Welsh translations
- **Regional variations**: Scotland vs England seasonal differences
- **Image variations**: Generate 4 style variations per produce
- **Video generation**: 15-second recipe videos
- **Nutritional comparisons**: Auto-generate "similar to" suggestions
- **Seasonal alerts**: Email subscribers when favorites come into season

### Phase 7: User-Generated Content
- **Photo submissions**: Users upload produce photos from farms
- **Recipe submissions**: Users share their own recipes
- **Seasonal reports**: Community reports on what's available now
- **Farm produce mapping**: Link produce to specific farms

---

## Verification Commands

### Test Individual Components
```bash
# Test DeepSeek content generation
pnpm run test:deepseek-content --produce=strawberries

# Test fal.ai image generation
pnpm run generate:produce-images --produce=kale --count=4

# Test validation system
pnpm run test:produce-validator

# Run quality audit
pnpm run audit:produce-quality
```

### Generate Complete Items
```bash
# Dry run (no API calls)
pnpm run generate:seasonal-batch --count=5 --dry-run

# Generate 10 items
pnpm run generate:seasonal-batch --count=10

# Generate all with auto-approve
pnpm run generate:seasonal-batch --all --auto-approve
```

### Health Checks
```bash
# Manual health check
pnpm run check:produce-health

# Rollback to previous version
pnpm run produce:rollback --version=2026-01-20

# Compare versions
pnpm run produce:diff --v1=current --v2=2026-01-20
```

---

## Risk Mitigation

### High Risk: Inappropriate Content
- **Mitigation**: Multi-layer validation (DeepSeek review + keyword filters + manual review queue)
- **Detection**: Automated scanning for alcohol, gambling, inappropriate terms
- **Response**: Auto-reject and flag for review

### Medium Risk: Inaccurate Nutrition Data
- **Mitigation**: Cross-validate with NHS/USDA databases
- **Detection**: Range checks and energy calculation accuracy
- **Response**: Flag for manual verification

### Medium Risk: Broken Recipe URLs
- **Mitigation**: URL accessibility checks before approval
- **Detection**: Daily automated health checks
- **Response**: Auto-replace with archive.org fallback

### Low Risk: Poor Image Quality
- **Mitigation**: Quality validation (resolution, sharpness, brightness)
- **Detection**: Automated image analysis
- **Response**: Auto-regenerate with different seed

---

## Documentation Requirements

### Developer Docs
- API integration guide (DeepSeek + fal.ai)
- Validation system architecture
- Adding new produce items manually
- Troubleshooting guide

### Admin Docs
- Using the review dashboard
- Approving/rejecting items
- Running manual health checks
- Rollback procedures

### User Docs
- How seasonal produce data is sourced
- Data accuracy guarantees
- Reporting incorrect information

---

## Compliance & Legal

### Data Sources
- Nutrition data: NHS, USDA FoodData Central
- Seasonal data: UK government agricultural calendars
- Recipes: Only from reputable, licensed sources

### Attribution
- All AI-generated content labeled as such
- Image attributions preserved (if using stock photos)
- Recipe sources clearly linked
- Nutrition data sources cited

### GDPR Compliance
- No personal data collected during generation
- Admin review logs stored securely
- User submissions (future) with proper consent

---

**Last Updated**: 2026-01-22
**Status**: Ready for Implementation
**Owner**: FlowCoder (assisted by Claude)
**Estimated Completion**: 4 weeks
**Budget**: $50 (one-time) + $10/month (maintenance)
