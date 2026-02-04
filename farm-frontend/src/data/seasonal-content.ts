/**
 * Seasonal Editorial Content
 *
 * Month-by-month editorial copy, star highlights, and produce hooks
 * for the god-tier seasonal page redesign. All copy is UK-specific
 * with regional specialties and expert guidance.
 */

export interface MonthContent {
  month: number
  name: string
  tagline: string
  body: string
  itemsInSeason: number
  atPeak: number
  stars: StarItem[]
  comingNext: ComingNextContent
}

export interface StarItem {
  slug: string
  name: string
  hook: string
  peakLabel: string
  ctaLabel: string
}

export interface ComingNextContent {
  body: string
  previews: { slug: string; name: string; month: string }[]
}

export interface ProduceHook {
  slug: string
  hook: string
}

/**
 * Editorial copy for each month. The hero section uses name, tagline,
 * body, and stats. Stars power the "Worth seeking out" section.
 */
export const MONTH_CONTENT: MonthContent[] = [
  {
    month: 1,
    name: 'January',
    tagline: 'The deep freeze. The stored harvest.',
    body: 'Roots rule: parsnips sweetened by frost, earthy beetroot, robust swede. Kale and cavolo nero are at their best after a hard frost. Seville oranges arrive for a fleeting few weeks -- your only chance for proper marmalade. Blood oranges add colour to the grey.',
    itemsInSeason: 12,
    atPeak: 2,
    stars: [
      {
        slug: 'kale',
        name: 'Kale',
        hook: 'Best after a hard frost -- the cold converts starch to sugar.',
        peakLabel: 'Peak: December - February',
        ctaLabel: 'Find kale nearby',
      },
      {
        slug: 'parsnips',
        name: 'Parsnips',
        hook: 'Frost-sweetened and earthy. Roast them until the edges caramelise.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find parsnips nearby',
      },
      {
        slug: 'leeks',
        name: 'Leeks',
        hook: 'The backbone of winter soups. Look for tight, white stems.',
        peakLabel: 'Peak: December - February',
        ctaLabel: 'Find leeks nearby',
      },
    ],
    comingNext: {
      body: 'February brings forced rhubarb from the Yorkshire Triangle and the first purple sprouting broccoli. Seville oranges continue.',
      previews: [
        { slug: 'rhubarb', name: 'Forced Rhubarb', month: 'February' },
        { slug: 'purple-sprouting-broccoli', name: 'Purple Sprouting', month: 'February' },
        { slug: 'beetroot', name: 'Beetroot', month: 'February' },
      ],
    },
  },
  {
    month: 2,
    name: 'February',
    tagline: 'The last of winter. The first hints of spring.',
    body: 'This is the month for forced rhubarb from the Yorkshire Triangle -- pink, tender, grown by candlelight. Purple sprouting broccoli hits its sweetest window. Seville oranges are in their final weeks. The stored roots -- parsnips, celeriac, swede -- are still going strong.',
    itemsInSeason: 10,
    atPeak: 3,
    stars: [
      {
        slug: 'rhubarb',
        name: 'Forced Rhubarb',
        hook: 'Grown by candlelight in the Yorkshire Triangle. Pink, tender, and only here until March.',
        peakLabel: 'Peak: January - March',
        ctaLabel: 'Find forced rhubarb nearby',
      },
      {
        slug: 'purple-sprouting-broccoli',
        name: 'Purple Sprouting Broccoli',
        hook: 'Sweetest now, before it goes to seed. Look for tight florets on firm stems.',
        peakLabel: 'Peak: February - March',
        ctaLabel: 'Find purple sprouting nearby',
      },
      {
        slug: 'leeks',
        name: 'Leeks',
        hook: 'Still at their best. The cold keeps them sweet and firm.',
        peakLabel: 'Available: October - March',
        ctaLabel: 'Find leeks nearby',
      },
    ],
    comingNext: {
      body: 'March brings wild garlic, spring greens, and the last of the forced rhubarb. April means asparagus.',
      previews: [
        { slug: 'spring-greens', name: 'Spring Greens', month: 'March' },
        { slug: 'rhubarb', name: 'Rhubarb', month: 'March' },
        { slug: 'asparagus', name: 'Asparagus', month: 'April' },
      ],
    },
  },
  {
    month: 3,
    name: 'March',
    tagline: 'The hungry gap begins. But there are treasures.',
    body: 'Wild garlic emerges in woodlands. Purple sprouting broccoli continues. Spring greens appear -- the first fresh leaves after months of storage crops. Rhubarb moves from forced to outdoor. It is lean, but the anticipation builds.',
    itemsInSeason: 8,
    atPeak: 2,
    stars: [
      {
        slug: 'purple-sprouting-broccoli',
        name: 'Purple Sprouting Broccoli',
        hook: 'Last chance this year. The florets are opening -- eat them now.',
        peakLabel: 'Peak: February - March',
        ctaLabel: 'Find purple sprouting nearby',
      },
      {
        slug: 'rhubarb',
        name: 'Rhubarb',
        hook: 'Transitioning from forced to outdoor. Still tender, still pink.',
        peakLabel: 'Available: January - June',
        ctaLabel: 'Find rhubarb nearby',
      },
      {
        slug: 'spring-greens',
        name: 'Spring Greens',
        hook: 'The first fresh leaves of the year. Light, bright, and welcome.',
        peakLabel: 'Available: March - May',
        ctaLabel: 'Find spring greens nearby',
      },
    ],
    comingNext: {
      body: 'April brings asparagus -- eight precious weeks of the best in the world. Jersey Royals land too.',
      previews: [
        { slug: 'asparagus', name: 'Asparagus', month: 'April' },
        { slug: 'radishes', name: 'Radishes', month: 'April' },
        { slug: 'spinach', name: 'Spinach', month: 'April' },
      ],
    },
  },
  {
    month: 4,
    name: 'April',
    tagline: 'Spring arrives. So does asparagus.',
    body: 'British asparagus season opens -- eight precious weeks of the best in the world. Jersey Royals land. Spring lamb is at its most tender. Watercress, radishes, and spring onions bring crunch back to the table. The hungry gap is over.',
    itemsInSeason: 14,
    atPeak: 4,
    stars: [
      {
        slug: 'asparagus',
        name: 'Asparagus',
        hook: 'The season opens. Eight weeks of the finest in the world -- do not waste a day.',
        peakLabel: 'Peak: April - June',
        ctaLabel: 'Find asparagus nearby',
      },
      {
        slug: 'radishes',
        name: 'Radishes',
        hook: 'Peppery, crunchy, electric pink. The first real crunch since autumn.',
        peakLabel: 'Peak: April - June',
        ctaLabel: 'Find radishes nearby',
      },
      {
        slug: 'watercress',
        name: 'Watercress',
        hook: 'Peppery and iron-rich. Hampshire watercress is world-class.',
        peakLabel: 'Available: April - October',
        ctaLabel: 'Find watercress nearby',
      },
    ],
    comingNext: {
      body: 'May brings broad beans, the first strawberries, and asparagus at its absolute peak.',
      previews: [
        { slug: 'asparagus', name: 'Asparagus', month: 'May' },
        { slug: 'strawberries', name: 'Strawberries', month: 'May' },
        { slug: 'peas', name: 'Peas', month: 'May' },
      ],
    },
  },
  {
    month: 5,
    name: 'May',
    tagline: 'The season opens up. Abundance begins.',
    body: 'Asparagus peaks mid-month. Broad beans arrive, best eaten tiny and raw. Wild garlic flowers. English strawberries start in polytunnels. This is the month when farmers start smiling again.',
    itemsInSeason: 18,
    atPeak: 5,
    stars: [
      {
        slug: 'asparagus',
        name: 'Asparagus',
        hook: 'At its absolute peak. Eat it the day it is cut if you can.',
        peakLabel: 'Peak: May - June',
        ctaLabel: 'Find asparagus nearby',
      },
      {
        slug: 'strawberries',
        name: 'Strawberries',
        hook: 'The first English berries. Polytunnel-grown, but the flavour is real.',
        peakLabel: 'Starting: May',
        ctaLabel: 'Find strawberries nearby',
      },
      {
        slug: 'peas',
        name: 'Peas',
        hook: 'Eat them standing in the garden. Sugar turns to starch within hours.',
        peakLabel: 'Peak: May - July',
        ctaLabel: 'Find peas nearby',
      },
    ],
    comingNext: {
      body: 'June means outdoor strawberries at their peak, gooseberries for fools, and the first courgettes.',
      previews: [
        { slug: 'strawberries', name: 'Strawberries', month: 'June' },
        { slug: 'courgettes', name: 'Courgettes', month: 'June' },
        { slug: 'broad-beans', name: 'Broad Beans', month: 'June' },
      ],
    },
  },
  {
    month: 6,
    name: 'June',
    tagline: 'The start of the glut. Eat everything.',
    body: 'Strawberries reach their peak -- English outdoor berries are worth the wait. Gooseberries for fools and crumbles. Peas you have to eat standing in the garden. Broad beans, courgettes, the first new potatoes beyond Jerseys. Summer is here.',
    itemsInSeason: 24,
    atPeak: 8,
    stars: [
      {
        slug: 'strawberries',
        name: 'Strawberries',
        hook: 'English outdoor strawberries at their peak. Worth every penny of the wait.',
        peakLabel: 'Peak: June - July',
        ctaLabel: 'Find strawberries nearby',
      },
      {
        slug: 'broad-beans',
        name: 'Broad Beans',
        hook: 'Tiny ones raw with pecorino. Bigger ones double-podded and buttered.',
        peakLabel: 'Peak: June - July',
        ctaLabel: 'Find broad beans nearby',
      },
      {
        slug: 'peas',
        name: 'Peas',
        hook: 'Fresh from the pod, they taste of summer itself.',
        peakLabel: 'Peak: June - July',
        ctaLabel: 'Find peas nearby',
      },
      {
        slug: 'courgettes',
        name: 'Courgettes',
        hook: 'Small is beautiful. Pick them at finger-length for the best flavour.',
        peakLabel: 'Starting: June',
        ctaLabel: 'Find courgettes nearby',
      },
    ],
    comingNext: {
      body: 'July is peak everything. Tomatoes that taste like tomatoes, raspberries warm from the cane, cherries at their sweetest.',
      previews: [
        { slug: 'tomato', name: 'Tomatoes', month: 'July' },
        { slug: 'raspberries', name: 'Raspberries', month: 'July' },
        { slug: 'runner-beans', name: 'Runner Beans', month: 'July' },
      ],
    },
  },
  {
    month: 7,
    name: 'July',
    tagline: 'High summer. Peak everything.',
    body: 'This is it: tomatoes that taste like tomatoes, raspberries warm from the cane, cherries at their sweetest, courgettes faster than you can eat them. Beans, beetroot, fennel, sweetcorn starting. The farm shops are overflowing.',
    itemsInSeason: 32,
    atPeak: 12,
    stars: [
      {
        slug: 'tomato',
        name: 'Tomatoes',
        hook: 'Vine-ripened and sun-warm. This is what a tomato should taste like.',
        peakLabel: 'Peak: July - September',
        ctaLabel: 'Find tomatoes nearby',
      },
      {
        slug: 'raspberries',
        name: 'Raspberries',
        hook: 'Warm from the cane, they collapse on the tongue. Do not refrigerate.',
        peakLabel: 'Peak: July - August',
        ctaLabel: 'Find raspberries nearby',
      },
      {
        slug: 'runner-beans',
        name: 'Runner Beans',
        hook: 'Slice them thin on the diagonal. The scarlet flowers are edible too.',
        peakLabel: 'Peak: July - September',
        ctaLabel: 'Find runner beans nearby',
      },
      {
        slug: 'sweetcorn',
        name: 'Sweetcorn',
        hook: 'Cook within hours of picking. The sugar turns to starch fast.',
        peakLabel: 'Starting: July',
        ctaLabel: 'Find sweetcorn nearby',
      },
    ],
    comingNext: {
      body: 'August brings plums, damsons, and sweetcorn at its peak. Blackberries free from every hedgerow.',
      previews: [
        { slug: 'sweetcorn', name: 'Sweetcorn', month: 'August' },
        { slug: 'plums', name: 'Plums', month: 'August' },
        { slug: 'blackberries', name: 'Blackberries', month: 'August' },
      ],
    },
  },
  {
    month: 8,
    name: 'August',
    tagline: 'The harvest is in. Fill your freezer.',
    body: 'Plums, greengages, damsons for preserving. Runner beans by the armful. Sweetcorn at its peak -- cook within hours of picking. Outdoor tomatoes finally ripe. Blackberries free from every hedgerow. This is the month to preserve.',
    itemsInSeason: 34,
    atPeak: 10,
    stars: [
      {
        slug: 'sweetcorn',
        name: 'Sweetcorn',
        hook: 'At its absolute peak. From field to pan in under an hour if you can.',
        peakLabel: 'Peak: August',
        ctaLabel: 'Find sweetcorn nearby',
      },
      {
        slug: 'tomato',
        name: 'Tomatoes',
        hook: 'Outdoor tomatoes finally ripe. Heritage varieties at their best.',
        peakLabel: 'Peak: July - September',
        ctaLabel: 'Find tomatoes nearby',
      },
      {
        slug: 'blackberries',
        name: 'Blackberries',
        hook: 'Free from every hedgerow. Pick above waist height.',
        peakLabel: 'Peak: August - September',
        ctaLabel: 'Find blackberries nearby',
      },
      {
        slug: 'plums',
        name: 'Plums',
        hook: 'Victoria plums at their peak. Greengages if you are lucky.',
        peakLabel: 'Peak: August - September',
        ctaLabel: 'Find plums nearby',
      },
    ],
    comingNext: {
      body: 'September is the orchard season. English apples and pears take centre stage, with dozens of varieties you will never find in supermarkets.',
      previews: [
        { slug: 'apples', name: 'Apples', month: 'September' },
        { slug: 'pears', name: 'Pears', month: 'September' },
        { slug: 'pumpkins', name: 'Pumpkins', month: 'September' },
      ],
    },
  },
  {
    month: 9,
    name: 'September',
    tagline: 'Autumn arrives. The orchard season.',
    body: "English apples and pears take centre stage -- dozens of varieties you will never find in supermarkets. Wild mushrooms emerge after rain. Squash and pumpkins cure in the fields. Blackberries and elderberries for foragers. Game season opens.",
    itemsInSeason: 30,
    atPeak: 8,
    stars: [
      {
        slug: 'apples',
        name: 'Apples',
        hook: "Cox's, Egremont Russet, Bramley. Varieties the supermarket forgot.",
        peakLabel: 'Peak: September - November',
        ctaLabel: 'Find apples nearby',
      },
      {
        slug: 'blackberries',
        name: 'Blackberries',
        hook: 'The hedgerow harvest continues. Pair with apples for a classic crumble.',
        peakLabel: 'Peak: August - September',
        ctaLabel: 'Find blackberries nearby',
      },
      {
        slug: 'pumpkins',
        name: 'Pumpkins',
        hook: 'Not just for carving. Crown Prince and Uchiki Kuri for soups.',
        peakLabel: 'Peak: September - November',
        ctaLabel: 'Find pumpkins nearby',
      },
    ],
    comingNext: {
      body: 'October brings quinces for membrillo, the last outdoor tomatoes, and Brussels sprouts after the first frost.',
      previews: [
        { slug: 'apples', name: 'Apples', month: 'October' },
        { slug: 'pumpkins', name: 'Pumpkins', month: 'October' },
        { slug: 'kale', name: 'Kale', month: 'October' },
      ],
    },
  },
  {
    month: 10,
    name: 'October',
    tagline: 'The last of summer. The first of winter.',
    body: "Apples peak: Cox's, Egremont Russet, Bramley for pies. Quinces arrive for membrillo. Squash in every colour. Brussels sprouts after the first frost. Wild mushrooms continue. The transition month.",
    itemsInSeason: 26,
    atPeak: 6,
    stars: [
      {
        slug: 'apples',
        name: 'Apples',
        hook: "This is apple month. Seek out Egremont Russet -- nutty, complex, perfect.",
        peakLabel: 'Peak: September - November',
        ctaLabel: 'Find apples nearby',
      },
      {
        slug: 'pumpkins',
        name: 'Pumpkins',
        hook: 'Beyond Halloween. Try Delica or Red Kuri for rich, sweet flesh.',
        peakLabel: 'Peak: October - November',
        ctaLabel: 'Find pumpkins nearby',
      },
      {
        slug: 'kale',
        name: 'Kale',
        hook: 'The cold has arrived and so has the flavour. Cavolo nero too.',
        peakLabel: 'Starting: October',
        ctaLabel: 'Find kale nearby',
      },
    ],
    comingNext: {
      body: 'November means roots and brassicas in full swing. Parsnips sweeten, Brussels sprouts improve, and chestnuts roast.',
      previews: [
        { slug: 'parsnips', name: 'Parsnips', month: 'November' },
        { slug: 'brussels-sprouts', name: 'Brussels Sprouts', month: 'November' },
        { slug: 'kale', name: 'Kale', month: 'November' },
      ],
    },
  },
  {
    month: 11,
    name: 'November',
    tagline: 'Winter sets in. The brassicas shine.',
    body: 'Brussels sprouts, kale, and cavolo nero improve with cold. Parsnips sweeten. Stored apples and pears hold. Quinces linger. Chestnuts roast. This is the month of roots, greens, and warming dinners.',
    itemsInSeason: 18,
    atPeak: 4,
    stars: [
      {
        slug: 'parsnips',
        name: 'Parsnips',
        hook: 'Frost-kissed and sweet. Roast with honey or make into soup.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find parsnips nearby',
      },
      {
        slug: 'brussels-sprouts',
        name: 'Brussels Sprouts',
        hook: 'After the first frost they sweeten. Shred raw or roast until charred.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find Brussels sprouts nearby',
      },
      {
        slug: 'kale',
        name: 'Kale',
        hook: 'Hardy, nutritious, and improved by cold weather. Try it raw in salads.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find kale nearby',
      },
    ],
    comingNext: {
      body: 'December means the festive table. Brussels sprouts for Christmas, red cabbage for braising, and forced rhubarb begins its candlelit season.',
      previews: [
        { slug: 'brussels-sprouts', name: 'Brussels Sprouts', month: 'December' },
        { slug: 'parsnips', name: 'Parsnips', month: 'December' },
        { slug: 'rhubarb', name: 'Forced Rhubarb', month: 'December' },
      ],
    },
  },
  {
    month: 12,
    name: 'December',
    tagline: 'The festive table. Plan ahead.',
    body: 'Brussels sprouts for Christmas lunch. Red cabbage for braising. Parsnips and carrots for the roast. Forced rhubarb begins its candlelit season in Yorkshire. Clementines, satsumas, and the first Seville oranges arrive. Order your goose early.',
    itemsInSeason: 14,
    atPeak: 3,
    stars: [
      {
        slug: 'brussels-sprouts',
        name: 'Brussels Sprouts',
        hook: 'The centrepiece of Christmas lunch. Shred with chestnuts and bacon.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find Brussels sprouts nearby',
      },
      {
        slug: 'parsnips',
        name: 'Parsnips',
        hook: 'Essential for the Christmas roast. Honey-glazed or in a gratin.',
        peakLabel: 'Peak: November - February',
        ctaLabel: 'Find parsnips nearby',
      },
      {
        slug: 'kale',
        name: 'Kale',
        hook: 'Dark, leafy, frost-hardy. Brilliant alongside rich festive meats.',
        peakLabel: 'Peak: December - February',
        ctaLabel: 'Find kale nearby',
      },
    ],
    comingNext: {
      body: 'January means Seville oranges for marmalade, the deepest root vegetables, and the start of the forced rhubarb season.',
      previews: [
        { slug: 'kale', name: 'Kale', month: 'January' },
        { slug: 'leeks', name: 'Leeks', month: 'January' },
        { slug: 'parsnips', name: 'Parsnips', month: 'January' },
      ],
    },
  },
]

