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
      <div className="bg-surface rounded-[2px] border border-border p-6">
        <h2 className="font-semibold text-ink mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-brand">{stats.total}</div>
            <div className="text-caption text-ink-muted">Total Farms</div>
          </div>
          {stats.verified > 0 && (
            <div>
              <div className="text-2xl font-bold text-accent">
                {stats.verified}
              </div>
              <div className="text-caption text-ink-muted">Verified</div>
            </div>
          )}
          {stats.featured > 0 && (
            <div>
              <div className="text-2xl font-bold text-ink">
                {stats.featured}
              </div>
              <div className="text-caption text-ink-muted">Featured</div>
            </div>
          )}
          {stats.averageRating > 0 && (
            <div>
              <div className="text-2xl font-bold text-ink">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-caption text-ink-muted">Avg Rating</div>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      {stats.topCategories.length > 0 && (
        <div className="bg-surface rounded-[2px] border border-border p-6">
          <h2 className="font-semibold text-ink mb-4">
            Popular Categories in {countyName}
          </h2>
          <div className="space-y-3">
            {stats.topCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}?county=${countyName}`}
                className="flex items-center justify-between p-3 rounded-[2px] hover:bg-surface-2 transition-colors group"
              >
                <span className="text-ink group-hover:text-brand transition-colors">
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
            className="block mt-4 text-caption text-brand hover:underline text-center"
          >
            View all categories →
          </Link>
        </div>
      )}
    </div>
  )
}
