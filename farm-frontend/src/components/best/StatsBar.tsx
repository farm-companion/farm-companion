'use client'

import { MapPin, Store, Calendar, Award } from 'lucide-react'

interface Stat {
  icon: React.ElementType
  value: string | number
  label: string
}

interface StatsBarProps {
  farmsCount: number
  regionsCount?: number
  lastUpdated?: string
  featured?: boolean
  className?: string
}

export function StatsBar({
  farmsCount,
  regionsCount = 12,
  lastUpdated,
  featured = false,
  className = '',
}: StatsBarProps) {
  const stats: Stat[] = [
    {
      icon: Store,
      value: farmsCount,
      label: 'Curated Farms',
    },
    {
      icon: MapPin,
      value: regionsCount,
      label: 'UK Regions',
    },
    {
      icon: Calendar,
      value: lastUpdated
        ? new Date(lastUpdated).toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
          })
        : 'Jan 2026',
      label: 'Last Updated',
    },
  ]

  if (featured) {
    stats.push({
      icon: Award,
      value: 'Yes',
      label: "Editor's Pick",
    })
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="py-6 px-4 text-center group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 mb-3 group-hover:bg-serum/10 group-hover:text-serum transition-colors">
                  <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-serum transition-colors" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
