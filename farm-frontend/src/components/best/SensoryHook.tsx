'use client'

import { Leaf, Sun, Droplets } from 'lucide-react'

interface SensoryHookProps {
  category?: string
  className?: string
}

const SENSORY_CONTENT = {
  organic: {
    icon: Leaf,
    hook: "The scent of rich, untreated soil. The satisfying crunch of a carrot pulled fresh from the earth. The deep, honest flavour that only comes from farming done right.",
    accent: "text-emerald-600 dark:text-emerald-400",
    bgAccent: "bg-emerald-50 dark:bg-emerald-950/30",
    borderAccent: "border-emerald-200 dark:border-emerald-800",
  },
  pyo: {
    icon: Sun,
    hook: "Sun-warmed strawberries bursting with sweetness. The simple joy of filling your own basket. The taste of summer, picked at the perfect moment.",
    accent: "text-amber-600 dark:text-amber-400",
    bgAccent: "bg-amber-50 dark:bg-amber-950/30",
    borderAccent: "border-amber-200 dark:border-amber-800",
  },
  'farm-shop': {
    icon: Droplets,
    hook: "Morning dew still clinging to fresh greens. Shelves lined with honest, local produce. The connection between land, farmer, and your table.",
    accent: "text-sky-600 dark:text-sky-400",
    bgAccent: "bg-sky-50 dark:bg-sky-950/30",
    borderAccent: "border-sky-200 dark:border-sky-800",
  },
}

export function SensoryHook({ category = 'farm-shop', className = '' }: SensoryHookProps) {
  const content = SENSORY_CONTENT[category as keyof typeof SENSORY_CONTENT] || SENSORY_CONTENT['farm-shop']
  const Icon = content.icon

  return (
    <div className={`relative overflow-hidden ${content.bgAccent} border-y ${content.borderAccent} ${className}`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-white/40 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-white/30 to-transparent rounded-full translate-x-1/3 translate-y-1/3 blur-2xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${content.bgAccent} border-2 ${content.borderAccent} mb-6`}>
            <Icon className={`w-7 h-7 ${content.accent}`} />
          </div>

          <p className="text-xl md:text-2xl font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed">
            &ldquo;{content.hook}&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
