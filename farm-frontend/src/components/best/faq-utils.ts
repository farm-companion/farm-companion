/**
 * FAQ utilities - Server-compatible functions
 */

export interface FAQ {
  question: string
  answer: string
  tip?: string
}

/**
 * Enhanced FAQs with tips for common categories
 */
export function addTipsToFAQs(
  faqs: Array<{ question: string; answer: string }>,
  category: string
): FAQ[] {
  const tipsByCategory: Record<string, Record<string, string>> = {
    organic: {
      'What does organic certification mean?':
        'The Soil Association is the UK\'s oldest and most respected organic certification body, founded in 1946.',
      'Are organic farms more expensive?':
        'Organic farms typically use 45% less energy than conventional farms.',
      'Can I visit these organic farms?':
        'Many organic farms offer "farm stay" experiences where you can help with daily tasks.',
    },
    pyo: {
      'When is PYO season?':
        'The UK strawberry season produces over 100,000 tonnes annually, most harvested by PYO visitors.',
      'Do I need to book in advance?':
        'Some farms use WhatsApp or text alerts to notify regular visitors when crops are ready.',
      'Is PYO cheaper than buying from shops?':
        'Strawberries picked at peak ripeness contain up to 50% more vitamin C than supermarket equivalents.',
    },
    'farm-shop': {
      default: 'Farm shops often feature seasonal "surprise boxes" with whatever is freshest that week.',
    },
  }

  return faqs.map((faq) => ({
    ...faq,
    tip: tipsByCategory[category]?.[faq.question] || tipsByCategory[category]?.default,
  }))
}
