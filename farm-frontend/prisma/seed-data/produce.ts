/**
 * Seed data for Produce model
 * Derived from existing src/data/produce.ts seasonal content
 */

export interface ProduceSeedData {
  name: string
  slug: string
  description: string
  category: 'Fruit' | 'Vegetable' | 'Herb'
  seasonStart: number // Month 1-12
  seasonEnd: number   // Month 1-12
  icon: string
  imageUrl: string | null
  displayOrder: number
  seasonalPageSlug: string
}

/**
 * UK Seasonal Produce Catalog
 * Season dates represent typical UK growing/availability periods
 */
export const PRODUCE_SEED_DATA: ProduceSeedData[] = [
  // Spring produce
  {
    name: 'Asparagus',
    slug: 'asparagus',
    description: 'Prized British spring vegetable with a short but celebrated season',
    category: 'Vegetable',
    seasonStart: 4, // April
    seasonEnd: 6,   // June
    icon: '🌿',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/1/main.webp',
    displayOrder: 1,
    seasonalPageSlug: 'asparagus',
  },
  {
    name: 'Purple Sprouting Broccoli',
    slug: 'purple-sprouting-broccoli',
    description: 'Hardy winter brassica that bridges the hungry gap in early spring',
    category: 'Vegetable',
    seasonStart: 1, // January
    seasonEnd: 4,   // April
    icon: '🥦',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/1/main.webp',
    displayOrder: 2,
    seasonalPageSlug: 'purple-sprouting-broccoli',
  },

  // Summer produce
  {
    name: 'Strawberries',
    slug: 'strawberries',
    description: 'Quintessential British summer fruit, perfect for Wimbledon season',
    category: 'Fruit',
    seasonStart: 5, // May
    seasonEnd: 8,   // August
    icon: '🍓',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/1/main.webp',
    displayOrder: 3,
    seasonalPageSlug: 'strawberries',
  },
  {
    name: 'Tomatoes',
    slug: 'tomato',
    description: 'Sun-ripened British tomatoes with unbeatable summer flavour',
    category: 'Vegetable',
    seasonStart: 6, // June
    seasonEnd: 10,  // October
    icon: '🍅',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/1/main.webp',
    displayOrder: 4,
    seasonalPageSlug: 'tomato',
  },
  {
    name: 'Sweetcorn',
    slug: 'sweetcorn',
    description: 'Fresh British sweetcorn at peak sweetness straight from the field',
    category: 'Vegetable',
    seasonStart: 7, // July
    seasonEnd: 9,   // September
    icon: '🌽',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/1/main.webp',
    displayOrder: 5,
    seasonalPageSlug: 'sweetcorn',
  },
  {
    name: 'Runner Beans',
    slug: 'runner-beans',
    description: 'Classic British allotment favourite with vibrant green pods',
    category: 'Vegetable',
    seasonStart: 7, // July
    seasonEnd: 10,  // October
    icon: '🫛',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/1/main.webp',
    displayOrder: 6,
    seasonalPageSlug: 'runner-beans',
  },
  {
    name: 'Blackberries',
    slug: 'blackberries',
    description: 'Wild hedgerow treasure perfect for foraging and crumbles',
    category: 'Fruit',
    seasonStart: 7, // July
    seasonEnd: 9,   // September
    icon: '🫐',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/1/main.webp',
    displayOrder: 7,
    seasonalPageSlug: 'blackberries',
  },

  // Autumn produce
  {
    name: 'Apples',
    slug: 'apples',
    description: 'Heritage British apple varieties at their crisp autumn best',
    category: 'Fruit',
    seasonStart: 9,  // September
    seasonEnd: 12,   // December
    icon: '🍎',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/1/main.webp',
    displayOrder: 8,
    seasonalPageSlug: 'apples',
  },
  {
    name: 'Plums',
    slug: 'plums',
    description: 'Sweet Victoria plums and damsons for eating and preserving',
    category: 'Fruit',
    seasonStart: 8, // August
    seasonEnd: 10,  // October
    icon: '🍑',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/1/main.webp',
    displayOrder: 9,
    seasonalPageSlug: 'plums',
  },
  {
    name: 'Pumpkins',
    slug: 'pumpkins',
    description: 'Autumn squash for soups, roasting, and Halloween carving',
    category: 'Vegetable',
    seasonStart: 9,  // September
    seasonEnd: 11,   // November
    icon: '🎃',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/1/main.webp',
    displayOrder: 10,
    seasonalPageSlug: 'pumpkins',
  },

  // Winter produce
  {
    name: 'Kale',
    slug: 'kale',
    description: 'Hardy winter green that improves with frost',
    category: 'Vegetable',
    seasonStart: 11, // November
    seasonEnd: 4,    // April (wraps around)
    icon: '🥬',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/1/main.webp',
    displayOrder: 11,
    seasonalPageSlug: 'kale',
  },
  {
    name: 'Leeks',
    slug: 'leeks',
    description: 'Versatile allium for soups, pies, and winter warmers',
    category: 'Vegetable',
    seasonStart: 9,  // September
    seasonEnd: 4,    // April (wraps around)
    icon: '🧅',
    imageUrl: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/1/main.webp',
    displayOrder: 12,
    seasonalPageSlug: 'leeks',
  },
]

/**
 * Helper to check if a produce item is currently in season
 * Handles wrap-around seasons (e.g., Nov-Apr)
 */
export function isInSeason(produce: ProduceSeedData, month: number): boolean {
  if (produce.seasonStart <= produce.seasonEnd) {
    // Normal season (e.g., Apr-Jun)
    return month >= produce.seasonStart && month <= produce.seasonEnd
  } else {
    // Wrap-around season (e.g., Nov-Apr)
    return month >= produce.seasonStart || month <= produce.seasonEnd
  }
}
