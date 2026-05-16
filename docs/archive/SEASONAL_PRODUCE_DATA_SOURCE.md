# Seasonal Produce Data System

## Current Data Source

**Location:** `/src/data/produce.ts`

**Current Status:** 
- ✅ 10 produce items manually entered
- ✅ Each item includes:
  - Seasonality (monthsInSeason, peakMonths)
  - Nutritional info per 100g (kcal, protein, carbs, sugars, fiber, fat)
  - Selection tips (how to choose quality produce)
  - Storage tips (how to store and shelf life)
  - Prep ideas (cooking and preparation suggestions)
  - Recipe chips (external links to family-friendly recipes)
  - Images (currently empty arrays - designed to be populated)

**Items Currently Included:**
1. Sweetcorn
2. Tomatoes
3. Strawberries
4. Asparagus
5. Blackberries
6. Courgettes
7. Lettuce
8. Potatoes
9. Apples
10. Pears

## Image System (Separate Project)

**Location:** `/farm-produce-images/` (separate Next.js app)
**API:** https://farm-produce-images-mm7s8jmyf-abdur-rahman-morris-projects.vercel.app

**Integration:**
- Farm-frontend connects to farm-produce-images API
- Images can be uploaded per produce item per month
- Static images in produce.ts are fallbacks
- API images load client-side if available

## What's Missing

### ❌ AI Generation System
Currently there is **NO** automated AI/DeepSeek system to:
- Generate produce data
- Generate recipes
- Generate nutritional information
- Generate tips and advice
- Update seasonal information

All data in `/src/data/produce.ts` is manually written.

## What You Mentioned Attempting

You mentioned trying to use:
1. **DeepSeek** - To generate the produce information
2. **Another program** - For images (this is the farm-produce-images system)

## Recommendation: Build AI Generation System

### Suggested Setup

Create a new script/project:
`/farm-companion/produce-data-generator/`

```
produce-data-generator/
├── src/
│   ├── deepseek-client.ts       # DeepSeek API integration
│   ├── produce-generator.ts     # Main generation logic
│   ├── templates/
│   │   ├── nutrition.prompt     # Prompt for nutrition data
│   │   ├── recipes.prompt       # Prompt for recipes
│   │   ├── tips.prompt          # Prompt for selection/storage
│   │   └── seasonality.prompt   # Prompt for UK seasonality
│   └── utils/
│       ├── validator.ts         # Validate generated data
│       └── formatter.ts         # Format for produce.ts
├── config/
│   ├── produce-list.json        # List of UK produce to generate
│   └── deepseek.config.json     # DeepSeek API settings
├── output/
│   └── generated-produce.ts     # Generated produce data
└── package.json
```

### Workflow

1. **Input:** List of UK produce items (e.g., "carrots", "parsnips", "leeks")
2. **DeepSeek Prompts:**
   - "Generate UK seasonality calendar for {produce}"
   - "Generate nutrition facts per 100g for {produce}"
   - "Generate 5 selection tips for {produce}"
   - "Generate 5 storage tips for {produce}"
   - "Generate 5 prep ideas for {produce}"
   - "Find 3 family-friendly recipe URLs for {produce}"
3. **Validation:** Check data format, nutrition ranges, UK seasons
4. **Output:** TypeScript file matching `/src/data/produce.ts` format
5. **Manual Review:** Review and merge into main produce.ts

### Example Script Structure

```typescript
// produce-generator.ts
import { DeepSeekClient } from './deepseek-client'

interface ProduceRequest {
  name: string
  category: 'vegetable' | 'fruit' | 'herb'
}

async function generateProduceData(item: ProduceRequest) {
  const client = new DeepSeekClient(process.env.DEEPSEEK_API_KEY)
  
  // Generate each section
  const seasonality = await client.generateSeasonality(item.name)
  const nutrition = await client.generateNutrition(item.name)
  const tips = await client.generateTips(item.name)
  const recipes = await client.findRecipes(item.name)
  
  // Format and validate
  const produceData = formatProduceData({
    name: item.name,
    seasonality,
    nutrition,
    tips,
    recipes
  })
  
  return validateProduceData(produceData)
}
```

## Action Items

1. ✅ **Images:** Already handled by farm-produce-images system
2. ❌ **Data Generation:** Need to build DeepSeek integration
3. ❌ **Expand Coverage:** Currently 10 items, UK has 100+ seasonal produce

Would you like me to help you build the DeepSeek produce data generation system?
