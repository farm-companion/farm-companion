'use client'

import { TrendingUp, Award, MapPin, Clock } from 'lucide-react'

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
      label: 'Verified Listings',
      description: 'Farm shops checked and confirmed',
      colorBg: 'bg-primary-100 dark:bg-primary-900/30',
      colorText: 'text-primary-700 dark:text-primary-400'
    },
    {
      icon: Clock,
      value: 'Monthly',
      label: 'Hours Checked',
      description: 'Opening times verified regularly',
      colorBg: 'bg-secondary-100 dark:bg-secondary-900/30',
      colorText: 'text-secondary-700 dark:text-secondary-400'
    },
    {
      icon: Award,
      value: countyCount,
      label: 'Counties Covered',
      description: 'Across England, Scotland and Wales',
      colorBg: 'bg-primary-100 dark:bg-primary-900/30',
      colorText: 'text-primary-700 dark:text-primary-400'
    },
    {
      icon: TrendingUp,
      value: '89',
      label: "Editor's Picks",
      description: 'Hand-selected standout farm shops',
      colorBg: 'bg-secondary-100 dark:bg-secondary-900/30',
      colorText: 'text-secondary-700 dark:text-secondary-400'
    }
  ]

  return (
    <section aria-labelledby="site-stats" className="bg-background-canvas border-b border-border-default py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 id="site-stats" className="sr-only">Site Statistics</h2>

        <div className="stagger-entry grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div
                className={`stat-icon-hover w-14 h-14 sm:w-16 sm:h-16 ${stat.colorBg} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:shadow-lg`}
              >
                <stat.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.colorText}`} />
              </div>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-heading font-bold ${stat.colorText} mb-1 sm:mb-2`}>
                {stat.value}
              </div>
              <div className="text-caption font-semibold text-text-heading mb-1">{stat.label}</div>
              <div className="text-small text-text-muted px-2">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
