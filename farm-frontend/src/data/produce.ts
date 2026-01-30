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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/1/main-CJEHOPHt26L4m5ik3aOfNa6yRWP6zA.webp', alt: 'Fresh UK sweetcorn on rustic wooden table' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/2/main-ZvyZLQ4FYrxVuy9NxDPxJ6gSUf0Ut3.webp', alt: 'Golden sweetcorn kernels close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/3/main-ZPv2dwfq110PEHzzZYW8dadjFRX0zY.webp', alt: 'Fresh sweetcorn cobs with husks' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/sweetcorn/4/main-AQMEgAgtuU5uow2XAWDZ50XhpotsW9.webp', alt: 'British sweetcorn harvest display' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/1/main-rAS2tDSYZKLOPfjunfzJxWVq9Dg6Nk.webp', alt: 'Fresh vine-ripened British tomatoes' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/2/main-kg0J5M0xCnhfcGJDSoT5FCAEqdnBTN.webp', alt: 'Heritage tomato varieties on wooden board' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/3/main-vh9wUDjwfrCX4ROkC6HbzmAqDq7jyh.webp', alt: 'Bright red tomatoes with natural morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/tomato/4/main-9pmm01Li6Tmg0Hz9dRGJCxjrtLOwyO.webp', alt: 'Farm-fresh UK tomatoes close-up' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/1/main-8LLqLKKeN06MtaStm4NSWzn8YewmeF.webp', alt: 'Fresh British strawberries with morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/2/main-6LttC51ceLn8lhtlFkEnbJiN7dkRVI.webp', alt: 'Ripe summer strawberries on natural linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/3/main-knKWIaBcw4xVzEObGPZDWdvX8PFxyH.webp', alt: 'Hand-picked strawberries in rustic basket' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/strawberries/4/main-qj8w4dcfoHrYjsZ9LarUBwPOLs3SUI.webp', alt: 'Peak season strawberries close-up detail' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/1/main-YurfiUNYYDm6JttrLaEE6LJnOhP0MY.webp', alt: 'Fresh wild blackberries with morning dew' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/2/main-ixATRww1YVKjRwhvxQOnxDQllG8oyP.webp', alt: 'Ripe blackberries in summer harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/3/main-n4zTby5zV1onqK88xPPTPpnf78CtPq.webp', alt: 'British blackberries macro detail' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/blackberries/4/main-8nQ4aHhiL2sC1IChrw3OXoY9D5kA26.webp', alt: 'Plump blackberries on natural surface' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/1/main-0YsX2J0vEimK3zH4a8yH2zeo8xuKKe.webp', alt: 'Fresh runner beans from British gardens' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/2/main-5JwSby7UGKUf1H0ImjkLmlv8zyXe9k.webp', alt: 'Vibrant green runner bean pods' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/3/main-mvgVaEhzl3pZyIJ6KfoqejIFoN278g.webp', alt: 'Summer runner bean harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/runner-beans/4/main-7sDtTGzYUQczuvvxrh8zOLjcSlsCit.webp', alt: 'Crisp runner beans on rustic table' },
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
        url: 'https://www.riverford.co.uk/recipes/middle-eastern-style-runner-beans?srsltid=AfmBOoorbptoOUwoGLQPEslUJmZHt4zyU58PQIqxFcHLSPsF77mkD6m5',
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/1/main-CHxa5eE8eNRa4fvRvVNDiwf9zAKaEc.webp', alt: 'Fresh British plums in autumn harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/2/main-MatTLOhCWf0OF3zSTX9yaIVCneq4YR.webp', alt: 'Ripe purple plums with natural bloom' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/3/main-v2OYv3ti0mSF0scJOJt8trwX8gD4HZ.webp', alt: 'Victoria plums on rustic wooden board' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/plums/4/main-Kro8WmwpSwoSDFh5Q4FpYuzzU3MI7C.webp', alt: 'Sweet plums with warm afternoon light' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/1/main-LozihTdVJ1kjk6hMx9nGiUKxSNbmsr.webp', alt: 'Fresh British apples in autumn orchard' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/2/main-TRr4zZWPBj5djTwMsfNewyjSx1bvDZ.webp', alt: 'Heritage apple varieties close-up' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/3/main-DNuxkMSjzIDEsIhyKH7YFCPbj9M5vI.webp', alt: 'Crisp eating apples on marble surface' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/apples/4/main-yqBdP9nhTvpY7Nco3wIC743QAjYcKb.webp', alt: 'Farm-fresh apples with rustic texture' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/1/main-YWLgCaePgJKWkYqkAv4Madye37f5NY.webp', alt: 'Fresh British pumpkins on neutral linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/2/main-hu38pVsnHKHhHaDVw36KUiTj1UhZyr.webp', alt: 'Orange pumpkins in autumn harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/3/main-ynuQhhl7dofarJecdVyB8SYNB1tGIx.webp', alt: 'Heritage pumpkin varieties display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/pumpkins/4/main-mVwQHFe2Hg9c4etqXq7OgptBiYuW9F.webp', alt: 'Farm pumpkins with golden hour light' },
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/1/main-MYkZCCl4geyqzvKHxqntAvh4VxJyZD.webp', alt: 'Fresh British asparagus spears on neutral linen' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/2/main-F431DIje1nPzXelA1zRnF8rSa3pv05.webp', alt: 'Spring asparagus with tight green tips' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/3/main-0zEewlS3zpkcCOJVoCdE7bQYLXFXmx.webp', alt: 'UK asparagus season harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/asparagus/4/main-GgbHFd58DmcK4kMP17VDc5Zn7Trgm5.webp', alt: 'Fresh asparagus spears close-up detail' },
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
        url: 'https://www.jamieoliver.com/recipes/vegetables-recipes/simply-asparagus/',
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/1/main-AlVusGr0XchfYbG40lFufjV7Yfz6E9.webp', alt: 'Fresh British kale leaves with selective focus' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/2/main-7GyhmNWWtX0shg3DvHgToO7nZftgg0.webp', alt: 'Dark green curly kale in golden hour light' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/3/main-5fRYjIlXEq8FKTEJgaLoC9mYizrEiU.webp', alt: 'Winter kale harvest display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/kale/4/main-rXGP5Vi1XcJHUL8SIztS4ULU2ClGVo.webp', alt: 'Organic kale leaves macro detail' },
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
        url: 'https://www.jamieoliver.com/recipes/vegetables-recipes/kale-caesar-salad/',
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/1/main-FF99kZENJyLw3VQHXjhZIXahTuvziv.webp', alt: 'Fresh British leeks at farmers market' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/2/main-zkimhF8QnZ1rHwWi58sMzBbRTh2Zmq.webp', alt: 'Winter leeks in wicker basket display' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/3/main-7VSuRyll3iUYmf3semPH6j36rBxzyb.webp', alt: 'Fresh leeks with white and green layers' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/leeks/4/main-3UhgiZADGxlnh6bna1iIYDLNHH38lG.webp', alt: 'UK grown leeks close-up detail' },
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
        url: 'https://www.jamieoliver.com/recipes/vegetables-recipes/braised-leeks/',
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
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/1/main-gS0sUMuKGUxfvsM3OESdrR4dYYN3pl.webp', alt: 'Fresh purple sprouting broccoli on rustic wooden table' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/2/main-ZM7wDS1wk6ZQKeVfGYAXaKqzKsYWuJ.webp', alt: 'Vibrant PSB with purple-green florets' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/3/main-4a1jzfaiga5yJIDkNSNr3vlHkmvxtj.webp', alt: 'British purple sprouting broccoli harvest' },
      { src: 'https://nivsgpgswqew7kxf.public.blob.vercel-storage.com/produce-images/purple-sprouting-broccoli/4/main-tKRaC46gFhX3lolTzkqud7d60N5dIy.webp', alt: 'Fresh PSB stems and florets close-up' },
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
        url: 'https://www.jamieoliver.com/recipes/vegetables-recipes/purple-sprouting-broccoli-with-chilli-garlic/',
        description: 'Quick and flavourful PSB side dish'
      },
      {
        title: 'PSB and Pasta',
        url: 'https://www.rivercottage.net/recipes/purple-sprouting-broccoli-pasta',
        description: 'Spring pasta with purple sprouting broccoli'
      }
    ],
    aliases: ['PSB', 'purple broccoli', 'sprouting broccoli'],
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
