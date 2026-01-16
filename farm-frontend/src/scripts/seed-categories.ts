/**
 * Seed Categories Script
 *
 * Seeds the database with comprehensive UK farm categories.
 *
 * Usage: pnpm tsx src/scripts/seed-categories.ts
 */

import { prisma } from '../lib/prisma'

const categories = [
  // Primary Categories
  {
    name: 'Organic Farms',
    slug: 'organic-farms',
    description: 'Certified organic farms and producers following organic farming principles',
    icon: '🌱',
    displayOrder: 1,
  },
  {
    name: 'Pick Your Own',
    slug: 'pick-your-own',
    description: 'PYO farms where you can pick your own fruit, vegetables, and flowers',
    icon: '🍓',
    displayOrder: 2,
  },
  {
    name: 'Farm Shops',
    slug: 'farm-shops',
    description: 'Farm shops selling fresh local produce directly from the farm',
    icon: '🛒',
    displayOrder: 3,
  },
  {
    name: 'Dairy Farms',
    slug: 'dairy-farms',
    description: 'Dairy farms producing milk, cheese, yogurt, and other dairy products',
    icon: '🥛',
    displayOrder: 4,
  },
  {
    name: 'Meat Producers',
    slug: 'meat-producers',
    description: 'Farms producing beef, lamb, pork, and poultry',
    icon: '🥩',
    displayOrder: 5,
  },
  {
    name: 'Vegetable Farms',
    slug: 'vegetable-farms',
    description: 'Farms growing fresh vegetables and salads',
    icon: '🥕',
    displayOrder: 6,
  },
  {
    name: 'Fruit Farms',
    slug: 'fruit-farms',
    description: 'Orchards and farms growing apples, berries, and other fruits',
    icon: '🍎',
    displayOrder: 7,
  },

  // Specialized Categories
  {
    name: 'Farm Cafes & Restaurants',
    slug: 'farm-cafes',
    description: 'Farm cafes and restaurants serving food from local produce',
    icon: '☕',
    displayOrder: 8,
  },
  {
    name: 'Farmers Markets',
    slug: 'farmers-markets',
    description: 'Regular farmers markets with local producers',
    icon: '🏪',
    displayOrder: 9,
  },
  {
    name: 'Veg Box Schemes',
    slug: 'veg-box-schemes',
    description: 'Home delivery of fresh local vegetables and produce',
    icon: '📦',
    displayOrder: 10,
  },
  {
    name: 'Christmas Trees',
    slug: 'christmas-trees',
    description: 'Christmas tree farms with choose-and-cut trees',
    icon: '🎄',
    displayOrder: 11,
  },
  {
    name: 'Free Range Eggs',
    slug: 'free-range-eggs',
    description: 'Farms selling fresh free range and organic eggs',
    icon: '🥚',
    displayOrder: 12,
  },
  {
    name: 'Farm Stays & Accommodation',
    slug: 'farm-stays',
    description: 'Farm holidays, B&Bs, and glamping on working farms',
    icon: '🏡',
    displayOrder: 13,
  },
  {
    name: 'Educational Farm Visits',
    slug: 'educational-visits',
    description: 'Farms offering school visits and educational activities',
    icon: '🎓',
    displayOrder: 14,
  },
  {
    name: 'Pumpkin Patches',
    slug: 'pumpkin-patches',
    description: 'Seasonal pumpkin patches and Halloween activities',
    icon: '🎃',
    displayOrder: 15,
  },

  // Produce Types
  {
    name: 'Honey & Beekeeping',
    slug: 'honey-beekeeping',
    description: 'Local honey producers and beekeepers',
    icon: '🍯',
    displayOrder: 16,
  },
  {
    name: 'Cider & Apple Juice',
    slug: 'cider-apple-juice',
    description: 'Producers of cider, apple juice, and perry',
    icon: '🍏',
    displayOrder: 17,
  },
  {
    name: 'Cheese Makers',
    slug: 'cheese-makers',
    description: 'Artisan cheese producers',
    icon: '🧀',
    displayOrder: 18,
  },
  {
    name: 'Ice Cream Farms',
    slug: 'ice-cream-farms',
    description: 'Farms making their own ice cream',
    icon: '🍦',
    displayOrder: 19,
  },
  {
    name: 'Bakeries & Flour Mills',
    slug: 'bakeries-flour-mills',
    description: 'Farm bakeries and flour mills',
    icon: '🍞',
    displayOrder: 20,
  },

  // Activities & Experiences
  {
    name: 'Farm Attractions',
    slug: 'farm-attractions',
    description: 'Family farm attractions with animals and activities',
    icon: '🎡',
    displayOrder: 21,
  },
  {
    name: 'Farm Parks',
    slug: 'farm-parks',
    description: 'Farm parks and petting farms',
    icon: '🐑',
    displayOrder: 22,
  },
  {
    name: 'Alpaca Farms',
    slug: 'alpaca-farms',
    description: 'Alpaca farms with farm shop and experiences',
    icon: '🦙',
    displayOrder: 23,
  },
  {
    name: 'Vineyard & Wine',
    slug: 'vineyards',
    description: 'English vineyards and wine producers',
    icon: '🍷',
    displayOrder: 24,
  },
  {
    name: 'Brewery & Distillery',
    slug: 'breweries-distilleries',
    description: 'Farm breweries and distilleries',
    icon: '🍺',
    displayOrder: 25,
  },

  // Specialty Products
  {
    name: 'Herbs & Salads',
    slug: 'herbs-salads',
    description: 'Specialist herb and salad growers',
    icon: '🌿',
    displayOrder: 26,
  },
  {
    name: 'Preserves & Jams',
    slug: 'preserves-jams',
    description: 'Makers of jams, chutneys, and preserves',
    icon: '🫙',
    displayOrder: 27,
  },
  {
    name: 'Fish Farms & Smokeries',
    slug: 'fish-farms',
    description: 'Fish farms and smokehouses',
    icon: '🐟',
    displayOrder: 28,
  },
  {
    name: 'Plant Nurseries',
    slug: 'plant-nurseries',
    description: 'Plant nurseries and garden centers',
    icon: '🌸',
    displayOrder: 29,
  },
  {
    name: 'Cut Flowers',
    slug: 'cut-flowers',
    description: 'Cut flower farms and PYO flowers',
    icon: '💐',
    displayOrder: 30,
  },

  // Farming Practices
  {
    name: 'Regenerative Farms',
    slug: 'regenerative-farms',
    description: 'Farms using regenerative agriculture practices',
    icon: '♻️',
    displayOrder: 31,
  },
  {
    name: 'Biodynamic Farms',
    slug: 'biodynamic-farms',
    description: 'Biodynamic certified farms',
    icon: '🌙',
    displayOrder: 32,
  },
  {
    name: 'Community Supported Agriculture',
    slug: 'csa',
    description: 'CSA farms with membership schemes',
    icon: '🤝',
    displayOrder: 33,
  },
  {
    name: 'Rare Breeds',
    slug: 'rare-breeds',
    description: 'Farms specializing in rare breed conservation',
    icon: '🐄',
    displayOrder: 34,
  },
  {
    name: 'Permaculture Farms',
    slug: 'permaculture-farms',
    description: 'Farms using permaculture design principles',
    icon: '🌍',
    displayOrder: 35,
  },
]

async function main() {
  console.log('🌱 Seeding categories...\n')

  let created = 0
  let skipped = 0

  for (const category of categories) {
    try {
      await prisma.category.create({
        data: category,
      })
      console.log(`✓ Created: ${category.name}`)
      created++
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⊘ Skipped (exists): ${category.name}`)
        skipped++
      } else {
        console.error(`✗ Error creating ${category.name}:`, error.message)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Category Seeding Complete!')
  console.log('='.repeat(60))
  console.log(`✓ Created: ${created} categories`)
  console.log(`⊘ Skipped: ${skipped} categories`)
  console.log(`📊 Total: ${categories.length} categories`)

  await prisma.$disconnect()
}

main()
