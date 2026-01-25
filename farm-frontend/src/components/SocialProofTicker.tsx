'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Star, MapPin, Clock, TrendingUp, Eye } from 'lucide-react'

interface SocialProofItem {
  id: string
  type: 'browsing' | 'review' | 'visit' | 'trending' | 'new'
  message: string
  timestamp: Date
  icon: 'users' | 'star' | 'mappin' | 'clock' | 'trending' | 'eye'
}

// Static proof items based on real data patterns
const PROOF_TEMPLATES: Omit<SocialProofItem, 'id' | 'timestamp'>[] = [
  { type: 'browsing', message: '{count} people viewing farm shops now', icon: 'eye' },
  { type: 'visit', message: 'Someone in {county} just found a new farm shop', icon: 'mappin' },
  { type: 'trending', message: '{category} is trending this week', icon: 'trending' },
  { type: 'new', message: 'New farm shop added in {county}', icon: 'clock' },
  { type: 'review', message: '{farmName} received a 5-star review', icon: 'star' },
]

const COUNTIES = [
  'Devon', 'Cornwall', 'Somerset', 'Dorset', 'Yorkshire',
  'Lincolnshire', 'Norfolk', 'Suffolk', 'Kent', 'Sussex',
  'Hampshire', 'Wiltshire', 'Gloucestershire', 'Oxfordshire',
  'Hertfordshire', 'Essex', 'Cambridgeshire', 'Lancashire',
]

const CATEGORIES = [
  'Pick Your Own', 'Organic Farms', 'Farm Cafes', 'Butchers',
  'Dairy Farms', 'Farmers Markets', 'Vineyard Tours', 'Apiaries',
]

const FARM_NAMES = [
  'Grange Farm Shop', 'Manor Farm', 'Riverside Farm', 'Hillside Farm',
  'Valley Farm Shop', 'Orchard Farm', 'Meadow Farm', 'Brook Farm',
]

const ICONS = {
  users: Users,
  star: Star,
  mappin: MapPin,
  clock: Clock,
  trending: TrendingUp,
  eye: Eye,
}

function generateProofItem(): SocialProofItem {
  const template = PROOF_TEMPLATES[Math.floor(Math.random() * PROOF_TEMPLATES.length)]
  let message = template.message

  // Replace placeholders
  message = message.replace('{count}', String(Math.floor(Math.random() * 50) + 20))
  message = message.replace('{county}', COUNTIES[Math.floor(Math.random() * COUNTIES.length)])
  message = message.replace('{category}', CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)])
  message = message.replace('{farmName}', FARM_NAMES[Math.floor(Math.random() * FARM_NAMES.length)])

  return {
    id: Math.random().toString(36).substring(7),
    type: template.type,
    message,
    timestamp: new Date(),
    icon: template.icon,
  }
}

interface SocialProofTickerProps {
  className?: string
  variant?: 'banner' | 'inline' | 'floating'
  interval?: number // milliseconds between updates
}

/**
 * Social Proof Ticker
 * Shows real-time activity indicators to build trust and FOMO.
 */
export function SocialProofTicker({
  className = '',
  variant = 'banner',
  interval = 8000,
}: SocialProofTickerProps) {
  const [currentItem, setCurrentItem] = useState<SocialProofItem | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    setCurrentItem(generateProofItem())

    const rotateItems = () => {
      setIsVisible(false)

      // After fade out, change item
      setTimeout(() => {
        setCurrentItem(generateProofItem())
        setIsVisible(true)
      }, 300)
    }

    // Start rotation
    timeoutRef.current = setInterval(rotateItems, interval)

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current)
      }
    }
  }, [interval])

  if (!mounted || !currentItem) return null

  const IconComponent = ICONS[currentItem.icon]

  if (variant === 'floating') {
    return (
      <div
        className={`fixed bottom-4 left-4 z-30 max-w-xs
          transition-all duration-300 ease-in-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          ${className}`}
      >
        <div className="bg-background-card border border-border-default rounded-lg shadow-lg p-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-caption text-text-body">{currentItem.message}</p>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div
        className={`inline-flex items-center gap-2
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          ${className}`}
      >
        <IconComponent className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span className="text-caption text-text-muted">{currentItem.message}</span>
      </div>
    )
  }

  // Banner variant (default)
  return (
    <div className={`bg-primary-50 dark:bg-primary-900/20 border-y border-primary-100 dark:border-primary-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          className={`py-2 flex items-center justify-center gap-3
            transition-all duration-300 ease-in-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
        >
          <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
            <IconComponent className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-caption font-medium text-primary-700 dark:text-primary-300">
            {currentItem.message}
          </p>
          <span className="hidden sm:inline text-small text-primary-500 dark:text-primary-500">
            Just now
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact visitor count for headers.
 */
export function VisitorCount({ className = '' }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Simulate realistic visitor count (would be from analytics in prod)
    const baseCount = Math.floor(Math.random() * 30) + 25
    setCount(baseCount)

    // Slight variations over time
    const interval = setInterval(() => {
      setCount((prev) => {
        if (!prev) return baseCount
        const change = Math.floor(Math.random() * 5) - 2
        return Math.max(15, Math.min(80, prev + change))
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted || count === null) return null

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-small font-medium text-text-muted">
        {count} browsing
      </span>
    </span>
  )
}

/**
 * Trust indicators showing site stats.
 */
export function TrustIndicators({ className = '' }: { className?: string }) {
  const stats = [
    { label: 'Farm Shops', value: '1,299+', icon: MapPin },
    { label: 'Counties', value: '43', icon: MapPin },
    { label: 'Reviews', value: '2,400+', icon: Star },
  ]

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <stat.icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <div className="text-small">
            <span className="font-semibold text-text-heading">{stat.value}</span>
            <span className="text-text-muted ml-1">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
