export type Produce = {
  slug: string
  name: string
  images: { src: string; alt: string; credit?: string }[]
  monthsInSeason: number[]        // 1–12
  peakMonths?: number[]           // optional highlight months
  nutritionPer100g?: {
    kcal: number; protein: number; carbs: number; sugars?: number; fiber?: number; fat?: number
  }
  selectionTips?: string[]
  storageTips?: string[]
  prepIdeas?: string[]
  recipeChips?: { title: string; url: string; description: string }[]
  aliases?: string[]              // for search
}

// IMPORTANT: All recipe links must be family-friendly and non-alcoholic
// No alcoholic beverages, wine-making, or cocktail recipes allowed
// Focus on fresh, healthy, family-appropriate recipes only

export const PRODUCE: Produce[] = [
  {
    slug: 'sweetcorn',
    name: 'Sweetcorn',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/1/main.webp', alt: 'Fresh UK sweetcorn on rustic wooden table' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/2/main.webp', alt: 'Golden sweetcorn kernels close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/3/main.webp', alt: 'Fresh sweetcorn cobs with husks' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/4/main.webp', alt: 'British sweetcorn harvest display' },
    ],
    monthsInSeason: [7, 8, 9],            // Jul–Sep
    peakMonths: [8],
    nutritionPer100g: { kcal: 86, protein: 3.4, carbs: 19, sugars: 6.3, fiber: 2.7, fat: 1.2 },
    selectionTips: [
      'Look for tight, green husks and sticky tassels.',
      'Kernels should be plump and evenly spaced.',
      'Avoid cobs with dry or brown tassels.',
      'The silk should be golden, not black or moldy.',
    ],
    storageTips: [
      'Keep husks on; refrigerate ASAP (sweetness declines fast).',
      'Best cooked within 1–2 days of harvest.',
      'Can freeze kernels for up to 8 months.',
      'Store in the crisper drawer at 32-40°F.',
    ],
    prepIdeas: [
      'Grill with chilli-lime butter.',
      'Cut kernels for salads, chowders, and fritters.',
      'Make creamy corn soup with fresh herbs.',
      'Add to summer pasta dishes.',
    ],
    recipeChips: [
      {
        title: 'Best Sweetcorn Recipes',
        url: 'https://www.olivemagazine.com/recipes/collection/best-sweetcorn-recipes/',
        description: '35 amazing sweetcorn recipes from Olive Magazine'
      },
      {
        title: 'Stir-Fried Corn with Chilli & Ginger',
        url: 'https://www.jamieoliver.com/recipes/vegetables/stir-fried-corn-with-chilli-ginger-garlic-and-parsley/',
        description: 'Quick and flavourful Asian-style corn'
      },
      {
        title: 'Creamy Corn Chowder',
        url: 'https://www.saltandlavender.com/corn-chowder/',
        description: 'Rich and comforting corn soup'
      }
    ],
    aliases: ['corn', 'maize', 'sweet corn'],
  },
  {
    slug: 'tomato',
    name: 'Tomatoes',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/1/main.webp', alt: 'Fresh vine-ripened British tomatoes' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/2/main.webp', alt: 'Heritage tomato varieties on wooden board' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/3/main.webp', alt: 'Bright red tomatoes with natural morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/4/main.webp', alt: 'Farm-fresh UK tomatoes close-up' },
    ],
    monthsInSeason: [6, 7, 8, 9, 10],    // Jun–Oct
    peakMonths: [7, 8, 9],
    nutritionPer100g: { kcal: 18, protein: 0.9, carbs: 3.9, sugars: 2.6, fiber: 1.2, fat: 0.2 },
    selectionTips: [
      'Choose tomatoes that feel heavy for their size.',
      'Look for smooth, unblemished skin.',
      'Avoid tomatoes with soft spots or mold.',
      'Ripe tomatoes should have a slight give when gently pressed.',
    ],
    storageTips: [
      'Store at room temperature until fully ripe.',
      'Once ripe, refrigerate to slow further ripening.',
      'Never store in direct sunlight.',
      'Keep stem-side down to prevent bruising.',
    ],
    prepIdeas: [
      'Make fresh tomato bruschetta with basil.',
      'Create a simple caprese salad.',
      'Slow-roast with garlic and herbs.',
      'Blend into gazpacho for hot summer days.',
    ],
    recipeChips: [
      {
        title: 'Abundance Tomato Soup',
        url: 'https://www.jamieoliver.com/recipes/vegetables/-abundance-tomato-soup-with-basil-oil/',
        description: 'Fresh tomato soup with basil oil'
      },
      {
        title: 'Pappa al Pomodoro',
        url: 'https://www.jamieoliver.com/recipes/bread/bread-and-tomato-soup-pappa-al-pomodoro/',
        description: 'Italian bread and tomato soup'
      },
      {
        title: 'Shakshuka',
        url: 'https://downshiftology.com/recipes/shakshuka/',
        description: 'Middle Eastern eggs in tomato sauce'
      }
    ],
    aliases: ['tomato', 'cherry tomatoes', 'heirloom tomatoes'],
  },
  {
    slug: 'strawberries',
    name: 'Strawberries',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/1/main.webp', alt: 'Fresh British strawberries with morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/2/main.webp', alt: 'Ripe summer strawberries on natural linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/3/main.webp', alt: 'Hand-picked strawberries in rustic basket' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/4/main.webp', alt: 'Peak season strawberries close-up detail' },
    ],
    monthsInSeason: [5, 6, 7, 8],        // May–Aug
    peakMonths: [6, 7],
    nutritionPer100g: { kcal: 32, protein: 0.7, carbs: 7.7, sugars: 4.9, fiber: 2.0, fat: 0.3 },
    selectionTips: [
      'Look for bright red berries with green caps.',
      'Avoid berries with white or green patches.',
      'Check for mold or soft spots.',
      'Ripe strawberries should smell sweet and fragrant.',
    ],
    storageTips: [
      'Refrigerate immediately after purchase.',
      'Don\'t wash until ready to eat.',
      'Store in a single layer to prevent bruising.',
      'Use within 2-3 days for best quality.',
    ],
    prepIdeas: [
      'Serve fresh with cream or yogurt.',
      'Make strawberry shortcake.',
      'Add to smoothies and breakfast bowls.',
      'Create strawberry jam or preserves.',
    ],
    recipeChips: [
      {
        title: 'Strawberry Shortcake',
        url: 'https://www.simplyrecipes.com/recipes/strawberry_shortcake/',
        description: 'Classic summer dessert'
      },
      {
        title: 'Fresh Strawberry Smoothie',
        url: 'https://www.thereciperebel.com/strawberry-smoothie-recipe/',
        description: 'Healthy breakfast smoothie'
      },
      {
        title: 'Strawberry Jam',
        url: 'https://boulderlocavore.com/simple-organic-strawberry-jam/',
        description: 'Organic strawberry jam recipe'
      }
    ],
    aliases: ['strawberry', 'garden strawberries'],
  },
  {
    slug: 'blackberries',
    name: 'Blackberries',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/1/main.webp', alt: 'Fresh wild blackberries with morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/2/main.webp', alt: 'Ripe blackberries in summer harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/3/main.webp', alt: 'British blackberries macro detail' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/4/main.webp', alt: 'Plump blackberries on natural surface' },
    ],
    monthsInSeason: [7, 8, 9],            // Jul–Sep
    peakMonths: [8],
    nutritionPer100g: { kcal: 43, protein: 1.4, carbs: 9.6, sugars: 4.9, fiber: 5.3, fat: 0.5 },
    selectionTips: [
      'Choose plump, dark berries without mold.',
      'Avoid berries that are mushy or leaking.',
      'Look for berries with a slight bloom.',
      'Ripe blackberries should be deep purple-black.',
    ],
    storageTips: [
      'Refrigerate immediately after picking.',
      'Don\'t wash until ready to use.',
      'Use within 2-3 days for best quality.',
      'Freeze for longer storage.',
    ],
    prepIdeas: [
      'Eat fresh with cream or yogurt.',
      'Make blackberry crumble or pie.',
      'Add to breakfast cereals and smoothies.',
      'Create blackberry jam or jelly.',
    ],
    recipeChips: [
      {
        title: 'Easy Blackberry Compote',
        url: 'https://veggiedesserts.com/easy-blackberry-compote/',
        description: 'Simple 3-ingredient compote in 15 minutes'
      },
      {
        title: 'Blackberry Compote Video',
        url: 'https://www.youtube.com/watch?v=fK9CNdJK9lo',
        description: 'Blackberry Crème Brûlée'
      },
      {
        title: 'Blackberry Recipe Collection',
        url: 'https://youtu.be/-DKcU7xWbgI?si=l8Ymj-kKJbPgTNaW',
        description: 'Blackberry Crumble Bars'
      }
    ],
    aliases: ['blackberry', 'bramble berries'],
  },
  {
    slug: 'runner-beans',
    name: 'Runner Beans',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/1/main.webp', alt: 'Fresh runner beans from British gardens' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/2/main.webp', alt: 'Vibrant green runner bean pods' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/3/main.webp', alt: 'Summer runner bean harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/4/main.webp', alt: 'Crisp runner beans on rustic table' },
    ],
    monthsInSeason: [7, 8, 9, 10],       // Jul–Oct
    peakMonths: [8, 9],
    nutritionPer100g: { kcal: 31, protein: 1.8, carbs: 7.0, sugars: 1.4, fiber: 3.4, fat: 0.2 },
    selectionTips: [
      'Choose crisp, bright green pods.',
      'Avoid beans with brown spots or wrinkles.',
      'Pods should snap easily when bent.',
      'Look for beans that feel firm and fresh.',
    ],
    storageTips: [
      'Refrigerate in a plastic bag.',
      'Use within 3-5 days for best quality.',
      'Can be blanched and frozen.',
      'Keep in the crisper drawer.',
    ],
    prepIdeas: [
      'Steam or boil until tender.',
      'Add to stir-fries and casseroles.',
      'Make runner bean chutney.',
      'Serve with butter and herbs.',
    ],
    recipeChips: [
      {
        title: 'Runner Bean Chutney',
        url: 'https://www.bbcgoodfood.com/recipes/runner-bean-chutney',
        description: 'Preserve allotment beans for winter'
      },
      {
        title: 'Middle Eastern Runner Beans',
        url: 'https://www.riverford.co.uk/recipes/middle-eastern-style-runner-beans',
        description: 'Spiced runner beans with exotic flavours'
      },
      {
        title: 'Runner Bean Stir-Fry',
        url: 'https://www.quorumpark.com/walking/runner-bean-stir-fry',
        description: 'Fresh summer stir-fry from Quorum Park'
      }
    ],
    aliases: ['runner bean', 'pole beans', 'string beans'],
  },
  {
    slug: 'plums',
    name: 'Plums',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/1/main.webp', alt: 'Fresh British plums in autumn harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/2/main.webp', alt: 'Ripe purple plums with natural bloom' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/3/main.webp', alt: 'Victoria plums on rustic wooden board' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/4/main.webp', alt: 'Sweet plums with warm afternoon light' },
    ],
    monthsInSeason: [8, 9, 10],           // Aug–Oct
    peakMonths: [9],
    nutritionPer100g: { kcal: 46, protein: 0.7, carbs: 11.4, sugars: 9.9, fiber: 1.4, fat: 0.3 },
    selectionTips: [
      'Choose plums that give slightly when pressed.',
      'Look for smooth, unblemished skin.',
      'Avoid plums with soft spots or mold.',
      'Ripe plums should have a sweet aroma.',
    ],
    storageTips: [
      'Store at room temperature until ripe.',
      'Once ripe, refrigerate for longer storage.',
      'Don\'t wash until ready to eat.',
      'Use within 3-5 days when ripe.',
    ],
    prepIdeas: [
      'Eat fresh as a healthy snack.',
      'Make plum crumble or pie.',
      'Add to fruit salads and smoothies.',
      'Create plum jam or chutney.',
    ],
    recipeChips: [
      {
        title: 'Plum Crumble',
        url: 'https://www.bbcgoodfood.com/recipes/plum-crumble',
        description: 'Classic British dessert with cinnamon-spiced plums'
      },
      {
        title: 'Plum & Apple Cobbler',
        url: 'https://www.bbcgoodfood.com/recipes/plum-apple-cobbler',
        description: 'Warm fruit cobbler with vanilla and cinnamon'
      },
      {
        title: 'Plum Shashlik Kebabs',
        url: 'https://www.bbc.co.uk/food/recipes/shashlik_kebabs_with_26187',
        description: 'Grilled plum kebabs with exotic spices'
      }
    ],
    aliases: ['plum', 'gages', 'damsons'],
  },
  {
    slug: 'apples',
    name: 'Apples',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/1/main.webp', alt: 'Fresh British apples in autumn orchard' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/2/main.webp', alt: 'Heritage apple varieties close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/3/main.webp', alt: 'Crisp eating apples on marble surface' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/4/main.webp', alt: 'Farm-fresh apples with rustic texture' },
    ],
    monthsInSeason: [9, 10, 11, 12],     // Sep–Dec
    peakMonths: [10, 11],
    nutritionPer100g: { kcal: 52, protein: 0.3, carbs: 14.0, sugars: 10.4, fiber: 2.4, fat: 0.2 },
    selectionTips: [
      'Choose firm apples without bruises.',
      'Look for bright, smooth skin.',
      'Avoid apples with soft spots.',
      'Different varieties have different textures.',
    ],
    storageTips: [
      'Store in the refrigerator for longest life.',
      'Keep away from other fruits that produce ethylene.',
      'Can store for several weeks when refrigerated.',
      'Check regularly for signs of spoilage.',
    ],
    prepIdeas: [
      'Eat fresh as a healthy snack.',
      'Make apple crumble or pie.',
      'Add to salads and smoothies.',
      'Create apple sauce or chutney.',
    ],
    recipeChips: [
      {
        title: 'Helen\'s Apple & Cinnamon Porridge',
        url: 'https://www.jamieoliver.com/recipes/fruit/helen-s-apple-cinnamon-porridge/',
        description: 'Simple, affordable recipes for complementary feeding'
      },
      {
        title: 'Best Apple Crumble',
        url: 'https://www.bbcgoodfood.com/recipes/best-apple-crumble',
        description: 'Classic British dessert with a twist'
      },
      {
        title: 'Spiced Apple Sauce Cake',
        url: 'https://www.deliciousmagazine.co.uk/recipes/spiced-apple-sauce-cake/',
        description: 'Moist and flavorful autumn cake'
      }
    ],
    aliases: ['apple', 'cooking apples', 'eating apples'],
  },
  {
    slug: 'pumpkins',
    name: 'Pumpkins',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/1/main.webp', alt: 'Fresh British pumpkins on neutral linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/2/main.webp', alt: 'Orange pumpkins in autumn harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/3/main.webp', alt: 'Heritage pumpkin varieties display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/4/main.webp', alt: 'Farm pumpkins with golden hour light' },
    ],
    monthsInSeason: [9, 10, 11],         // Sep–Nov
    peakMonths: [10],
    nutritionPer100g: { kcal: 26, protein: 1.0, carbs: 6.5, sugars: 2.8, fiber: 0.5, fat: 0.1 },
    selectionTips: [
      'Choose pumpkins that feel heavy for their size.',
      'Look for smooth, unblemished skin.',
      'Avoid pumpkins with soft spots or mold.',
      'Stem should be firmly attached.',
    ],
    storageTips: [
      'Store in a cool, dry place.',
      'Can keep for several months when stored properly.',
      'Once cut, refrigerate and use within a week.',
      'Freeze cooked pumpkin for longer storage.',
    ],
    prepIdeas: [
      'Make pumpkin soup or risotto.',
      'Roast pumpkin for salads and sides.',
      'Create pumpkin puree for baking.',
      'Add to curries and stews.',
    ],
    recipeChips: [
      {
        title: 'Halloween Pumpkin Cake',
        url: 'https://www.bbcgoodfood.com/recipes/halloween-pumpkin-cake',
        description: 'Ghoulishly good Halloween pumpkin cake with orange frosting'
      },
      {
        title: 'Pumpkin Curry Recipe',
        url: 'https://www.indianhealthyrecipes.com/pumpkin-curry-recipe/',
        description: 'Indian-style pumpkin curry with aromatic spices'
      },
      {
        title: 'Creamy Pumpkin Soup',
        url: 'https://www.olivemagazine.com/recipes/family/creamy-pumpkin-soup-with-blue-cheese-and-sage-toasties/',
        description: 'Creamy pumpkin soup with blue cheese and sage toasties'
      }
    ],
    aliases: ['pumpkin', 'squash', 'winter squash'],
  },
  {
    slug: 'asparagus',
    name: 'Asparagus',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/1/main.webp', alt: 'Fresh British asparagus spears on neutral linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/2/main.webp', alt: 'Spring asparagus with tight green tips' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/3/main.webp', alt: 'UK asparagus season harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/4/main.webp', alt: 'Fresh asparagus spears close-up detail' },
    ],
    monthsInSeason: [4, 5, 6],           // Apr–Jun
    peakMonths: [5],
    nutritionPer100g: { kcal: 20, protein: 2.2, carbs: 3.9, sugars: 1.9, fiber: 2.1, fat: 0.1 },
    selectionTips: [
      'Choose firm spears with tight, compact tips.',
      'Look for bright green or purple colour.',
      'Avoid asparagus with slimy or mushy ends.',
      'Stems should be straight and crisp.',
    ],
    storageTips: [
      'Stand upright in water like flowers.',
      'Cover tips with a damp cloth and refrigerate.',
      'Best used within 2-3 days of purchase.',
      'Can be blanched and frozen for later use.',
    ],
    prepIdeas: [
      'Steam or griddle with butter and lemon.',
      'Wrap in prosciutto and roast.',
      'Add to spring risotto and pasta.',
      'Make creamy asparagus soup.',
    ],
    recipeChips: [
      {
        title: 'Asparagus with Lemon Butter',
        url: 'https://www.greatbritishchefs.com/how-to-cook/how-to-roast-asparagus',
        description: 'Classic British asparagus with lemon and butter'
      },
      {
        title: 'Asparagus Risotto',
        url: 'https://www.bbcgoodfood.com/recipes/asparagus-risotto',
        description: 'Creamy spring risotto with fresh asparagus'
      },
      {
        title: 'Griddled Asparagus',
        url: 'https://www.bbcgoodfood.com/recipes/griddled-asparagus-salad-soft-boiled-egg',
        description: 'Charred asparagus salad with soft-boiled egg'
      }
    ],
    aliases: ['asparagus spears', 'green asparagus', 'British asparagus'],
  },
  {
    slug: 'kale',
    name: 'Kale',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/1/main.webp', alt: 'Fresh British kale leaves with selective focus' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/2/main.webp', alt: 'Dark green curly kale in golden hour light' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/3/main.webp', alt: 'Winter kale harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/4/main.webp', alt: 'Organic kale leaves macro detail' },
    ],
    monthsInSeason: [11, 12, 1, 2, 3, 4], // Nov–Apr
    peakMonths: [1, 2],
    nutritionPer100g: { kcal: 49, protein: 4.3, carbs: 9.0, sugars: 2.3, fiber: 2.0, fat: 0.9 },
    selectionTips: [
      'Choose dark green, crisp leaves.',
      'Avoid yellowing or wilted leaves.',
      'Smaller leaves are more tender.',
      'Look for firm, moist stems.',
    ],
    storageTips: [
      'Store unwashed in the refrigerator.',
      'Keep in a plastic bag in the crisper drawer.',
      'Use within 5-7 days for best quality.',
      'Can be blanched and frozen.',
    ],
    prepIdeas: [
      'Massage with olive oil for salads.',
      'Add to soups and stews.',
      'Make kale chips by baking.',
      'Stir-fry with garlic and chilli.',
    ],
    recipeChips: [
      {
        title: 'Kale Caesar Salad',
        url: 'https://www.olivemagazine.com/recipes/healthy/crispy-chickpea-and-kale-caesar-salad/',
        description: 'Healthy twist on the classic Caesar salad'
      },
      {
        title: 'Kale and White Bean Soup',
        url: 'https://www.bbcgoodfood.com/recipes/kale-white-bean-soup',
        description: 'Hearty winter soup with kale and beans'
      },
      {
        title: 'Crispy Kale Chips',
        url: 'https://www.bbcgoodfood.com/recipes/kale-chips',
        description: 'Healthy baked kale crisps with sea salt'
      }
    ],
    aliases: ['curly kale', 'cavolo nero', 'lacinato kale'],
  },
  {
    slug: 'leeks',
    name: 'Leeks',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/1/main.webp', alt: 'Fresh British leeks at farmers market' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/2/main.webp', alt: 'Winter leeks in wicker basket display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/3/main.webp', alt: 'Fresh leeks with white and green layers' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/4/main.webp', alt: 'UK grown leeks close-up detail' },
    ],
    monthsInSeason: [9, 10, 11, 12, 1, 2, 3, 4], // Sep–Apr
    peakMonths: [11, 12, 1],
    nutritionPer100g: { kcal: 61, protein: 1.5, carbs: 14.0, sugars: 3.9, fiber: 1.8, fat: 0.3 },
    selectionTips: [
      'Choose firm, straight leeks with crisp leaves.',
      'Look for bright white and dark green colour.',
      'Avoid leeks with yellowing or slimy leaves.',
      'Smaller leeks are more tender.',
    ],
    storageTips: [
      'Store in the refrigerator crisper drawer.',
      'Keep in a plastic bag for up to 2 weeks.',
      'Trim roots but keep them attached until use.',
      'Can be blanched and frozen.',
    ],
    prepIdeas: [
      'Braise with butter and herbs.',
      'Add to soups and casseroles.',
      'Make leek and potato soup.',
      'Roast with olive oil and thyme.',
    ],
    recipeChips: [
      {
        title: 'Leek and Potato Soup',
        url: 'https://www.bbcgoodfood.com/recipes/leek-potato-soup',
        description: 'Classic British comfort soup'
      },
      {
        title: 'Braised Leeks',
        url: 'https://www.olivemagazine.com/recipes/vegetarian/buttered-leeks-with-pangritata/',
        description: 'Tender leeks cooked in butter and stock'
      },
      {
        title: 'Leek and Bacon Pasta',
        url: 'https://www.bbcgoodfood.com/recipes/leek-bacon-pasta',
        description: 'Creamy pasta with leeks and crispy bacon'
      }
    ],
    aliases: ['leek', 'baby leeks', 'spring leeks'],
  },
  {
    slug: 'purple-sprouting-broccoli',
    name: 'Purple Sprouting Broccoli',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/1/main.webp', alt: 'Fresh purple sprouting broccoli on rustic wooden table' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/2/main.webp', alt: 'Vibrant PSB with purple-green florets' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/3/main.webp', alt: 'British purple sprouting broccoli harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/4/main.webp', alt: 'Fresh PSB stems and florets close-up' },
    ],
    monthsInSeason: [1, 2, 3, 4],        // Jan–Apr
    peakMonths: [2, 3],
    nutritionPer100g: { kcal: 35, protein: 3.1, carbs: 7.2, sugars: 1.4, fiber: 3.0, fat: 0.4 },
    selectionTips: [
      'Choose firm stems with tight florets.',
      'Look for vibrant purple-green colour.',
      'Avoid yellowing or flowering heads.',
      'Stems should be crisp and snap easily.',
    ],
    storageTips: [
      'Store in the refrigerator crisper drawer.',
      'Keep in a plastic bag for up to 5 days.',
      'Use as soon as possible for best flavour.',
      'Can be blanched and frozen.',
    ],
    prepIdeas: [
      'Steam and serve with butter.',
      'Char-grill with olive oil and lemon.',
      'Add to stir-fries and pasta.',
      'Roast with garlic and chilli flakes.',
    ],
    recipeChips: [
      {
        title: 'Charred Purple Sprouting Broccoli',
        url: 'https://www.bbcgoodfood.com/recipes/charred-purple-sprouting-broccoli-lemon-anchovy-dressing',
        description: 'Restaurant-style PSB with anchovy dressing'
      },
      {
        title: 'PSB with Chilli and Garlic',
        url: 'https://www.olivemagazine.com/recipes/vegetarian/broccoli-stir-fry/',
        description: 'Quick and flavourful PSB side dish'
      },
      {
        title: 'PSB and Pasta',
        url: 'https://www.olivemagazine.com/recipes/quick-and-easy/orecchiette-with-anchovies-and-purple-sprouting-broccoli/',
        description: 'Spring pasta with purple sprouting broccoli'
      }
    ],
    aliases: ['PSB', 'purple broccoli', 'sprouting broccoli'],
  },
  {
    slug: 'carrots',
    name: 'Carrots',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/1/main.webp', alt: 'Fresh orange British carrots with green tops' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/2/main.webp', alt: 'Heritage carrots in various colours' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/3/main.webp', alt: 'Farm-fresh carrots on rustic table' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/carrots/4/main.webp', alt: 'Organic British carrots close-up' },
    ],
    monthsInSeason: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round (stored)
    peakMonths: [7, 8, 9, 10],
    nutritionPer100g: { kcal: 41, protein: 0.9, carbs: 10, sugars: 4.7, fiber: 2.8, fat: 0.2 },
    selectionTips: [
      'Choose firm carrots with bright orange colour.',
      'Avoid carrots with cracks or soft spots.',
      'Smaller carrots tend to be sweeter.',
      'If tops are attached, they should be fresh and green.',
    ],
    storageTips: [
      'Remove green tops before storing to prevent moisture loss.',
      'Store in the refrigerator for up to 3 weeks.',
      'Keep in a plastic bag to retain moisture.',
      'Can be frozen after blanching.',
    ],
    prepIdeas: [
      'Roast with honey and thyme.',
      'Grate raw into salads and slaws.',
      'Make carrot and coriander soup.',
      'Steam and glaze with butter.',
    ],
    recipeChips: [
      {
        title: 'Honey Roasted Carrots',
        url: 'https://www.bbcgoodfood.com/recipes/honey-roasted-carrots',
        description: 'Sweet and caramelised roasted carrots'
      },
      {
        title: 'Carrot and Coriander Soup',
        url: 'https://www.greatbritishchefs.com/recipes/carrot-coriander-soup-recipe',
        description: 'Classic British soup with warming spices'
      }
    ],
    aliases: ['carrot', 'heritage carrots', 'baby carrots'],
  },
  {
    slug: 'parsnips',
    name: 'Parsnips',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/parsnips/1/main.webp', alt: 'Fresh British parsnips with earthy texture' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/parsnips/2/main.webp', alt: 'Winter parsnips on rustic surface' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/parsnips/3/main.webp', alt: 'Organic parsnips close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/parsnips/4/main.webp', alt: 'Farm-fresh parsnips bundle' },
    ],
    monthsInSeason: [1, 2, 3, 9, 10, 11, 12], // Sept-Mar
    peakMonths: [11, 12, 1],
    nutritionPer100g: { kcal: 75, protein: 1.2, carbs: 18, sugars: 4.8, fiber: 4.9, fat: 0.3 },
    selectionTips: [
      'Choose firm, smooth parsnips without blemishes.',
      'Smaller ones are sweeter and less woody.',
      'Avoid parsnips with soft spots or cracks.',
      'Frost-kissed parsnips are sweeter.',
    ],
    storageTips: [
      'Store unwashed in a cool, dark place for weeks.',
      'Refrigerate in a plastic bag for up to 3 weeks.',
      'Can be left in the ground over winter.',
      'Blanch and freeze for longer storage.',
    ],
    prepIdeas: [
      'Roast with honey and rosemary.',
      'Make parsnip crisps.',
      'Add to stews and casseroles.',
      'Mash with butter and nutmeg.',
    ],
    recipeChips: [
      {
        title: 'Honey Roasted Parsnips',
        url: 'https://www.bbcgoodfood.com/recipes/honey-roasted-parsnips',
        description: 'Perfect Christmas side dish'
      },
      {
        title: 'Parsnip Soup',
        url: 'https://www.olivemagazine.com/recipes/quick-and-easy/spiced-parsnip-soup/',
        description: 'Creamy winter warmer'
      }
    ],
    aliases: ['parsnip'],
  },
  {
    slug: 'brussels-sprouts',
    name: 'Brussels Sprouts',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/brussels-sprouts/1/main.webp', alt: 'Fresh Brussels sprouts on stalk' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/brussels-sprouts/2/main.webp', alt: 'Winter Brussels sprouts close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/brussels-sprouts/3/main.webp', alt: 'Organic Brussels sprouts' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/brussels-sprouts/4/main.webp', alt: 'British Brussels sprouts harvest' },
    ],
    monthsInSeason: [9, 10, 11, 12, 1, 2], // Sept-Feb
    peakMonths: [11, 12],
    nutritionPer100g: { kcal: 43, protein: 3.4, carbs: 9, sugars: 2.2, fiber: 3.8, fat: 0.3 },
    selectionTips: [
      'Choose tight, compact heads.',
      'Look for bright green colour.',
      'Smaller sprouts are sweeter.',
      'Avoid yellowing or loose leaves.',
    ],
    storageTips: [
      'Store unwashed in the fridge for up to a week.',
      'Keep in a plastic bag in the crisper.',
      'On the stalk, they last longer.',
      'Blanch and freeze for up to 12 months.',
    ],
    prepIdeas: [
      'Roast with bacon and chestnuts.',
      'Shred raw for salads.',
      'Pan-fry with butter and garlic.',
      'Steam and toss with lemon zest.',
    ],
    recipeChips: [
      {
        title: 'Roasted Brussels with Bacon',
        url: 'https://www.bbcgoodfood.com/recipes/roasted-sprouts-bacon',
        description: 'The ultimate Christmas sprouts'
      },
      {
        title: 'Shredded Sprout Salad',
        url: 'https://www.olivemagazine.com/recipes/quick-and-easy/italian-style-shredded-brussels-salad/',
        description: 'Fresh and crunchy winter salad'
      }
    ],
    aliases: ['sprouts', 'brussels', 'baby cabbages'],
  },
  {
    slug: 'beetroot',
    name: 'Beetroot',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/beetroot/1/main.webp', alt: 'Fresh British beetroot with leaves' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/beetroot/2/main.webp', alt: 'Golden and red beetroot varieties' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/beetroot/3/main.webp', alt: 'Organic beetroot close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/beetroot/4/main.webp', alt: 'Farm-fresh beetroot bunch' },
    ],
    monthsInSeason: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
    peakMonths: [7, 8, 9, 10],
    nutritionPer100g: { kcal: 43, protein: 1.6, carbs: 10, sugars: 7, fiber: 2.8, fat: 0.2 },
    selectionTips: [
      'Choose firm beets with smooth skin.',
      'Small to medium size are most tender.',
      'Fresh leaves indicate recently harvested.',
      'Avoid beets with soft spots or wrinkles.',
    ],
    storageTips: [
      'Remove leaves, leaving 2cm of stem.',
      'Store unwashed in fridge for 2-3 weeks.',
      'Cooked beetroot keeps for up to a week.',
      'Can be pickled for longer preservation.',
    ],
    prepIdeas: [
      'Roast whole wrapped in foil.',
      'Grate raw into salads.',
      'Make beetroot hummus.',
      'Juice with apple and ginger.',
    ],
    recipeChips: [
      {
        title: 'Roasted Beetroot Salad',
        url: 'https://www.bbcgoodfood.com/recipes/roasted-beetroot-salad-goats-cheese',
        description: 'Classic combination with goats cheese'
      },
      {
        title: 'Beetroot Soup (Borscht)',
        url: 'https://www.olivemagazine.com/recipes/healthy/borscht/',
        description: 'Vibrant Eastern European classic'
      }
    ],
    aliases: ['beets', 'red beet', 'golden beetroot', 'chioggia'],
  },
  {
    slug: 'rhubarb',
    name: 'Rhubarb',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/rhubarb/1/main.webp', alt: 'Fresh pink forced rhubarb stalks' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/rhubarb/2/main.webp', alt: 'Yorkshire rhubarb bundle' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/rhubarb/3/main.webp', alt: 'Spring rhubarb close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/rhubarb/4/main.webp', alt: 'British rhubarb harvest' },
    ],
    monthsInSeason: [1, 2, 3, 4, 5, 6], // Jan-Jun (forced and outdoor)
    peakMonths: [3, 4, 5],
    nutritionPer100g: { kcal: 21, protein: 0.9, carbs: 4.5, sugars: 1.1, fiber: 1.8, fat: 0.2 },
    selectionTips: [
      'Choose firm, crisp stalks.',
      'Bright colour indicates freshness.',
      'Forced rhubarb is pink and tender.',
      'Avoid limp or damaged stalks.',
    ],
    storageTips: [
      'Wrap loosely in plastic and refrigerate.',
      'Use within a week for best quality.',
      'Chop and freeze for up to 12 months.',
      'Do not eat the leaves - they are toxic.',
    ],
    prepIdeas: [
      'Stew with sugar for compote.',
      'Bake into crumbles and pies.',
      'Make rhubarb fool with cream.',
      'Roast with orange and vanilla.',
    ],
    recipeChips: [
      {
        title: 'Rhubarb Crumble',
        url: 'https://www.bbcgoodfood.com/recipes/rhubarb-crumble',
        description: 'Classic British dessert'
      },
      {
        title: 'Rhubarb Fool',
        url: 'https://www.olivemagazine.com/recipes/baking-and-desserts/rhubarb-and-ginger-fool/',
        description: 'Light and creamy spring pudding'
      }
    ],
    aliases: ['forced rhubarb', 'Yorkshire rhubarb'],
  },
  {
    slug: 'spinach',
    name: 'Spinach',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/spinach/2/main.webp', alt: 'Baby spinach in bowl' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/spinach/3/main.webp', alt: 'Organic spinach close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/spinach/4/main.webp', alt: 'British spinach harvest' },
    ],
    monthsInSeason: [3, 4, 5, 6, 7, 8, 9, 10], // Mar-Oct
    peakMonths: [4, 5, 6],
    nutritionPer100g: { kcal: 23, protein: 2.9, carbs: 3.6, sugars: 0.4, fiber: 2.2, fat: 0.4 },
    selectionTips: [
      'Look for dark green, crisp leaves.',
      'Avoid yellowing or wilted leaves.',
      'Baby spinach is more tender.',
      'Check for sliminess or odour.',
    ],
    storageTips: [
      'Store unwashed in the fridge.',
      'Use within 3-5 days.',
      'Keep in original container or plastic bag.',
      'Blanch and freeze for cooking.',
    ],
    prepIdeas: [
      'Wilt into pasta dishes.',
      'Add to smoothies for nutrients.',
      'Make creamed spinach.',
      'Use raw in salads.',
    ],
    recipeChips: [
      {
        title: 'Creamed Spinach',
        url: 'https://www.bbcgoodfood.com/recipes/creamed-spinach',
        description: 'Rich and indulgent side dish'
      },
      {
        title: 'Spinach and Ricotta Cannelloni',
        url: 'https://www.jamieoliver.com/recipes/pasta/spinach-ricotta-cannelloni/',
        description: 'Italian comfort food classic'
      }
    ],
    aliases: ['baby spinach', 'leaf spinach'],
  },
  {
    slug: 'broad-beans',
    name: 'Broad Beans',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/1/main.webp', alt: 'Fresh broad beans in pods' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/2/main.webp', alt: 'Shelled broad beans close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/3/main.webp', alt: 'British broad beans harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broad-beans/4/main.webp', alt: 'Summer broad beans' },
    ],
    monthsInSeason: [5, 6, 7, 8], // May-Aug
    peakMonths: [6, 7],
    nutritionPer100g: { kcal: 88, protein: 7.6, carbs: 11, sugars: 1.8, fiber: 6.5, fat: 0.7 },
    selectionTips: [
      'Choose plump, bright green pods.',
      'Smaller beans are more tender.',
      'Pods should feel full but not bulging.',
      'Avoid yellowing or damaged pods.',
    ],
    storageTips: [
      'Store in pods in the fridge for 3-4 days.',
      'Shell and blanch before freezing.',
      'Double-pod for extra tenderness.',
      'Dried beans store for months.',
    ],
    prepIdeas: [
      'Double-pod and toss with mint and feta.',
      'Mash into a dip with lemon.',
      'Add to risottos and pasta.',
      'Serve simply with butter.',
    ],
    recipeChips: [
      {
        title: 'Broad Bean and Feta Salad',
        url: 'https://www.bbcgoodfood.com/recipes/broad-bean-feta-dill-salad',
        description: 'Fresh summer salad with herbs'
      },
      {
        title: 'Broad Bean Bruschetta',
        url: 'https://www.olivemagazine.com/recipes/crushed-broad-bean-and-mint-bruschetta/',
        description: 'Italian-style toast topper'
      }
    ],
    aliases: ['fava beans', 'faba beans'],
  },
  {
    slug: 'peas',
    name: 'Garden Peas',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/peas/1/main.webp', alt: 'Fresh garden peas in pods' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/peas/2/main.webp', alt: 'Shelled peas close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/peas/3/main.webp', alt: 'British garden peas' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/peas/4/main.webp', alt: 'Summer pea harvest' },
    ],
    monthsInSeason: [5, 6, 7, 8, 9], // May-Sep
    peakMonths: [6, 7],
    nutritionPer100g: { kcal: 81, protein: 5.4, carbs: 14, sugars: 5.7, fiber: 5.1, fat: 0.4 },
    selectionTips: [
      'Choose bright green, plump pods.',
      'Pods should feel full of peas.',
      'Avoid yellowing or flat pods.',
      'Fresh peas squeak when rubbed together.',
    ],
    storageTips: [
      'Use as soon as possible - sugars convert to starch.',
      'Store in pods in fridge for 2-3 days.',
      'Shell and freeze immediately for best flavour.',
      'Frozen peas are often fresher than "fresh".',
    ],
    prepIdeas: [
      'Eat raw straight from the pod.',
      'Make fresh pea soup.',
      'Mash with mint for a side.',
      'Add to risotto at the last minute.',
    ],
    recipeChips: [
      {
        title: 'Pea and Mint Soup',
        url: 'https://www.bbcgoodfood.com/recipes/pea-mint-soup',
        description: 'Fresh and vibrant summer soup'
      },
      {
        title: 'Pea Risotto',
        url: 'https://www.bbcgoodfoodme.com/recipes/creamy-pea-and-chive-risotto/',
        description: 'Creamy Italian rice with fresh peas'
      }
    ],
    aliases: ['garden peas', 'shelling peas', 'English peas'],
  },
  {
    slug: 'courgettes',
    name: 'Courgettes',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/courgettes/1/main.webp', alt: 'Fresh green courgettes' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/courgettes/2/main.webp', alt: 'Yellow and green courgette varieties' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/courgettes/3/main.webp', alt: 'British courgettes close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/courgettes/4/main.webp', alt: 'Summer courgette harvest' },
    ],
    monthsInSeason: [6, 7, 8, 9, 10], // Jun-Oct
    peakMonths: [7, 8],
    nutritionPer100g: { kcal: 17, protein: 1.2, carbs: 3.1, sugars: 2.5, fiber: 1.0, fat: 0.3 },
    selectionTips: [
      'Choose firm courgettes with glossy skin.',
      'Smaller ones have better flavour.',
      'Avoid soft spots or wrinkled skin.',
      'The flower end should be fresh.',
    ],
    storageTips: [
      'Store in fridge for up to a week.',
      'Do not wash until ready to use.',
      'Can be frozen if grated first.',
      'Best eaten fresh for texture.',
    ],
    prepIdeas: [
      'Spiralize into courgetti.',
      'Grill with olive oil and herbs.',
      'Stuff and bake.',
      'Grate into cakes and bread.',
    ],
    recipeChips: [
      {
        title: 'Stuffed Courgettes',
        url: 'https://www.bbcgoodfood.com/recipes/stuffed-courgettes',
        description: 'Mediterranean-style baked courgettes'
      },
      {
        title: 'Courgette Fritters',
        url: 'https://www.greatbritishchefs.com/recipes/easy-courgette-fritters-recipe',
        description: 'Crispy vegetable pancakes'
      }
    ],
    aliases: ['zucchini', 'summer squash', 'marrow'],
  },
  {
    slug: 'raspberries',
    name: 'Raspberries',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/raspberries/1/main.webp', alt: 'Fresh red raspberries' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/raspberries/2/main.webp', alt: 'Summer raspberries in punnet' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/raspberries/3/main.webp', alt: 'British raspberries close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/raspberries/4/main.webp', alt: 'Ripe raspberry harvest' },
    ],
    monthsInSeason: [6, 7, 8, 9], // Jun-Sep
    peakMonths: [7, 8],
    nutritionPer100g: { kcal: 52, protein: 1.2, carbs: 12, sugars: 4.4, fiber: 6.5, fat: 0.7 },
    selectionTips: [
      'Choose plump, brightly coloured berries.',
      'Avoid mushy or leaking berries.',
      'Check for mould in the punnet.',
      'Should have a sweet aroma.',
    ],
    storageTips: [
      'Store unwashed in the fridge.',
      'Use within 2-3 days.',
      'Freeze in a single layer then bag.',
      'Do not wash until ready to eat.',
    ],
    prepIdeas: [
      'Eat fresh with cream.',
      'Blend into smoothies.',
      'Bake into tarts and muffins.',
      'Make raspberry jam.',
    ],
    recipeChips: [
      {
        title: 'Raspberry Pavlova',
        url: 'https://www.bbcgoodfood.com/recipes/raspberry-pavlova',
        description: 'Classic British summer dessert'
      },
      {
        title: 'Raspberry Jam',
        url: 'https://www.greatbritishchefs.com/recipes/easy-raspberry-jam-recipe',
        description: 'Homemade preserve'
      }
    ],
    aliases: ['raspberry'],
  },
  {
    slug: 'cherries',
    name: 'Cherries',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cherries/1/main.webp', alt: 'Fresh red cherries with stems' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cherries/2/main.webp', alt: 'British cherries close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cherries/3/main.webp', alt: 'Summer cherry harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cherries/4/main.webp', alt: 'Dark red cherries' },
    ],
    monthsInSeason: [6, 7, 8], // Jun-Aug
    peakMonths: [7],
    nutritionPer100g: { kcal: 63, protein: 1.1, carbs: 16, sugars: 13, fiber: 2.1, fat: 0.2 },
    selectionTips: [
      'Choose firm, glossy cherries.',
      'Stems should be green and fresh.',
      'Darker colour usually means sweeter.',
      'Avoid soft or bruised fruit.',
    ],
    storageTips: [
      'Store unwashed in the fridge.',
      'Use within a week.',
      'Pit and freeze for later use.',
      'Bring to room temperature before eating.',
    ],
    prepIdeas: [
      'Eat fresh as a snack.',
      'Bake into clafoutis.',
      'Make cherry compote.',
      'Add to salads with goats cheese.',
    ],
    recipeChips: [
      {
        title: 'Cherry Clafoutis',
        url: 'https://www.bbcgoodfood.com/recipes/cherry-clafoutis',
        description: 'Classic French baked custard'
      },
      {
        title: 'Cherry Pie',
        url: 'https://www.greatbritishchefs.com/recipes/cherry-pie-recipe',
        description: 'Traditional fruit pie'
      }
    ],
    aliases: ['sweet cherries', 'sour cherries', 'morello'],
  },
  {
    slug: 'pears',
    name: 'Pears',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pears/1/main.webp', alt: 'Fresh British pears' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pears/2/main.webp', alt: 'Conference pears close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pears/3/main.webp', alt: 'Autumn pear harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pears/4/main.webp', alt: 'Ripe pears on table' },
    ],
    monthsInSeason: [8, 9, 10, 11, 12, 1, 2], // Aug-Feb
    peakMonths: [9, 10, 11],
    nutritionPer100g: { kcal: 57, protein: 0.4, carbs: 15, sugars: 10, fiber: 3.1, fat: 0.1 },
    selectionTips: [
      'Check the neck - it should give slightly when ripe.',
      'Avoid pears with bruises or soft spots.',
      'Conference and Comice are UK favourites.',
      'Buy firm and ripen at home.',
    ],
    storageTips: [
      'Ripen at room temperature.',
      'Refrigerate once ripe to slow further ripening.',
      'Use within 3-5 days once ripe.',
      'Can be poached and frozen.',
    ],
    prepIdeas: [
      'Poach in red wine and spices.',
      'Slice into salads with blue cheese.',
      'Bake into tarts.',
      'Eat fresh as a snack.',
    ],
    recipeChips: [
      {
        title: 'Poached Pears',
        url: 'https://www.bbcgoodfood.com/recipes/poached-pears-chocolate-sauce',
        description: 'Elegant dessert with chocolate'
      },
      {
        title: 'Pear and Blue Cheese Salad',
        url: 'https://www.olivemagazine.com/recipes/quick-and-easy/pear-chicory-and-blue-cheese-salad/',
        description: 'Classic autumn salad combination'
      }
    ],
    aliases: ['conference pear', 'comice', 'williams'],
  },
  {
    slug: 'broccoli',
    name: 'Broccoli',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broccoli/1/main.webp', alt: 'Fresh green broccoli head' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broccoli/2/main.webp', alt: 'British broccoli florets' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broccoli/3/main.webp', alt: 'Organic broccoli close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/broccoli/4/main.webp', alt: 'Fresh broccoli harvest' },
    ],
    monthsInSeason: [6, 7, 8, 9, 10, 11], // Jun-Nov
    peakMonths: [7, 8, 9],
    nutritionPer100g: { kcal: 34, protein: 2.8, carbs: 7, sugars: 1.7, fiber: 2.6, fat: 0.4 },
    selectionTips: [
      'Choose tight, dark green florets.',
      'Avoid yellowing or flowering heads.',
      'Stalks should be firm and crisp.',
      'Smaller heads are often more tender.',
    ],
    storageTips: [
      'Store unwashed in the fridge.',
      'Use within 3-5 days.',
      'Blanch and freeze for longer storage.',
      'Keep in a perforated bag.',
    ],
    prepIdeas: [
      'Steam until bright green.',
      'Roast with garlic and parmesan.',
      'Stir-fry with ginger.',
      'Blend into soup.',
    ],
    recipeChips: [
      {
        title: 'Roasted Broccoli',
        url: 'https://www.bbcgoodfood.com/recipes/roasted-broccoli-parmesan',
        description: 'Crispy roasted florets with cheese'
      },
      {
        title: 'Broccoli Soup',
        url: 'https://www.jamieoliver.com/recipes/vegetables/broccoli-soup/',
        description: 'Healthy and vibrant green soup'
      }
    ],
    aliases: ['calabrese', 'tenderstem'],
  },
  {
    slug: 'cauliflower',
    name: 'Cauliflower',
    images: [
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cauliflower/1/main.webp', alt: 'Fresh white cauliflower head' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cauliflower/2/main.webp', alt: 'British cauliflower close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cauliflower/3/main.webp', alt: 'Organic cauliflower florets' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/cauliflower/4/main.webp', alt: 'Autumn cauliflower harvest' },
    ],
    monthsInSeason: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12], // Most of year
    peakMonths: [9, 10, 11],
    nutritionPer100g: { kcal: 25, protein: 1.9, carbs: 5, sugars: 1.9, fiber: 2, fat: 0.3 },
    selectionTips: [
      'Choose compact, creamy white heads.',
      'Avoid brown spots or loose florets.',
      'Leaves should be fresh and green.',
      'Head should feel heavy for its size.',
    ],
    storageTips: [
      'Store stem-side up in the fridge.',
      'Use within a week.',
      'Blanch and freeze florets.',
      'Keep in a plastic bag.',
    ],
    prepIdeas: [
      'Roast whole with spices.',
      'Make cauliflower cheese.',
      'Blend into low-carb rice.',
      'Char on the grill.',
    ],
    recipeChips: [
      {
        title: 'Cauliflower Cheese',
        url: 'https://www.bbcgoodfood.com/recipes/best-cauliflower-cheese',
        description: 'British classic comfort food'
      },
      {
        title: 'Whole Roasted Cauliflower',
        url: 'https://www.jamieoliver.com/recipes/vegetables/whole-roasted-cauliflower/',
        description: 'Impressive centrepiece dish'
      }
    ],
    aliases: ['cauli', 'romanesco'],
  },
]

// Helper functions
export function getProduceBySlug(slug: string): Produce | undefined {
  return PRODUCE.find(p => p.slug === slug)
}

export function getProduceInSeason(month: number): Produce[] {
  return PRODUCE.filter(p => p.monthsInSeason.includes(month))
}

export function getProduceAtPeak(month: number): Produce[] {
  return PRODUCE.filter(p => p.peakMonths?.includes(month))
}

export function searchProduce(query: string): Produce[] {
  const lowerQuery = query.toLowerCase()
  return PRODUCE.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery))
  )
}
