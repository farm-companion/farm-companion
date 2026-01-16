/**
 * Category-specific FAQs for rich snippet optimization
 *
 * These FAQs are designed to target common search queries and provide
 * value to users while optimizing for Google's FAQ rich snippets.
 */

interface FAQ {
  question: string
  answer: string
}

export const categoryFAQs: Record<string, FAQ[]> = {
  'organic-farms': [
    {
      question: 'What makes a farm organic in the UK?',
      answer: 'Organic farms in the UK must be certified by approved bodies like the Soil Association. They follow strict standards prohibiting synthetic pesticides and fertilizers, GMOs, and routine antibiotic use. Organic farms must maintain high animal welfare standards, protect wildlife, and use sustainable farming practices.'
    },
    {
      question: 'Are organic farms more expensive?',
      answer: 'Organic produce often costs more due to lower yields, higher labor costs, and certification expenses. However, buying direct from farm shops can offer better value than supermarkets. The extra cost reflects better environmental practices, higher animal welfare standards, and often superior taste and nutritional quality.'
    },
    {
      question: 'How can I verify a farm is truly organic?',
      answer: 'Look for certification logos from bodies like the Soil Association, Organic Farmers & Growers (OF&G), or the EU organic leaf symbol. All certified farms can provide their certification number, which you can verify online. Genuine organic farms are proud to share their certification details.'
    },
    {
      question: 'What can I buy at organic farm shops?',
      answer: 'Organic farm shops typically sell fresh vegetables, fruit, meat, dairy products, eggs, and often bakery items, preserves, and prepared foods. Many also stock organic wines, craft beers, and household products. Selection varies by season and what the farm produces or sources locally.'
    }
  ],
  'pick-your-own': [
    {
      question: 'What is pick your own (PYO)?',
      answer: 'Pick your own (PYO) farms allow visitors to harvest fresh fruit, vegetables, or flowers directly from the fields. You pay by weight for what you pick, often at prices lower than supermarkets. It\'s a fun family activity that ensures maximum freshness and lets you select the best quality produce.'
    },
    {
      question: 'When is pick your own season in the UK?',
      answer: 'PYO season runs from May to October, with different crops available at different times. Strawberries peak in June-July, raspberries in July-August, and apples in September-October. Many farms also offer pumpkin picking in October. Check with individual farms for specific crop availability and opening times.'
    },
    {
      question: 'Do I need to bring anything to pick your own farms?',
      answer: 'Most PYO farms provide containers for picking, but bringing your own bags or boxes can be helpful. Wear comfortable clothes and closed-toe shoes suitable for fields. Bring sun protection in summer, and consider bringing hand wipes. Some farms prefer cash payment, so check in advance.'
    },
    {
      question: 'Is pick your own cheaper than buying from shops?',
      answer: 'Yes, PYO is typically 30-50% cheaper than supermarket prices for the same quality produce. You\'re cutting out transportation and retail costs. Plus, you can pick exactly what you want, ensuring perfect ripeness and quality. The freshness means produce lasts longer too.'
    }
  ],
  'farm-shops': [
    {
      question: 'What is a farm shop?',
      answer: 'A farm shop is a retail outlet located on or near a farm that sells produce and products directly to consumers. They typically offer fresh vegetables, meat, dairy, eggs, and baked goods. Many stock items from neighbouring farms too, creating a hub for local produce. Farm shops cut out supermarket middlemen, offering fresher products and better prices for farmers.'
    },
    {
      question: 'Are farm shops more expensive than supermarkets?',
      answer: 'Farm shop prices are often comparable to or slightly higher than supermarkets for premium quality. However, you\'re getting significantly fresher produce, better quality meat, and supporting local farmers directly. Many items, especially seasonal produce, can be cheaper. The superior quality and freshness often provide better value overall.'
    },
    {
      question: 'What are the benefits of shopping at farm shops?',
      answer: 'Farm shops offer ultra-fresh produce picked at peak ripeness, higher quality meat with full traceability, seasonal variety, supporting local farmers directly, reduced food miles, knowledgeable staff who can advise on cooking and preparation, and often unique artisan products unavailable in supermarkets. You also get to know where your food comes from.'
    },
    {
      question: 'Do farm shops sell only their own produce?',
      answer: 'Most farm shops sell both their own produce and products from neighbouring farms. This allows them to offer a wider variety throughout the year. Reputable farm shops clearly label what\'s produced on-site versus sourced locally. This collaboration creates a sustainable local food network while ensuring year-round variety.'
    }
  ],
  'farm-cafes': [
    {
      question: 'What is a farm café?',
      answer: 'A farm café is a restaurant or café located on a working farm, serving food made from farm-fresh ingredients. Many use produce from their own farm or local suppliers. Farm cafés offer genuine farm-to-table dining in a rural setting, often with views of the countryside and animals. They range from casual tea rooms to fine dining establishments.'
    },
    {
      question: 'Are farm cafés family-friendly?',
      answer: 'Yes, most farm cafés are very family-friendly. Many have play areas, allow children to see farm animals, and offer high chairs and children\'s menus. The rural setting and space make them ideal for families. Some even have specific family events, educational activities, or soft play areas.'
    },
    {
      question: 'Do farm cafés use organic ingredients?',
      answer: 'Many farm cafés prioritize organic and locally-sourced ingredients, though not all are fully organic. Most are transparent about their sourcing and many produce their own meat, vegetables, and dairy. Even non-certified farms often follow organic principles. It\'s worth asking staff about their ingredients and farming practices.'
    },
    {
      question: 'Do I need to book in advance for farm cafés?',
      answer: 'Booking requirements vary by venue. Popular farm cafés, especially for Sunday lunch or afternoon tea, often require advance booking. Casual farm cafés usually accept walk-ins for coffee and light meals. It\'s best to check their website or call ahead, particularly for groups or weekend visits.'
    }
  ],
  'christmas-trees': [
    {
      question: 'When can I buy a Christmas tree from a farm?',
      answer: 'Most Christmas tree farms open from late November, typically the last weekend of November or first weekend of December. Some open earlier for wreaths and decorations. Trees are available throughout December until Christmas Eve. Visiting early gives the best selection, while later visits may offer discounts on remaining trees.'
    },
    {
      question: 'Can I cut my own Christmas tree at farms?',
      answer: 'Many Christmas tree farms offer "choose and cut" where you select and cut your own tree. Staff provide saws and guidance on cutting technique. Some farms pre-cut trees while you wait. Cutting your own ensures maximum freshness and is a memorable family experience. Always check if a farm offers this service before visiting.'
    },
    {
      question: 'How much does a real Christmas tree cost from a farm?',
      answer: 'Prices vary by tree size and species. Expect £30-50 for a 5-6 foot tree, £50-80 for 7-8 feet, and £80+ for larger trees. Norway Spruce is usually cheaper, while Nordmann Fir (non-drop needles) costs more. Buying direct from farms often saves 20-30% compared to garden centres or supermarkets.'
    },
    {
      question: 'Which Christmas tree variety is best?',
      answer: 'Nordmann Fir is most popular for its non-drop needles, strong branches, and neat shape. Norway Spruce is traditional, fragrant, and budget-friendly but drops needles. Blue Spruce has striking blue-green colour and good needle retention. Fraser Fir has excellent needle retention and strong branches. Visit a farm to see and smell varieties before choosing.'
    }
  ],
  'farmers-markets': [
    {
      question: 'What is a farmers market?',
      answer: 'A farmers market is a regular event where local farmers and producers sell their products directly to consumers. Stallholders must be the producers or closely involved in production. Markets offer fresh vegetables, meat, dairy, baked goods, preserves, and crafts. They support local economy, reduce food miles, and let you meet the people growing your food.'
    },
    {
      question: 'How are farmers markets different from regular markets?',
      answer: 'Farmers markets require vendors to be actual producers, not resellers. Products must be locally produced, often within a defined radius. This ensures authenticity, freshness, and direct farmer-to-consumer sales. Regular markets may have any vendors selling any products from anywhere. Farmers markets prioritize local, seasonal, and artisan products.'
    },
    {
      question: 'Are farmers markets more expensive?',
      answer: 'Prices are often comparable to supermarkets for similar quality, sometimes cheaper for seasonal produce. While you might pay more than budget supermarket ranges, you\'re getting significantly better quality, freshness, and supporting local farmers. Many vendors offer deals like bundles or end-of-market discounts. The superior quality provides excellent value.'
    },
    {
      question: 'What should I bring to a farmers market?',
      answer: 'Bring reusable bags or baskets for carrying purchases. Cash is often preferred, though many vendors now accept cards. Arrive early for best selection or late for potential discounts. Bring a cooler bag if buying meat or dairy on warm days. Don\'t be shy to chat with producers about their products and farming methods.'
    }
  ],
  'veg-box-schemes': [
    {
      question: 'What is a veg box scheme?',
      answer: 'A veg box scheme delivers fresh, seasonal vegetables (and sometimes fruit, eggs, and other products) direct from farms to your door. Boxes are typically weekly or fortnightly subscriptions containing a seasonal selection. Some offer customization while others embrace the surprise of seasonal variety. It\'s convenient, supports local farms, and reduces food waste and packaging.'
    },
    {
      question: 'How much does a veg box cost?',
      answer: 'Veg boxes typically cost £10-25 per week depending on size and contents. Small boxes suit 1-2 people, medium boxes 2-4 people, and large boxes 4+ people. Most schemes offer various options including organic, standard, fruit additions, or mixed boxes. Many provide better value than supermarkets for equivalent organic produce, with superior freshness.'
    },
    {
      question: 'Can I choose what\'s in my veg box?',
      answer: 'This varies by scheme. Some offer full customization via online accounts where you can add, remove, or swap items. Others provide a standard seasonal selection with limited swaps. Many people enjoy the surprise of seasonal variety and trying new vegetables. Most schemes allow you to specify dietary requirements or strong dislikes.'
    },
    {
      question: 'How does veg box delivery work?',
      answer: 'Most schemes offer weekly or fortnightly delivery on set days. Some deliver to your door, others to collection points. You can usually pause deliveries for holidays. Boxes come in recyclable or returnable packaging. Delivery is often included in the price or charged separately. Most schemes are flexible and accommodate schedule changes.'
    }
  ],
  'educational-visits': [
    {
      question: 'What age groups are farm visits suitable for?',
      answer: 'Educational farm visits cater to all ages from toddlers to secondary school students. Many farms tailor activities to specific age groups. Toddlers enjoy meeting animals and simple activities. Primary children can learn about food production, animal care, and countryside life. Secondary students can study agriculture, sustainability, and business. Many farms also offer adult education and training.'
    },
    {
      question: 'What do children learn on farm visits?',
      answer: 'Farm visits teach where food comes from, animal care and welfare, crop growing and seasons, countryside safety, environmental sustainability, and the work involved in farming. Children develop empathy for animals, understand food production, and appreciate farmers\' work. Many visits align with the national curriculum for science, geography, and PSHE.'
    },
    {
      question: 'How much do school farm visits cost?',
      answer: 'Educational farm visits typically cost £5-10 per child, often with free teacher places. Some farms offer subsidized rates for schools in deprived areas or specific educational programs. Prices usually include activities, worksheets, and expert guidance. Many farms are cheaper than theme parks while providing valuable learning experiences. Some offer grant funding information.'
    },
    {
      question: 'Are farm visits safe for children?',
      answer: 'Yes, farms offering educational visits must meet strict health and safety standards. They have risk assessments, public liability insurance, and trained staff. Activities are age-appropriate and supervised. Handwashing facilities are provided. Many farms are LEAF (Linking Environment And Farming) accredited or hold quality assurance marks ensuring high safety and educational standards.'
    }
  ],
  'ice-cream-farms': [
    {
      question: 'Why is farm ice cream better?',
      answer: 'Farm ice cream is made with fresh milk and cream from the farm\'s own dairy herd, often churned the same day. Higher butterfat content creates richer, creamier texture. No long-distance transportation means maximum freshness. Many use traditional recipes without artificial additives. Real fruit, local ingredients, and small-batch production result in superior flavour and quality.'
    },
    {
      question: 'What makes dairy farm ice cream different from shop-bought?',
      answer: 'Farm ice cream typically contains 50-100% more cream than commercial brands, creating much richer texture. It\'s made in small batches allowing better quality control. Ingredients are often organic or locally sourced. The milk comes from their own cows, so freshness is guaranteed. There are fewer stabilizers and artificial ingredients compared to mass-produced ice cream.'
    },
    {
      question: 'Can I visit ice cream farms year-round?',
      answer: 'Most ice cream farms are open year-round, though some reduce hours in winter. Many have indoor seating and facilities making them appealing in any weather. Some offer seasonal flavours - fresh strawberry in summer, Christmas pudding in winter. Year-round farms often have additional attractions like farm animals, play areas, or walking trails.'
    },
    {
      question: 'Do ice cream farms offer dairy-free options?',
      answer: 'Many dairy farms now offer dairy-free ice cream options made with oat, coconut, or almond milk. Some make sorbets using fresh fruit. While not all farms cater to dietary requirements, awareness is growing. It\'s best to call ahead or check their website. Some farms specialize in dairy-free alternatives while maintaining farm-fresh quality.'
    }
  ],
  'cheese-makers': [
    {
      question: 'What types of British cheese are available from farm cheese makers?',
      answer: 'British farmhouse cheese makers produce Cheddar (traditional and flavoured), Stilton (blue cheese), Red Leicester, Wensleydale, Lancashire, Double Gloucester, and many regional specialities. Artisan makers also create British versions of Continental styles like brie, camembert, and gouda. Many farms produce unique cheeses you won\'t find anywhere else, often using traditional recipes and methods.'
    },
    {
      question: 'How is farmhouse cheese different from supermarket cheese?',
      answer: 'Farmhouse cheese is made by hand in small batches using milk from the farm\'s own herd. Traditional methods and longer aging create more complex flavours. There\'s complete traceability from cow to cheese. Mass-produced cheese uses milk from many sources, faster processes, and standardized recipes. Farmhouse cheese offers superior flavour, texture, and connection to place.'
    },
    {
      question: 'Can I visit cheese-making farms?',
      answer: 'Many artisan cheese makers welcome visitors, offering farm shop sales, tours, and tastings. Some allow you to watch cheese-making (usually with advance booking). Most have shops where you can sample before buying. Some offer cheesemaking courses. Visit times vary as production depends on milking schedules. Always check opening times and book tours in advance.'
    },
    {
      question: 'How should I store farmhouse cheese?',
      answer: 'Wrap cheese in waxed or greaseproof paper (not cling film which causes sweating). Store in the fridge\'s warmest part, usually the salad drawer. Remove from fridge 30-60 minutes before eating to reach room temperature for best flavour. Hard cheeses keep 2-4 weeks; soft cheeses use within a week. Properly stored farmhouse cheese develops flavour over time.'
    }
  ]
}

