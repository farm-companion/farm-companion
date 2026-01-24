import { Badge } from './ui/Badge'
import Link from 'next/link'

interface CountyStatsProps {
  stats: {
    total: number
    verified: number
    featured: number
    averageRating: number
    topCategories: Array<{
      name: string
      slug: string
      count: number
    }>
  }
  countyName: string
}

export function CountyStats({ stats, countyName }: CountyStatsProps) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-brand-primary">{stats.total}</div>
            <div className="text-caption text-slate-600 dark:text-slate-400">Total Farms</div>
          </div>
          {stats.verified > 0 && (
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.verified}
              </div>
              <div className="text-caption text-slate-600 dark:text-slate-400">Verified</div>
            </div>
          )}
          {stats.featured > 0 && (
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.featured}
              </div>
              <div className="text-caption text-slate-600 dark:text-slate-400">Featured</div>
            </div>
          )}
          {stats.averageRating > 0 && (
            <div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-caption text-slate-600 dark:text-slate-400">Avg Rating</div>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      {stats.topCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">
            Popular Categories in {countyName}
          </h2>
          <div className="space-y-3">
            {stats.topCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}?county=${countyName}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-brand-primary transition-colors">
                  {category.name}
                </span>
                <Badge variant="outline" size="sm">
                  {category.count}
                </Badge>
              </Link>
            ))}
          </div>
          <Link
            href="/categories"
            className="block mt-4 text-caption text-brand-primary hover:underline text-center"
          >
            View all categories →
          </Link>
        </div>
      )}
    </div>
  )
}
