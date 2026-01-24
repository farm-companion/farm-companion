import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import FarmReviewInterface from '@/components/admin/FarmReviewInterface'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Farm Submissions - Admin Dashboard',
  description: 'Review and manage farm shop submissions',
}

export default async function AdminFarmsPage() {
  // Require authentication
  await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Farm Submissions
              </h1>
              <p className="text-caption text-gray-600 dark:text-gray-400">
                Review and manage farm shop submissions
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
          <FarmReviewInterface />
        </div>
      </main>
    </div>
  )
}
