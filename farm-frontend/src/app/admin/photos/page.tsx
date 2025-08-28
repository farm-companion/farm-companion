import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import redis from '@/lib/redis'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Photo Management - Farm Companion',
  description: 'Review and manage photo submissions',
}

export default async function AdminPhotosPage() {
  // Require authentication
  const user = await requireAuth()

  // Get pending photos from Redis
  const pendingIds = await redis.lRange('moderation:queue', 0, -1)
  const pending = await Promise.all(pendingIds.map(async (id) => {
    const photoData = await redis.hGetAll(`photo:${id}`)
    if (!photoData || Object.keys(photoData).length === 0) return null
    
    // Convert Redis hash to object
    const photo: Record<string, string> = {}
    for (const [key, value] of Object.entries(photoData)) {
      photo[key] = String(value)
    }
    return photo
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Photo Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review and manage photo submissions
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!pending.length ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending photos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All photos have been reviewed.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {pending.map((p) => p && (
                  <li key={p.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <img 
                              className="h-16 w-16 object-cover rounded-lg" 
                              src={p.url} 
                              alt={p.caption || 'Farm photo'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {p.farmSlug}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {p.caption || 'No caption'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              By: {p.authorName || 'Anonymous'} • {p.authorEmail || 'No email'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Submitted: {new Date(Number(p.createdAt)).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <form action={`/admin/photos/approve?id=${p.id}`} method="post">
                          <button 
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={`/admin/photos/reject?id=${p.id}`} method="post">
                          <button 
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
