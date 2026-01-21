'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

function AdminLoginContent() {
  const searchParams = useSearchParams()

  const errorParam = searchParams.get('error')
  const errorMessage = errorParam ? {
    'missing-credentials': 'Please enter both email and password.',
    'invalid-credentials': 'Invalid email or password. Please try again.',
    'server-error': 'Server error. Please try again later.',
  }[errorParam] || 'An error occurred. Please try again.' : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-brand-primary rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-display font-extrabold text-gray-900 dark:text-white">
            Admin Access
          </h2>
          <p className="mt-2 text-center text-caption text-gray-600 dark:text-gray-400">
            Sign in to access the Farm Companion admin panel
          </p>
        </div>
        
        <AdminLoginForm errorMessage={errorMessage} />
        
        <div className="text-center">
          <Link 
            href="/" 
            className="text-caption text-brand-primary hover:text-brand-primary/80 transition-colors"
          >
            ← Back to Farm Companion
          </Link>
        </div>
      </div>
    </div>
  )
}

function AdminLoginForm({ errorMessage }: { errorMessage: string | null }) {
  return (
    <form action="/api/admin/login" method="POST" className="mt-8 space-y-6">
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-caption text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-caption font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-caption"
          placeholder="admin@farmcompanion.co.uk"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-caption font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-caption"
          placeholder="Enter your password"
        />
      </div>

      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-caption font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
        >
          Sign in to Admin Panel
        </button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-caption text-yellow-800 dark:text-yellow-200">
              <strong>Security Notice:</strong> This is a restricted admin area. Unauthorized access attempts will be logged.
            </p>
          </div>
        </div>
      </div>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