// Generic FAQs for categories without specific FAQs
export const genericCategoryFAQs: FAQ[] = [
  {
    question: 'What are the benefits of buying direct from farms?',
    answer: 'Buying direct from farms ensures maximum freshness, supports local farmers and the rural economy, reduces food miles and environmental impact, provides traceability and transparency about where food comes from, often offers better prices by cutting out middlemen, and gives access to seasonal, high-quality produce not available in supermarkets.'
  },
  {
    question: 'How do I find farms near me?',
    answer: 'Use our interactive map to find farms by location, browse by county to see all farms in your area, search by category for specific types of farms, or use the search function to find farms by name or product. Many farms also have websites and social media pages with directions, opening times, and current availability.'
  },
  {
    question: 'Are farms open all year round?',
    answer: 'Opening times vary significantly by farm type and season. Farm shops often operate year-round with reduced winter hours. Pick your own farms are seasonal (typically May-October). Christmas tree farms open November-December. Always check individual farm websites or call ahead to confirm opening times, especially for bank holidays and extreme weather.'
  },
  {
    question: 'Do I need to book before visiting a farm?',
    answer: 'Booking requirements vary. Farm shops usually accept walk-ins during opening hours. Farm cafés may require booking for lunch, especially weekends. Educational visits and tours always need advance booking. Pick your own farms usually don\'t require booking but may limit numbers in busy periods. Check individual farm websites or call ahead to avoid disappointment.'
  }
]
