/**
 * Curated "Best Of" Lists
 *
 * Editorial content featuring top farms in specific categories or contexts.
 * Each list is manually curated to provide genuine value to users.
 */

export interface BestList {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  heading: string
  intro: string
  content: string
  category?: string
  region?: string
  featured: boolean
  publishDate: string
  updateDate: string
  faqs: Array<{
    question: string
    answer: string
  }>
}

export const bestLists: BestList[] = [
  {
    slug: 'best-organic-farms-uk',
    title: 'Best Organic Farms in the UK',
    metaTitle: 'Top 20 Best Organic Farms in the UK (2026) | Farm Companion',
    metaDescription: 'Discover the best organic farms in the UK. From certified organic producers to biodynamic farms, find top-rated organic farms near you.',
    heading: '20 Best Organic Farms in the UK',
    intro: 'Discover the finest organic farms across the UK, from certified organic producers to pioneering biodynamic farms. These farms are committed to sustainable agriculture, animal welfare, and producing the highest quality organic food.',
    content: `## Why Choose Organic?

Organic farming is more than just avoiding pesticides. It's a holistic approach that prioritizes soil health, biodiversity, and environmental sustainability. The farms featured in this guide have been selected for their commitment to organic principles, product quality, and visitor experience.

## What Makes These Farms Special

Each farm on this list has been chosen based on:
- **Certification**: Soil Association or equivalent organic certification
- **Quality**: High-quality produce and products
- **Sustainability**: Environmental and social responsibility
- **Experience**: Welcoming visitors and offering farm experiences
- **Reviews**: Excellent customer feedback and ratings

## Regional Coverage

We've included organic farms from across the UK, ensuring representation from England, Scotland, Wales, and Northern Ireland. Whether you're in the countryside or near a major city, you'll find exceptional organic farms nearby.`,
    category: 'organic-farms',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'What does organic certification mean?',
        answer: 'Organic certification means the farm meets strict standards set by certifying bodies like the Soil Association. This includes no synthetic pesticides, GMO-free crops, high animal welfare standards, and sustainable farming practices.',
      },
      {
        question: 'Are organic farms more expensive?',
        answer: 'Organic products often cost slightly more due to higher production standards and lower yields. However, many people find the quality, taste, and environmental benefits worth the premium.',
      },
      {
        question: 'Can I visit these organic farms?',
        answer: 'Most organic farms on this list welcome visitors, though some require advance booking. Check individual farm details for visiting information, opening hours, and any special events.',
      },
    ],
  },
  {
    slug: 'top-pick-your-own-farms',
    title: 'Top Pick Your Own Farms',
    metaTitle: 'Best Pick Your Own Farms in the UK (2026) | PYO Guide',
    metaDescription: 'Find the best pick your own (PYO) farms in the UK. From strawberries to pumpkins, discover top-rated farms for a fun family day out.',
    heading: 'Top 20 Pick Your Own Farms in the UK',
    intro: 'Experience the joy of harvesting your own fresh fruit and vegetables at these top-rated Pick Your Own (PYO) farms across the UK. Perfect for families, these farms offer seasonal produce picking from strawberries in summer to pumpkins in autumn.',
    content: `## The PYO Experience

Pick Your Own farms offer a unique opportunity to harvest fresh produce directly from the field. It's a fun family activity that teaches children where food comes from while ensuring the freshest possible fruit and vegetables.

## What to Expect

Most PYO farms provide:
- **Containers**: Baskets or buckets for collecting your harvest
- **Guidance**: Staff to show you the best picking areas
- **Facilities**: Toilets, parking, and often a farm shop or café
- **Payment**: Usually by weight of produce picked
- **Season**: Different crops available throughout the year

## Seasonal Guide

- **Spring**: Rhubarb, asparagus
- **Summer**: Strawberries, raspberries, cherries, peas, beans
- **Autumn**: Apples, plums, pumpkins, squash
- **Year-round**: Many farms offer vegetables throughout the year

## Top Tips for PYO

1. **Check opening times**: Many farms are weather-dependent
2. **Arrive early**: Best selection in the morning
3. **Dress appropriately**: Muddy boots and sun protection
4. **Bring cash**: Not all farms accept cards
5. **Pick carefully**: Handle fruit gently to avoid bruising`,
    category: 'pick-your-own',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'When is PYO season?',
        answer: 'PYO season varies by crop. Strawberries typically run June-August, raspberries July-September, and pumpkins September-October. Many farms have crops available from May through October.',
      },
      {
        question: 'Do I need to book in advance?',
        answer: 'Most PYO farms don\'t require booking, but it\'s always best to call ahead to check crop availability and opening times, especially during peak seasons or bad weather.',
      },
      {
        question: 'Is PYO cheaper than buying from shops?',
        answer: 'PYO is often competitively priced and offers much fresher produce. You also get the experience and satisfaction of picking your own, which many families find valuable.',
      },
    ],
  },
  {
    slug: 'best-farm-shops-london',
    title: 'Best Farm Shops Near London',
    metaTitle: 'Top 15 Best Farm Shops Near London (2026) | Fresh Local Produce',
    metaDescription: 'Discover the best farm shops within an hour of London. Find fresh, locally-sourced produce, organic vegetables, and artisan products.',
    heading: 'Best Farm Shops Within 60 Minutes of London',
    intro: 'Escape the city and discover outstanding farm shops within an hour\'s drive of London. These farms offer fresh, locally-sourced produce, organic vegetables, artisan cheeses, and much more – all while supporting local agriculture.',
    content: `## Why Visit Farm Shops Near London?

Living in or near London doesn't mean sacrificing access to fresh, local produce. These carefully selected farm shops offer a welcome escape from supermarkets, with produce often picked the same day and meat from animals raised on-site.

## What You'll Find

London-area farm shops typically stock:
- **Fresh Vegetables**: Seasonal produce, often organic
- **Quality Meat**: Free-range, grass-fed, locally reared
- **Dairy Products**: Fresh milk, artisan cheese, yogurt
- **Bakery**: Fresh bread, cakes, and pastries
- **Pantry**: Jams, honey, preserves, and sauces
- **Café**: Many have on-site cafés serving farm-fresh food

## Geographic Coverage

This guide includes farms in:
- **Surrey & Sussex**: South of London (30-60 mins)
- **Kent**: Southeast (40-70 mins)
- **Essex**: Northeast (30-60 mins)
- **Hertfordshire**: North (30-50 mins)
- **Berkshire & Buckinghamshire**: West (40-70 mins)

## Making the Most of Your Visit

1. **Weekend trips**: Turn shopping into a day out
2. **Stock up**: Buy in bulk and freeze what you can
3. **Ask questions**: Farm staff are knowledgeable and helpful
4. **Enjoy the café**: Many have excellent farm-to-table cafés
5. **Check events**: Some host seasonal events and markets`,
    region: 'london',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'How far from London are these farm shops?',
        answer: 'All farms in this guide are within 60 minutes\' drive of central London, with many accessible by public transport. We\'ve included distance and travel information for each farm.',
      },
      {
        question: 'Are farm shops more expensive than supermarkets?',
        answer: 'Prices are competitive, especially for seasonal produce. While some specialty items cost more, the quality is significantly higher and you\'re supporting local farmers directly.',
      },
      {
        question: 'Can I order online for delivery?',
        answer: 'Many London-area farm shops offer online ordering with home delivery or collection. This is particularly popular for meat boxes and vegetable boxes.',
      },
    ],
  },
  {
    slug: 'top-farm-cafes-uk',
    title: 'Top Farm Cafés in the UK',
    metaTitle: 'Best Farm Cafés in the UK (2026) | Farm-to-Table Dining',
    metaDescription: 'Discover the UK\'s best farm cafés serving fresh, locally-sourced food. From full breakfasts to afternoon tea, find top-rated farm dining.',
    heading: 'Top 15 Farm Cafés for Farm-to-Table Dining',
    intro: 'Experience true farm-to-table dining at these exceptional farm cafés across the UK. Enjoy freshly prepared food using ingredients grown on-site or sourced from neighboring farms, all in beautiful rural settings.',
    content: `## The Farm Café Experience

Farm cafés offer something supermarkets and restaurants can't match: ingredients that travel meters, not miles. Many serve vegetables picked that morning, eggs laid that day, and meat from animals raised on the farm.

## What Sets Farm Cafés Apart

- **Ultra-fresh ingredients**: Produce picked daily
- **Seasonal menus**: Changing with what's available
- **Transparency**: You can often see where your food was grown
- **Quality**: Higher welfare standards and better taste
- **Views**: Beautiful rural settings

## Typical Menu Offerings

Most farm cafés serve:
- **Breakfast**: Full English, eggs, sausages, bacon (farm-reared)
- **Lunch**: Soups, sandwiches, salads, quiches
- **Cakes & Pastries**: Homemade using farm produce
- **Afternoon Tea**: Scones, cakes, sandwiches
- **Coffee & Tea**: Often locally roasted or sourced

## Why Visit?

Beyond the food, farm cafés offer:
- Family-friendly environments with outdoor space
- Farm shops attached for takeaway ingredients
- Play areas for children
- Events and seasonal activities
- Supporting local agriculture directly`,
    category: 'farm-cafes',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'Do farm cafés cater to dietary requirements?',
        answer: 'Most farm cafés offer vegetarian options, and many can accommodate vegan, gluten-free, and other dietary needs. It\'s best to call ahead for specific requirements.',
      },
      {
        question: 'Are farm cafés open year-round?',
        answer: 'Opening hours vary by season and weather. Many are busiest in spring and summer but open year-round. Always check before visiting, especially in winter.',
      },
      {
        question: 'Do I need to book?',
        answer: 'Walk-ins are usually welcome, but weekends and holidays can be busy. Booking is recommended for groups or special occasions.',
      },
    ],
  },
  {
    slug: 'best-christmas-tree-farms',
    title: 'Best Christmas Tree Farms',
    metaTitle: 'Best Christmas Tree Farms in the UK (2026) | Choose & Cut',
    metaDescription: 'Find the best Christmas tree farms in the UK. Choose and cut your own tree, enjoy festive activities, and create magical family memories.',
    heading: 'Top Christmas Tree Farms for a Magical Experience',
    intro: 'Make choosing your Christmas tree a magical family tradition at these outstanding Christmas tree farms. From choose-and-cut experiences to festive activities and Santa visits, these farms offer unforgettable holiday experiences.',
    content: `## Why Choose a Christmas Tree Farm?

Visiting a Christmas tree farm has become a beloved tradition for many families. It's not just about the tree – it's about creating memories, enjoying festive activities, and supporting local growers.

## What to Expect

Christmas tree farms typically offer:
- **Choose & Cut**: Select and cut your own tree
- **Pre-Cut Trees**: If you prefer not to cut
- **Variety**: Different species (Norway Spruce, Nordmann Fir, Fraser Fir)
- **Sizes**: From table-top to 12+ feet
- **Festive Activities**: Santa's grotto, reindeer, festive food
- **Shop**: Wreaths, decorations, and gifts

## Best Tree Varieties

- **Nordmann Fir**: Non-drop needles, excellent needle retention
- **Norway Spruce**: Traditional, affordable, great scent
- **Fraser Fir**: Strong branches, pleasant aroma
- **Blue Spruce**: Distinctive blue-green color

## Planning Your Visit

- **Season**: Most open late November through Christmas
- **Weekdays**: Less crowded than weekends
- **Weather**: Dress warmly and wear boots
- **Transport**: Bring rope/straps to secure your tree
- **Activities**: Check for special events and Santa visits

## Top Tips

1. Measure your ceiling height before choosing
2. Bring gloves for carrying the tree
3. Arrive early for best selection
4. Many farms offer delivery services
5. Some require advance booking for activities`,
    category: 'christmas-trees',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'When should I buy a Christmas tree?',
        answer: 'Most people buy their tree in early-to-mid December. Nordmann Firs last longest (4-5 weeks), while Norway Spruce are best bought closer to Christmas (2-3 weeks before).',
      },
      {
        question: 'How do I care for my real Christmas tree?',
        answer: 'Keep your tree in water at all times, away from heat sources. Cut an inch off the trunk before placing in water, and check water levels daily.',
      },
      {
        question: 'Are real trees better for the environment?',
        answer: 'Real trees from sustainable farms are carbon neutral or negative, biodegradable, and support local agriculture. Most farms plant 2-3 trees for every one cut.',
      },
    ],
  },
  {
    slug: 'best-farmers-markets-uk',
    title: 'Best Farmers Markets in the UK',
    metaTitle: 'Top 15 Best Farmers Markets in the UK (2026) | Local Produce',
    metaDescription: 'Discover the UK\'s best farmers markets. Find fresh local produce, artisan foods, and support local farmers at these top-rated markets.',
    heading: 'Top Farmers Markets for Fresh Local Produce',
    intro: 'Experience the vibrant atmosphere of the UK\'s best farmers markets, where you can meet producers, sample artisan foods, and buy the freshest local produce directly from those who grow and make it.',
    content: `## Why Shop at Farmers Markets?

Farmers markets connect consumers directly with local producers, offering fresher food, fair prices for farmers, and a more personal shopping experience. You can ask questions, get recipe ideas, and discover unique local products.

## What You'll Find

Typical farmers market offerings include:
- **Fresh Produce**: Seasonal vegetables and fruit
- **Meat & Poultry**: Free-range, locally reared
- **Baked Goods**: Artisan bread, cakes, pastries
- **Dairy**: Cheese, milk, yogurt, butter
- **Prepared Foods**: Hot food, ready meals, preserves
- **Plants & Flowers**: Seasonal plants and cut flowers

## Market Culture

Farmers markets are social events:
- Meet your local producers
- Sample before you buy
- Learn cooking tips and recipes
- Enjoy street food and coffee
- Family-friendly atmosphere
- Often include live music or entertainment`,
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'How do farmers markets differ from regular markets?',
        answer: 'Farmers markets feature producers selling their own products. Everything is locally sourced and often organic. You\'re buying directly from the farmer or maker, not a reseller.',
      },
      {
        question: 'Are farmers markets expensive?',
        answer: 'Prices are comparable to supermarkets for standard items, and often better value for specialty or organic products. You\'re paying for quality and supporting local economy.',
      },
      {
        question: 'When do farmers markets operate?',
        answer: 'Most operate weekly or fortnightly on weekends, typically mornings (9am-1pm). Some larger cities have weekday markets too. Always check specific market schedules.',
      },
    ],
  },
  {
    slug: 'top-veg-box-schemes-uk',
    title: 'Top Vegetable Box Delivery Schemes',
    metaTitle: 'Best Veg Box Schemes in the UK (2026) | Organic Vegetable Delivery',
    metaDescription: 'Find the best vegetable box delivery schemes in the UK. Get fresh, local, often organic vegetables delivered to your door weekly.',
    heading: 'Best Vegetable Box Schemes for Home Delivery',
    intro: 'Discover the convenience of fresh, seasonal vegetables delivered directly to your door. These top-rated veg box schemes source from local farms, offer organic options, and make eating seasonally easy and affordable.',
    content: `## What is a Veg Box Scheme?

Vegetable box schemes deliver fresh, seasonal produce directly from farms to your door, usually weekly or fortnightly. They're an easy way to eat more vegetables, support local farmers, and reduce food miles.

## Benefits of Veg Boxes

- **Freshness**: Picked within days of delivery
- **Seasonal**: Learn to cook with what's in season
- **Convenience**: No shopping required
- **Variety**: Try vegetables you wouldn't normally buy
- **Support**: Direct income to local farmers
- **Sustainability**: Minimal packaging, reduced food miles

## What to Expect

Most veg box schemes offer:
- **Box Sizes**: From small (1-2 people) to large (families)
- **Frequency**: Weekly, fortnightly, or monthly
- **Customization**: Swap items or exclude dislikes
- **Add-ons**: Fruit, eggs, dairy, meat, bread
- **Organic Options**: Certified organic produce
- **Flexibility**: Pause, skip, or cancel anytime

## Choosing the Right Scheme

Consider:
- **Delivery area**: Is your postcode covered?
- **Organic vs conventional**: Certified or local?
- **Box size**: How much do you need?
- **Flexibility**: Can you customize contents?
- **Price**: Compare cost per item
- **Ethics**: Farm practices and values`,
    category: 'veg-box-schemes',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'Can I choose what\'s in my veg box?',
        answer: 'Most schemes offer some flexibility. You can typically exclude items you don\'t like, and many allow swaps. However, the core concept is seasonal variety, so some surprise is part of the experience.',
      },
      {
        question: 'Is a veg box good value?',
        answer: 'Veg boxes typically offer good value, especially for organic produce. You\'re paying farm-gate prices plus delivery, often less than supermarket organic vegetables.',
      },
      {
        question: 'What if I\'m away or don\'t need a box?',
        answer: 'Most schemes allow you to pause, skip weeks, or adjust delivery frequency. Some require notice (usually a few days), so check the terms.',
      },
    ],
  },
  {
    slug: 'best-farm-school-visits-uk',
    title: 'Best Farms for School Visits',
    metaTitle: 'Best Educational Farm Visits for Schools in the UK (2026)',
    metaDescription: 'Discover the best farms for school visits in the UK. Educational, engaging, and curriculum-linked farm experiences for all ages.',
    heading: 'Top Farms for Educational School Visits',
    intro: 'Connect children with farming and food production through these outstanding educational farm visits. These farms offer curriculum-linked activities, hands-on learning, and unforgettable experiences that bring farming to life.',
    content: `## Why Farm Visits Matter

Farm visits provide children with essential understanding of where food comes from, how farms work, and the importance of agriculture. They offer hands-on learning that can't be replicated in the classroom.

## Educational Benefits

Farm visits support learning in:
- **Science**: Animal life cycles, plant growth, seasons
- **Geography**: Food miles, local vs imported, climate
- **PSHE**: Healthy eating, careers in farming
- **English**: Descriptive writing, farm vocabulary
- **Math**: Counting, measuring, problem-solving

## What Schools Can Expect

Educational farm visits typically include:
- **Guided Tours**: Age-appropriate farm tours
- **Animal Encounters**: Meeting and feeding farm animals
- **Hands-On Activities**: Planting, collecting eggs, grooming
- **Workshops**: Food production, seasonal cycles
- **Facilities**: Indoor learning spaces, lunch areas, toilets
- **Safety**: Risk assessments, qualified staff

## Types of Visits

- **Day Visits**: 2-4 hours, single activity focus
- **Full Day**: Multiple activities, lunch included
- **Curriculum Days**: Linked to specific subjects
- **Seasonal Visits**: Lambing, harvest, pumpkin picking
- **Residential**: Multi-day farm stays (some farms)`,
    category: 'educational-visits',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'What age groups can visit farms?',
        answer: 'Most educational farms cater to all ages from nursery (3+) to secondary school. Activities are tailored to age groups, with different learning objectives for each stage.',
      },
      {
        question: 'How much do farm visits cost?',
        answer: 'Costs vary but typically range from £5-15 per child, often with free adult supervision at a certain ratio. Many farms offer discounts for larger groups or multiple bookings.',
      },
      {
        question: 'Are farm visits safe?',
        answer: 'Yes. Educational farms follow strict health and safety protocols, provide risk assessments, have qualified staff, and maintain high hygiene standards. Most are regularly inspected.',
      },
    ],
  },
  {
    slug: 'top-ice-cream-farms-uk',
    title: 'Best Ice Cream Farms in the UK',
    metaTitle: 'Top 15 Best Ice Cream Farms in the UK (2026) | Farm-Made Ice Cream',
    metaDescription: 'Discover the UK\'s best ice cream farms making their own ice cream from fresh milk. Find award-winning flavors and farm experiences.',
    heading: 'Top Ice Cream Farms for Homemade Treats',
    intro: 'Indulge in the finest farm-made ice cream at these exceptional dairy farms across the UK. Using fresh milk from their own herds, these farms create award-winning ice cream with unique flavors you won\'t find anywhere else.',
    content: `## Farm-Made Ice Cream

When ice cream is made on a dairy farm using milk from the farm's own cows, it's fresher, creamier, and more flavorful than mass-produced alternatives. Many of these farms have won national awards for their exceptional ice cream.

## What Makes Farm Ice Cream Special?

- **Ultra-fresh milk**: Often just hours from cow to cone
- **Higher quality**: More cream, less air, better ingredients
- **Unique flavors**: Creative combinations using local ingredients
- **Seasonal specials**: Changing flavors throughout the year
- **Transparency**: See the cows that produce the milk
- **Family recipes**: Traditional methods passed down

## Typical Offerings

Farm ice cream shops usually have:
- **Classic Flavors**: Vanilla, chocolate, strawberry
- **Specialty Flavors**: Unique combinations, 30-50+ varieties
- **Seasonal Specials**: Pumpkin spice, mulled wine, Easter egg
- **Dairy-Free**: Many now offer vegan options
- **Sorbets**: Fruit-based options
- **Sundaes & Milkshakes**: Full dessert menu

## The Full Experience

Beyond ice cream, these farms often offer:
- Meet the cows that produce the milk
- Farm tours and activities
- Play areas for children
- Farm shops with other products
- Beautiful countryside settings
- Picnic areas`,
    category: 'ice-cream-farms',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'Is farm ice cream more expensive?',
        answer: 'Farm ice cream typically costs slightly more than supermarket brands but less than premium brands. The quality, freshness, and experience make it excellent value.',
      },
      {
        question: 'Can I buy farm ice cream to take home?',
        answer: 'Yes! Most farms sell tubs to take home, usually 500ml or 1 liter sizes. Some also distribute to local shops and offer online ordering.',
      },
      {
        question: 'Do farms make dairy-free ice cream?',
        answer: 'Increasingly, yes. Many ice cream farms now offer dairy-free options made with oat, coconut, or almond milk to cater to all dietary needs.',
      },
    ],
  },
  {
    slug: 'best-cheese-makers-uk',
    title: 'Best Artisan Cheese Makers in the UK',
    metaTitle: 'Top 15 Best Cheese Makers in the UK (2026) | Artisan Cheese',
    metaDescription: 'Discover the UK\'s finest artisan cheese makers. From traditional farmhouse cheddar to innovative new varieties, find award-winning British cheese.',
    heading: 'Top Artisan Cheese Makers & Farmhouse Dairies',
    intro: 'Explore the UK\'s thriving artisan cheese scene with these exceptional cheese makers. From traditional farmhouse cheddar to innovative new varieties, British cheese makers are producing world-class cheeses that rival any in Europe.',
    content: `## British Artisan Cheese

The UK has a rich cheese-making heritage, and today's artisan cheese makers combine traditional methods with innovation to create award-winning cheeses. Many operate on small farms, using milk from their own herds.

## Types of British Cheese

**Hard Cheeses:**
- Traditional Cheddar (various ages)
- Territorial cheeses (Lancashire, Cheshire, etc.)
- Alpine-style cheeses

**Soft Cheeses:**
- Brie & Camembert-style
- Goat cheese (various styles)
- Cream cheese

**Blue Cheeses:**
- Stilton
- Modern blues
- Soft blues

**Flavored:**
- With herbs, fruits, or spices
- Smoked varieties
- Washed-rind cheeses

## What Makes Farm Cheese Special?

- **Terroir**: Taste of the local land and grass
- **Breed**: Specific cow, goat, or sheep breeds
- **Craftsmanship**: Hand-made in small batches
- **Aging**: Properly matured for optimal flavor
- **Awards**: Many have won national and international prizes

## Visiting Cheese Farms

Many cheese makers offer:
- **Farm Tours**: See cheese-making in action
- **Tastings**: Sample different ages and varieties
- **Cheese Shops**: Buy directly from the maker
- **Classes**: Learn to make cheese
- **Cafés**: Enjoy cheese-based meals`,
    category: 'cheese-makers',
    featured: true,
    publishDate: '2026-01-16',
    updateDate: '2026-01-16',
    faqs: [
      {
        question: 'What\'s the difference between farmhouse and factory cheese?',
        answer: 'Farmhouse cheese is made on the farm using milk from that farm\'s animals, often by hand in small batches. Factory cheese uses milk from multiple sources and industrial processes for consistency and scale.',
      },
      {
        question: 'How should I store artisan cheese?',
        answer: 'Wrap in wax paper or cheese paper (not plastic), store in the warmest part of your fridge (vegetable drawer), and bring to room temperature 30 minutes before serving.',
      },
      {
        question: 'Can I buy cheese directly from makers?',
        answer: 'Yes! Many cheese makers sell directly from their farm shops, at farmers markets, or online. Buying direct often gets you fresher cheese at better prices.',
      },
    ],
  },
]
