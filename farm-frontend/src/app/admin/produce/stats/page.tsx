import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getProduceStats, getAllProduce, getCurrentMonth, getMonthName } from '@/lib/produce-integration'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Produce Statistics - Admin Dashboard',
  description: 'Statistics and analytics for the produce images system',
  keywords: 'admin, produce statistics, analytics, farm companion',
}

export default async function AdminProduceStatsPage() {
  // Require authentication
  await requireAuth()
  
  // Get data
  const [stats, produce] = await Promise.all([
    getProduceStats(),
    getAllProduce()
  ])

  const currentMonth = getCurrentMonth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-display font-bold text-gray-900 dark:text-white">
                Produce Statistics
              </h1>
              <p className="text-caption text-gray-600 dark:text-gray-400">
                System usage and analytics for produce images
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/produce"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-caption font-medium transition-colors"
              >
                Back to Produce
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {!stats ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-caption font-medium text-yellow-800 dark:text-yellow-200">
                    No Data Available
                  </h3>
                  <div className="mt-2 text-caption text-yellow-700 dark:text-yellow-300">
                    <p>Statistics are not available. This could mean the produce-images system is not running or there are no images uploaded yet.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Total Images</h3>
                  <p className="text-display font-bold text-indigo-600 dark:text-indigo-400">{stats.totalImages}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Storage Used</h3>
                  <p className="text-display font-bold text-green-600 dark:text-green-400">
                    {(stats.storageUsed / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Total Produce</h3>
                  <p className="text-display font-bold text-orange-600 dark:text-orange-400">{produce.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Last Upload</h3>
                  <p className="text-caption font-bold text-purple-600 dark:text-purple-400">
                    {new Date(stats.lastUpload).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Images by Month */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-heading font-medium text-gray-900 dark:text-white">
                    Images by Month
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const count = stats.imagesByMonth[month] || 0
                      const isCurrentMonth = month === currentMonth
                      
                      return (
                        <div 
                          key={month} 
                          className={`p-4 rounded-lg border ${
                            isCurrentMonth 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`text-display font-bold ${
                              isCurrentMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {count}
                            </div>
                            <div className={`text-caption ${
                              isCurrentMonth ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {getMonthName(month).slice(0, 3)}
                            </div>
                            {isCurrentMonth && (
                              <div className="text-captionall text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                                Current
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Images by Produce */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-heading font-medium text-gray-900 dark:text-white">
                    Images by Produce
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {produce.map((item) => {
                      const count = stats.imagesByProduce[item.slug] || 0
                      const isInSeason = item.monthsInSeason?.includes(currentMonth)
                      const isPeak = item.peakMonths?.includes(currentMonth)
                      
                      return (
                        <div key={item.slug} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                {isPeak && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-captionall font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Peak
                                  </span>
                                )}
                                {isInSeason && !isPeak && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-captionall font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    In Season
                                  </span>
                                )}
                                <span className="text-caption text-gray-500 dark:text-gray-400">
                                  {item.monthsInSeason?.map(m => getMonthName(m).slice(0, 3)).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-display font-bold text-gray-900 dark:text-white">{count}</div>
                            <div className="text-caption text-gray-500 dark:text-gray-400">images</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
