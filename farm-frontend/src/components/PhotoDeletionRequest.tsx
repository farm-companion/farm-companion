'use client'

import { useState } from 'react'

interface PhotoDeletionRequestProps {
  photoId: string
  onRequestSubmitted: () => void
}

export default function PhotoDeletionRequest({ photoId, onRequestSubmitted }: PhotoDeletionRequestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [email, setEmail] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/photos/deletion-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId,
          reason,
          requesterEmail: email,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setReason('')
        setEmail('')
        onRequestSubmitted()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Deletion Request Submitted
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your request has been submitted and will be reviewed by our team. You will receive an email confirmation shortly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Request Photo Deletion
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          If you believe this photo should be removed, please provide a reason and your contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Reason for Deletion *
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-yellow-300 dark:border-yellow-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white sm:text-sm"
            placeholder="Please explain why this photo should be removed..."
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Your Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-yellow-300 dark:border-yellow-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white sm:text-sm"
            placeholder="your.email@example.com"
          />
        </div>

        {submitStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to submit request. Please try again.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
