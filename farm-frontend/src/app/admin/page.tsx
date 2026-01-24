import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Farm Companion',
  description: 'Farm Companion administration panel',
}

export default async function AdminDashboardPage() {
  // Require authentication
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-caption text-gray-600 dark:text-gray-400">
                Welcome back, {user?.email}
              </p>
            </div>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-caption font-medium transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Photo Management Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Photo Management
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      Review and manage photo submissions
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/photos"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-caption font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Manage Photos
                  </Link>
                </div>
              </div>
            </div>

            {/* Farm Submissions Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Farm Submissions
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      Review new farm shop submissions
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/farms"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-caption font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Review Submissions
                  </Link>
                </div>
              </div>
            </div>

            {/* Claims Management Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Claims Management
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      Review farm shop ownership claims
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/claims"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-caption font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Manage Claims
                  </Link>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Analytics
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      View site statistics and insights
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 border border-transparent text-caption font-medium rounded-md text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Produce Management Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Produce Management
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      Manage seasonal produce images
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/admin/produce"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-caption font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Manage Produce
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-body font-medium text-gray-900 dark:text-white">
                      Quick Actions
                    </h3>
                    <p className="text-caption text-gray-500 dark:text-gray-400">
                      Common administrative tasks
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <Link
                    href="/add"
                    className="block w-full text-left px-4 py-2 text-caption text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    Add Farm Shop
                  </Link>
                  <Link
                    href="/map"
                    className="block w-full text-left px-4 py-2 text-caption text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    View Map
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full text-left px-4 py-2 text-caption text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    Contact Form
                  </Link>
                  <Link
                    href="/"
                    className="block w-full text-left px-4 py-2 text-caption text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    View Site
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
