/**
 * Generic FAQs for county pages
 *
 * These FAQs provide value to users visiting county-specific pages
 * and optimize for Google's FAQ rich snippets.
 */

interface FAQ {
  question: string
  answer: string
}

// Generic FAQs that apply to all county pages
export const countyFAQs: FAQ[] = [
  {
    question: 'What farm shops and local producers are in this county?',
    answer: 'This county has a variety of farm shops, pick your own farms, organic producers, and artisan food makers. Use our directory above to browse all farms in the area. You can filter by type (organic, PYO, dairy, etc.) and see location details, opening times, and what each farm sells. Many offer farm-fresh vegetables, meat, dairy, eggs, and specialty products.'
  },
  {
    question: 'Are there organic farms in this county?',
    answer: 'Yes, this county has several certified organic farms and producers. Browse the farms listed above and look for "Organic" or certification badges. Organic farms follow strict standards prohibiting synthetic chemicals and prioritizing animal welfare. You can visit their farm shops, buy veg boxes, or attend farmers markets to purchase certified organic produce, meat, and dairy products.'
  },
  {
    question: 'Where can I pick my own fruit and vegetables in this county?',
    answer: 'Pick your own (PYO) farms operate seasonally across this county, typically from May to October. Browse the listings above and filter by "Pick Your Own" to find farms offering strawberries, raspberries, apples, pumpkins, and more. Check individual farm websites for current crop availability, opening times, and booking requirements. PYO offers great value and guaranteed freshness.'
  },
  {
    question: 'Do farms in this county offer home delivery?',
    answer: 'Many farms offer delivery services including weekly veg boxes, meat boxes, and dairy deliveries. Some have online shops with home delivery or local collection points. Check individual farm websites or contact them directly to ask about delivery options, areas covered, and minimum order requirements. Veg box schemes are particularly popular for regular seasonal produce deliveries.'
  },
  {
    question: 'Can I visit farms in this county with children?',
    answer: 'Yes, many farms welcome families and offer child-friendly activities. Look for farms with educational visits, farm cafés with play areas, pick your own opportunities, and those hosting special events. Some farms have dedicated open days, animal petting, tractor rides, and seasonal events like pumpkin picking or Christmas activities. Always check accessibility and facilities before visiting with young children.'
  },
  {
    question: 'How do I find farms near me in this county?',
    answer: 'Use the map and listings above to find farms close to your location. You can search by postcode, town name, or use the interactive map to see all farms in your area. Each listing includes the full address, directions, and distance information. Many farms are within a short drive of major towns and cities, making farm-fresh shopping convenient and accessible.'
  },
  {
    question: 'What are the benefits of buying from local farms in this county?',
    answer: 'Buying from local farms means ultra-fresh produce picked at peak ripeness, supporting the local rural economy, knowing exactly where your food comes from, reducing food miles and environmental impact, access to seasonal variety, often better prices than supermarkets for premium quality, and building relationships with the farmers who grow your food. Local farms also maintain the countryside and contribute to the county\'s character.'
  },
  {
    question: 'Do farms in this county sell meat and dairy products?',
    answer: 'Yes, many farms in this county produce and sell high-quality meat, dairy, eggs, and related products. Look for specialist butchers, dairy farms with farm shops, and mixed farms offering multiple products. You\'ll find grass-fed beef, rare breed pork, free-range chicken, farmhouse cheese, fresh milk, cream, butter, and eggs. All products offer full traceability and are often produced using higher welfare standards than industrial farming.'
  }
]
