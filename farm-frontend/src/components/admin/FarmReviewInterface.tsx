'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Phone, 
  Mail, 
  Globe, 
  Image as ImageIcon,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FarmSubmission {
  id: string
  name: string
  slug: string
  location: {
    address: string
    county: string
    postcode: string
    lat?: number
    lng?: number
  }
  contact: {
    website?: string
    email?: string
    phone?: string
  }
  hours: Array<{
    day: string
    open: string
    close: string
  }>
  offerings: string[]
  story?: string
  images: Array<{
    id: string
    name: string
    size: number
    type: string
    url?: string
  }>
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  approvedAt?: string
  approvedBy?: string
}

export default function FarmReviewInterface() {
  const [submissions, setSubmissions] = useState<FarmSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<FarmSubmission | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      // This would fetch from your API
      const response = await fetch('/api/admin/farms')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.status === filter
    const matchesSearch = submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.location.county.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleReview = async (submissionId: string, action: 'approve' | 'reject' | 'request_changes', notes?: string) => {
    try {
      setReviewing(true)
      const response = await fetch(`/api/admin/farms/${submissionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes,
          reviewedBy: 'admin@farmcompanion.co.uk' // This would come from auth
        }),
      })

      if (response.ok) {
        await loadSubmissions()
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error reviewing submission:', error)
    } finally {
      setReviewing(false)
    }
  }

  const handleMoveToLive = async (submissionId: string) => {
    try {
      setReviewing(true)
      const response = await fetch('/api/admin/farms/approve-to-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmId: submissionId
        }),
      })

      if (response.ok) {
        await loadSubmissions()
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Error moving farm to live:', error)
    } finally {
      setReviewing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'changes_requested':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-small rounded-full font-medium"
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'changes_requested':
        return `${baseClasses} bg-orange-100 text-orange-800`
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-serum" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-caption font-medium text-gray-500 dark:text-gray-400">Changes Requested</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'changes_requested').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search farms by name or county..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-serum focus:border-serum bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'approved' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              Approved
            </Button>
            <Button
              variant={filter === 'rejected' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </Button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-body font-medium text-gray-900 dark:text-white">
            Farm Submissions ({filteredSubmissions.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredSubmissions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No submissions found</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(submission.status)}
                    <div>
                      <h4 className="text-caption font-medium text-gray-900 dark:text-white">
                        {submission.name}
                      </h4>
                      <p className="text-caption text-gray-500 dark:text-gray-400">
                        {submission.location.address}, {submission.location.county}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={getStatusBadge(submission.status)}>
                          {submission.status.replace('_', ' ')}
                        </span>
                        <span className="text-small text-gray-400">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        {submission.images.length > 0 && (
                          <span className="text-small text-gray-400 flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            {submission.images.length} images
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detailed Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-heading font-semibold text-gray-900 dark:text-white">
                  Review: {selectedSubmission.name}
                </h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Farm Details */}
              <div>
                <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Farm Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-gray-500 dark:text-gray-400">Farm ID</label>
                    <p className="text-caption text-gray-900 dark:text-white font-mono">{selectedSubmission.id}</p>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-gray-500 dark:text-gray-400">Slug</label>
                    <p className="text-caption text-gray-900 dark:text-white">{selectedSubmission.slug}</p>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-gray-500 dark:text-gray-400">Address</label>
                    <p className="text-caption text-gray-900 dark:text-white">{selectedSubmission.location.address}</p>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-gray-500 dark:text-gray-400">County</label>
                    <p className="text-caption text-gray-900 dark:text-white">{selectedSubmission.location.county}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedSubmission.contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-caption text-gray-900 dark:text-white">{selectedSubmission.contact.email}</span>
                    </div>
                  )}
                  {selectedSubmission.contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-caption text-gray-900 dark:text-white">{selectedSubmission.contact.phone}</span>
                    </div>
                  )}
                  {selectedSubmission.contact.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a 
                        href={selectedSubmission.contact.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-caption text-serum hover:underline"
                      >
                        {selectedSubmission.contact.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Offerings */}
              {selectedSubmission.offerings.length > 0 && (
                <div>
                  <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Offerings</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.offerings.map((offering, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-serum/10 text-serum text-small rounded-full"
                      >
                        {offering}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Story */}
              {selectedSubmission.story && (
                <div>
                  <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Farm Story</h3>
                  <p className="text-caption text-gray-900 dark:text-white">{selectedSubmission.story}</p>
                </div>
              )}

              {/* Images */}
              {selectedSubmission.images.length > 0 && (
                <div>
                  <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">
                    Images ({selectedSubmission.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedSubmission.images.map((image) => (
                      <div key={image.id} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {image.url ? (
                          <img 
                            src={image.url} 
                            alt={image.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-small text-gray-500">{image.name}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Review Actions</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => handleReview(selectedSubmission.id, 'approve')}
                      disabled={reviewing}
                      variant="primary"
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedSubmission.id, 'reject')}
                      disabled={reviewing}
                      variant="secondary"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedSubmission.id, 'request_changes')}
                      disabled={reviewing}
                      variant="tertiary"
                      className="flex-1"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Move to Live Action */}
              {selectedSubmission.status === 'approved' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-body font-medium text-gray-900 dark:text-white mb-4">Live Directory</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => handleMoveToLive(selectedSubmission.id)}
                      disabled={reviewing}
                      variant="primary"
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Move to Live Directory
                    </Button>
                  </div>
                  <p className="text-caption text-gray-500 dark:text-gray-400 mt-2">
                    This will make the farm visible on the public map and directory
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
