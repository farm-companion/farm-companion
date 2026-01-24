'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface FarmPhotoStats {
  farmSlug: string
  stats: {
    pending: number
    approved: number
    rejected: number
    total: number
    quota: {
      current: number
      max: number
      remaining: number
    }
    recentUploads: number
    uploadHistory: Array<{
      id: string
      caption: string
      authorName: string
      approvedAt: number
      date: string
    }>
  }
  photos: Array<{
    id: string
    caption: string
    authorName: string
    authorEmail: string
    createdAt: number
    approvedAt: number
    url: string
  }>
}

interface FarmPhotoTrackerProps {
  farmSlug?: string
  showDetails?: boolean
  className?: string
}

export default function FarmPhotoTracker({ 
  farmSlug, 
  showDetails = false,
  className = ""
}: FarmPhotoTrackerProps) {
  const [stats, setStats] = useState<FarmPhotoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [farmSlug])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = farmSlug 
        ? `/api/admin/farms/photo-stats?farmSlug=${encodeURIComponent(farmSlug)}`
        : '/api/admin/farms/photo-stats'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch photo statistics')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-background-surface border border-border-default/30 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-serum border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-text-muted">Loading photo statistics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Error loading photo statistics: {error}</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`bg-background-surface border border-border-default/30 rounded-xl p-6 ${className}`}>
        <div className="text-center text-text-muted">
          No photo statistics available
        </div>
      </div>
    )
  }

  const { quota } = stats.stats
  const isQuotaFull = quota.current >= quota.max
  const quotaPercentage = (quota.current / quota.max) * 100

  return (
    <div className={`bg-background-surface border border-border-default/30 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border-default/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-serum/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-serum" />
            </div>
            <div>
              <h3 className="font-semibold text-text-heading">
                {farmSlug ? `${farmSlug} Photo Stats` : 'Farm Photo Statistics'}
              </h3>
              <p className="text-caption text-text-muted">
                Photo upload tracking and quota management
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 text-text-muted hover:text-text-body hover:bg-border-default/50 rounded-lg transition-colors"
            title="Refresh statistics"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-text-heading">{stats.stats.approved}</p>
            <p className="text-small text-text-muted">Approved</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-text-heading">{stats.stats.pending}</p>
            <p className="text-small text-text-muted">Pending</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-text-heading">{stats.stats.rejected}</p>
            <p className="text-small text-text-muted">Rejected</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-serum/10 rounded-lg mx-auto mb-2">
              <Upload className="w-6 h-6 text-serum" />
            </div>
            <p className="text-2xl font-bold text-text-heading">{stats.stats.total}</p>
            <p className="text-small text-text-muted">Total</p>
          </div>
        </div>

        {/* Quota Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-heading">Photo Quota</h4>
            <span className={`text-caption font-medium ${
              isQuotaFull ? 'text-red-600' : 'text-text-muted'
            }`}>
              {quota.current}/{quota.max}
            </span>
          </div>
          
          <div className="w-full bg-border-default/30 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isQuotaFull 
                  ? 'bg-red-500' 
                  : quotaPercentage > 80 
                    ? 'bg-amber-500' 
                    : 'bg-serum'
              }`}
              style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-small text-text-muted">
            <span>
              {quota.remaining > 0 
                ? `${quota.remaining} slots remaining`
                : 'Quota full - new photos will replace oldest'
              }
            </span>
            {stats.stats.recentUploads > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.stats.recentUploads} recent
              </span>
            )}
          </div>
        </div>

        {/* Recent Uploads */}
        {showDetails && stats.stats.uploadHistory.length > 0 && (
          <div className="border-t border-border-default/30 pt-6">
            <h4 className="font-medium text-text-heading mb-4">Recent Uploads</h4>
            <div className="space-y-3">
              {stats.stats.uploadHistory.slice(0, 5).map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-3 bg-background-canvas rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-text-heading truncate">
                      {upload.caption || 'No caption'}
                    </p>
                    <p className="text-small text-text-muted">
                      by {upload.authorName} • {new Date(upload.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/shop/${farmSlug}`}
                    className="p-1 text-text-muted hover:text-serum transition-colors"
                    title="View farm page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-6 border-t border-border-default/30">
          <Link
            href={`/admin/photos${farmSlug ? `?farm=${farmSlug}` : ''}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors text-caption font-medium"
          >
            <Eye className="w-4 h-4" />
            Manage Photos
          </Link>
          
          {farmSlug && (
            <Link
              href={`/shop/${farmSlug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-border-default text-text-body rounded-lg hover:bg-border-default/50 transition-colors text-caption"
            >
              <ExternalLink className="w-4 h-4" />
              View Farm
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
