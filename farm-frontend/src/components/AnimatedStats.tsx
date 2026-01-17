'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, MapPin, Clock } from 'lucide-react'
import { scrollReveal, viewportOnce, staggerContainer, staggerItem } from '@/lib/animations'

interface AnimatedStatsProps {
  farmCount: number
  countyCount: number
}

export function AnimatedStats({ farmCount, countyCount }: AnimatedStatsProps) {
  const stats = [
    {
      icon: MapPin,
      value: `${farmCount}+`,
      label: 'Farm Shops',
      description: 'Verified local farm shops across the UK',
      color: 'serum'
    },
    {
      icon: Award,
      value: countyCount,
      label: 'Counties',
      description: 'Complete coverage of UK regions',
      color: 'solar'
    },
    {
      icon: TrendingUp,
      value: '100%',
      label: 'Fresh & Local',
      description: 'Direct from farm to table',
      color: 'serum'
    },
    {
      icon: Clock,
      value: 'Live',
      label: 'Real-time Status',
      description: 'See which farms are open now',
      color: 'solar'
    }
  ]

  return (
    <section aria-labelledby="site-stats" className="bg-background-canvas border-b border-border-default py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 id="site-stats" className="sr-only">Site Statistics</h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
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
                className={`w-16 h-16 bg-${stat.color}/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow`}
              >
                <stat.icon className={`w-8 h-8 text-${stat.color}`} />
              </motion.div>
              <div className={`text-4xl font-heading font-bold text-${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-text-heading mb-1">{stat.label}</div>
              <div className="text-sm text-text-muted">{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
