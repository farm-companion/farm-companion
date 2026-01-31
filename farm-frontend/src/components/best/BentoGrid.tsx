'use client'

import { Award, Leaf, Star, Users, ShieldCheck, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BentoItem {
  icon: 'certification' | 'quality' | 'sustainability' | 'experience' | 'reviews' | 'location'
  title: string
  description: string
  highlight?: string
}

interface BentoGridProps {
  items: BentoItem[]
  className?: string
}

const iconMap = {
  certification: ShieldCheck,
  quality: Award,
  sustainability: Leaf,
  experience: Users,
  reviews: Star,
  location: MapPin,
}

const iconColors = {
  certification: 'text-emerald-500 bg-emerald-500/10',
  quality: 'text-amber-500 bg-amber-500/10',
  sustainability: 'text-green-500 bg-green-500/10',
  experience: 'text-blue-500 bg-blue-500/10',
  reviews: 'text-yellow-500 bg-yellow-500/10',
  location: 'text-purple-500 bg-purple-500/10',
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {items.map((item, index) => {
        const Icon = iconMap[item.icon]
        const colorClasses = iconColors[item.icon]

        return (
          <div
            key={index}
            className={cn(
              'group relative overflow-hidden rounded-2xl',
              'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
              'border border-slate-200/50 dark:border-slate-700/50',
              'p-6 transition-all duration-300',
              'hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
              'hover:border-slate-300 dark:hover:border-slate-600',
              'hover:-translate-y-1'
            )}
          >
            {/* Subtle gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-100/50 dark:to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className={cn('inline-flex p-3 rounded-xl mb-4', colorClasses)}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>

              {/* Highlight badge */}
              {item.highlight && (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  {item.highlight}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Preset criteria sets for common best-of lists
 */
export const ORGANIC_CRITERIA: BentoItem[] = [
  {
    icon: 'certification',
    title: 'Certified Organic',
    description: 'Soil Association or equivalent certification ensuring strict organic standards.',
    highlight: 'Verified Standards',
  },
  {
    icon: 'quality',
    title: 'Premium Quality',
    description: 'High-quality produce grown with care, harvested at peak ripeness.',
  },
  {
    icon: 'sustainability',
    title: 'Sustainable Practices',
    description: 'Environmental stewardship, biodiversity protection, and regenerative farming.',
    highlight: 'Planet Positive',
  },
  {
    icon: 'experience',
    title: 'Visitor Experience',
    description: 'Welcoming atmosphere with farm tours, workshops, and educational programs.',
  },
  {
    icon: 'reviews',
    title: 'Excellent Reviews',
    description: 'Consistently high ratings from visitors and customers.',
    highlight: '4.5+ Rating',
  },
  {
    icon: 'location',
    title: 'UK-Wide Coverage',
    description: 'Farms across England, Scotland, Wales, and Northern Ireland.',
  },
]

export const PYO_CRITERIA: BentoItem[] = [
  {
    icon: 'quality',
    title: 'Fresh Harvest',
    description: 'Pick produce at peak ripeness for maximum flavor and nutrition.',
    highlight: 'Same-Day Fresh',
  },
  {
    icon: 'experience',
    title: 'Family Friendly',
    description: 'Safe, fun environments perfect for children and family outings.',
  },
  {
    icon: 'sustainability',
    title: 'Seasonal Variety',
    description: 'Rotating crops from strawberries in summer to pumpkins in autumn.',
    highlight: 'May-October',
  },
  {
    icon: 'location',
    title: 'Easy Access',
    description: 'Convenient parking and facilities for a comfortable visit.',
  },
  {
    icon: 'reviews',
    title: 'Top Rated',
    description: 'Farms loved by locals with excellent visitor feedback.',
  },
  {
    icon: 'certification',
    title: 'Quality Assured',
    description: 'Clean facilities, helpful staff, and clear pricing.',
  },
]

export const FARM_SHOP_CRITERIA: BentoItem[] = [
  {
    icon: 'quality',
    title: 'Local Produce',
    description: 'Fresh vegetables, quality meats, and artisan products from local farms.',
    highlight: 'Farm to Table',
  },
  {
    icon: 'certification',
    title: 'Traceable Origins',
    description: 'Know exactly where your food comes from and how it was produced.',
  },
  {
    icon: 'experience',
    title: 'On-Site Cafe',
    description: 'Many shops feature cafes serving farm-fresh meals and treats.',
  },
  {
    icon: 'sustainability',
    title: 'Low Food Miles',
    description: 'Supporting local agriculture and reducing environmental impact.',
    highlight: 'Eco-Friendly',
  },
  {
    icon: 'reviews',
    title: 'Customer Favorites',
    description: 'Highly recommended by locals and repeat visitors.',
  },
  {
    icon: 'location',
    title: 'Convenient Location',
    description: 'Easy to reach with ample parking and accessible facilities.',
  },
]