/**
 * Editorial hooks for produce cards. Each hook replaces the generic
 * selection tips with a reason to seek out this produce.
 */
export const PRODUCE_HOOKS: Record<string, string> = {
  'sweetcorn': 'Cook within hours of picking -- the sugar turns to starch fast.',
  'tomato': 'Vine-ripened British tomatoes taste nothing like imports.',
  'strawberries': 'English outdoor berries are worth every penny of the wait.',
  'runner-beans': 'Slice thin on the diagonal. The scarlet flowers are edible too.',
  'asparagus': 'Eight weeks only. Eat it the day it is cut.',
  'kale': 'Best after a hard frost -- the cold converts starch to sugar.',
  'leeks': 'The backbone of winter soups. Look for tight, white stems.',
  'pumpkins': 'Not just for carving. Crown Prince makes extraordinary soup.',
  'apples': "Seek out Egremont Russet or Cox's -- varieties the supermarkets forgot.",
  'blackberries': 'Free from every hedgerow. Pick above waist height.',
  'rhubarb': 'Forced rhubarb: grown by candlelight in the Yorkshire Triangle.',
  'purple-sprouting-broccoli': 'Sweetest before it goes to seed. Tight florets, firm stems.',
  'beetroot': 'Roast whole, wrapped in foil. The skins slip off when done.',
  'carrots': 'Heritage varieties in purple, yellow, and white. Taste the rainbow.',
  'broad-beans': 'Tiny ones raw with pecorino. Bigger ones double-podded and buttered.',
  'peas': 'Eat them standing in the garden. Sugar turns to starch within hours.',
  'courgettes': 'Small is beautiful. Pick at finger-length for the best flavour.',
  'plums': 'Victoria plums at their peak. Greengages if you are lucky.',
  'raspberries': 'Warm from the cane, they collapse on the tongue.',
  'parsnips': 'Frost-sweetened and earthy. Roast until the edges caramelise.',
  'brussels-sprouts': 'After the first frost they sweeten. Shred raw or roast until charred.',
  'cauliflower': 'Roast whole with spices until deeply golden.',
  'spring-greens': 'The first fresh leaves of the year. Light, bright, and welcome.',
  'watercress': 'Peppery and iron-rich. Hampshire watercress is world-class.',
  'radishes': 'Peppery, crunchy, electric pink. Butter and sea salt is all you need.',
  'spinach': 'Baby leaves raw in salad, mature leaves wilted with garlic.',
  'celery': 'British celery has more flavour than imported. Braise the hearts.',
  'swede': 'Mash with butter and black pepper. The unsung hero of winter.',
}

/**
 * Get content for a specific month (1-12).
 */
export function getMonthContent(month: number): MonthContent {
  const content = MONTH_CONTENT.find(m => m.month === month)
  if (!content) {
    return MONTH_CONTENT[0]
  }
  return content
}

/**
 * Get the editorial hook for a produce item.
 * Returns undefined if no hook exists.
 */
export function getProduceHook(slug: string): string | undefined {
  return PRODUCE_HOOKS[slug]
}

/**
 * Filter categories for the produce grid.
 */
export const PRODUCE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'herb', label: 'Herbs' },
  { value: 'peak', label: 'At Peak' },
] as const

export type ProduceFilter = typeof PRODUCE_FILTERS[number]['value']
