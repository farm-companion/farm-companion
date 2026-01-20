import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { 
  getAllProduce, 
  getProduceStats, 
  getCurrentMonth, 
  getMonthName,
  validateProduceIntegration 
} from '@/lib/produce-integration'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Produce Management - Admin Dashboard',
  description: 'Manage seasonal produce images and content',
  keywords: 'admin, produce management, seasonal, farm companion',
}

export default async function AdminProducePage() {
  // Require authentication
  await requireAuth()
  
  // Get data
  const [produce, stats, integrationStatus] = await Promise.all([
    getAllProduce(),
    getProduceStats(),
    validateProduceIntegration()
  ])

  const currentMonth = getCurrentMonth()
  const currentMonthName = getMonthName(currentMonth)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-heading font-bold text-gray-900 dark:text-white">
                Produce Management
              </h1>
              <p className="text-caption text-gray-600 dark:text-gray-400">
                Manage seasonal produce images and content
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-body font-medium transition-colors"
              >
                Back to Admin
              </Link>
              <Link
                href="/admin/produce/upload"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-body font-medium transition-colors"
              >
                Upload Images
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Integration Status */}
          {!integrationStatus.valid && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-caption font-medium text-red-800 dark:text-red-200">
                    Integration Issue
                  </h3>
                  <div className="mt-2 text-caption text-red-700 dark:text-red-300">
                    <ul className="list-disc pl-5 space-y-1">
                      {integrationStatus.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Total Produce</h3>
              <p className="text-heading font-bold text-indigo-600 dark:text-indigo-400">{produce.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Total Images</h3>
              <p className="text-heading font-bold text-green-600 dark:text-green-400">
                {stats?.totalImages || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Storage Used</h3>
              <p className="text-heading font-bold text-orange-600 dark:text-orange-400">
                {stats ? `${(stats.storageUsed / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-heading font-semibold text-gray-900 dark:text-white">Current Month</h3>
              <p className="text-heading font-bold text-purple-600 dark:text-purple-400">{currentMonthName}</p>
            </div>
          </div>

          {/* Produce Grid */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-heading font-medium text-gray-900 dark:text-white">
                All Produce Items
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produce.map((item) => {
                  const imageCount = stats?.imagesByProduce[item.slug] || 0
                  const isInSeason = item.monthsInSeason?.includes(currentMonth)
                  const isPeak = item.peakMonths?.includes(currentMonth)
                  
                  return (
                    <div key={item.slug} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <div className="flex gap-1">
                          {isPeak && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-small font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Peak
                            </span>
                          )}
                          {isInSeason && !isPeak && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-small font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              In Season
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-caption text-gray-600 dark:text-gray-400">
                        <p>Images: {imageCount}</p>
                        <p>Season: {item.monthsInSeason?.map(m => getMonthName(m).slice(0, 3)).join(', ')}</p>
                        {item.peakMonths && item.peakMonths.length > 0 && (
                          <p>Peak: {item.peakMonths.map(m => getMonthName(m).slice(0, 3)).join(', ')}</p>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/admin/produce/upload?produce=${item.slug}`}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-body font-medium transition-colors text-center"
                        >
                          Upload Images
                        </Link>
                        <Link
                          href={`/seasonal/${item.slug}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-body font-medium transition-colors"
                          target="_blank"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-heading font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/produce/upload"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Upload Images</h3>
                  <p className="text-caption text-gray-500 dark:text-gray-400">Add new produce images</p>
                </div>
              </Link>
              
              <Link
                href="/admin/produce/stats"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">View Statistics</h3>
                  <p className="text-caption text-gray-500 dark:text-gray-400">System usage and analytics</p>
                </div>
              </Link>
              
              <Link
                href="/seasonal"
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                target="_blank"
              >
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Preview Site</h3>
                  <p className="text-caption text-gray-500 dark:text-gray-400">View seasonal produce page</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
