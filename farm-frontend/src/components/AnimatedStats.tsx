'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, MapPin, Clock } from 'lucide-react'
import { scrollReveal, viewportOnce, staggerContainer, staggerItem } from '@/lib/animations'

interface AnimatedStatsProps {
  farmCount: number
  countyCount: number
}

export function AnimatedStats({ farmCount, countyCount }: AnimatedStatsProps) {
  // WCAG AAA compliant colors - text versions for proper contrast
  const stats = [
    {
      icon: MapPin,
      value: `${farmCount}+`,
      label: 'Farm Shops',
      description: 'Verified local farm shops across the UK',
      colorBg: 'bg-primary-100 dark:bg-primary-900/30',
      colorText: 'text-primary-700 dark:text-primary-400'
    },
    {
      icon: Award,
      value: countyCount,
      label: 'Counties',
      description: 'Complete coverage of UK regions',
      colorBg: 'bg-secondary-100 dark:bg-secondary-900/30',
      colorText: 'text-secondary-700 dark:text-secondary-400'
    },
    {
      icon: TrendingUp,
      value: '100%',
      label: 'Fresh & Local',
      description: 'Direct from farm to table',
      colorBg: 'bg-primary-100 dark:bg-primary-900/30',
      colorText: 'text-primary-700 dark:text-primary-400'
    },
    {
      icon: Clock,
      value: 'Live',
      label: 'Real-time Status',
      description: 'See which farms are open now',
      colorBg: 'bg-secondary-100 dark:bg-secondary-900/30',
      colorText: 'text-secondary-700 dark:text-secondary-400'
    }
  ]

  return (
    <section aria-labelledby="site-stats" className="bg-background-canvas border-b border-border-default py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 id="site-stats" className="sr-only">Site Statistics</h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 ${stat.colorBg} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:shadow-lg transition-shadow`}
              >
                <stat.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.colorText}`} />
              </motion.div>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-heading font-bold ${stat.colorText} mb-1 sm:mb-2`}>
                {stat.value}
              </div>
              <div className="text-caption font-semibold text-text-heading mb-1">{stat.label}</div>
              <div className="text-small text-text-muted px-2">{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
