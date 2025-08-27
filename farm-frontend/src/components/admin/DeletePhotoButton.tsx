'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deletePhotoAction } from '@/app/admin/photos/actions'

interface DeletePhotoButtonProps {
  photoId: string
  photoDescription: string
  onDelete?: () => void
}

export default function DeletePhotoButton({ photoId, photoDescription, onDelete }: DeletePhotoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [reason, setReason] = useState('')

  const handleDelete = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    setIsDeleting(true)
    try {
      await deletePhotoAction(photoId, reason)
      setShowConfirm(false)
      setReason('')
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('Failed to delete photo. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
        disabled={isDeleting}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Photo
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deletion Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for deletion..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setReason('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting || !reason.trim()}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
